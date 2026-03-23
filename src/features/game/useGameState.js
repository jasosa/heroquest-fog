import { useState, useEffect, useCallback, useRef } from "react";
import { BOARD, ROWS, COLS } from "../../map.js";
import { makeComputeReveal, hasVisibleDoorForRoom } from "../../reveal.js";
import { getCoveredCellKeys } from "../../pieceGeometry.js";
import { PIECES } from "../../pieces.js";
import { placeNoteMarker, updateNoteMarker, setMonsterSpecial } from "../../placementState.js";
import { moveSearchMarker, setSearchNoteAt, normalizeSearchNotes, removeSearchMarker } from "../../searchMarkers.js";

export const SEARCH_MAX = 4;

export function incrementSearchCount(counts, regionId) {
  const current = counts[regionId] ?? 0;
  if (current >= SEARCH_MAX) return counts;
  return { ...counts, [regionId]: current + 1 };
}

export function resetSearchCounts() {
  return {};
}

export function hasHeroStart(placed) {
  return Object.values(placed).some(p => p.type === "start" || p.overlayMarker === "start");
}

const computeReveal = makeComputeReveal(BOARD, ROWS, COLS);

// advanced-use-latest: stable ref that always holds the latest value,
// lets callbacks read current state without listing it as a dependency.
export function useLatest(value) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}

// ═══════════════════════════════════════════════
//  GAME STATE HOOK
// ═══════════════════════════════════════════════
export function useGameState({ initialPlaced = {}, initialDoors = {}, initialSearchMarkers = null, initialSearchNotes = null, initialMode = "play", initialTitle = "Untitled Quest", initialDescription = "" } = {}) {
  // rerender-lazy-state-init: pass a function so new Set() runs only once,
  // not on every render.
  const [fog, setFog]             = useState(() => new Set());
  const [placed, setPlaced]       = useState(initialPlaced);
  const [doors, setDoors]         = useState(initialDoors);
  const [mode, setMode]           = useState(initialMode);
  const [tool, setTool]           = useState("goblin");
  const [rotation, setRotation]   = useState(0);
  const [lastClick, setLastClick] = useState(null);
  const [questTitle, setQuestTitle]             = useState(initialTitle);
  const [questDescription, setQuestDescription] = useState(initialDescription);
  const [saveError, setSaveError]               = useState(null);
  const [pendingRoomReveal, setPendingRoomReveal] = useState(null); // {r,c}|null

  // Note markers
  const [pendingNoteEdit, setPendingNoteEdit] = useState(null); // {anchorKey,note}|null

  // Feature B: Special Monsters
  const [pendingMonsterAnnotation, setPendingMonsterAnnotation] = useState(null); // {anchorKey}|null

  // Search markers: one per room region (user-placed, no auto-init)
  const [searchMarkers, setSearchMarkers] = useState(
    () => initialSearchMarkers ?? {}
  );
  const [searchNotes, setSearchNotes] = useState(() => normalizeSearchNotes(initialSearchNotes ?? {}));
  const [searchedCounts, setSearchedCounts] = useState(() => ({})); // session-only: Record<regionId, number>
  const [pendingSearchEdit, setPendingSearchEdit]   = useState(null); // {regionId}|null
  const [pendingSearchView, setPendingSearchView]   = useState(null); // {regionId,notes,count}|null

  // advanced-use-latest: stable refs so handleCell needs no dependencies.
  const placedRef   = useLatest(placed);
  const modeRef     = useLatest(mode);
  const toolRef     = useLatest(tool);
  const rotationRef = useLatest(rotation);
  const fogRef      = useLatest(fog);
  const doorsRef    = useLatest(doors);
  const pendingRoomRevealRef    = useLatest(pendingRoomReveal);
  const searchNotesRef          = useLatest(searchNotes);
  // Selecting a new tool always resets rotation to 0.
  const handleSetTool = useCallback((newTool) => {
    setTool(newTool);
    setRotation(0);
  }, []);

  // Auto-reveal Hero Start positions when entering play mode.
  useEffect(() => {
    if (mode !== "play") return;
    const currentPlaced = placedRef.current;
    const starts = Object.entries(currentPlaced)
      .filter(([, v]) => v.type === "start" || v.overlayMarker === "start")
      .map(([k]) => k);
    if (starts.length === 0) return;
    setFog(prev => {
      const next = new Set(prev);
      for (const k of starts) {
        const [r, c] = k.split(",").map(Number);
        computeReveal(r, c, currentPlaced).forEach(cell => next.add(cell));
      }
      return next;
    });
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCell = useCallback((r, c) => {
    const region = BOARD[r]?.[c];
    if (!region) return;
    const k = `${r},${c}`;
    if (modeRef.current === "edit") {
      const currentTool     = toolRef.current;
      const currentRotation = rotationRef.current;
      const piece           = PIECES[currentTool];

      // Edge pieces (doors) sit between cells — handled separately.
      if (piece?.isEdge) {
        setDoors(prev => {
          const next = { ...prev };
          // Toggle: remove if already placed at this anchor, otherwise place at rotation 0 (right edge).
          if (next[k]) delete next[k];
          else         next[k] = { rotation: 0, type: currentTool };
          return next;
        });
        return;
      }

      // Search tool: move the search marker for the clicked cell's region.
      if (currentTool === "search") {
        setSearchMarkers(prev => moveSearchMarker(prev, BOARD, r, c));
        return;
      }

      // Note markers: click on existing opens dialog; click on empty places then opens dialog.
      if (currentTool === "notemarker") {
        const existing = placedRef.current[k];
        if (existing?.type === "notemarker") {
          setPendingNoteEdit({ anchorKey: k, note: existing.note ?? "" });
        } else {
          setPlaced(prev => placeNoteMarker(prev, r, c, ""));
          setPendingNoteEdit({ anchorKey: k, note: "" });
        }
        return;
      }

      setPlaced(prev => {
        const next = { ...prev };
        const isIncomingMarker = !piece.cells && !piece.image;

        if (isIncomingMarker) {
          // Markers (1×1, no image) stack on top of furniture.
          const existingAtAnchor = next[k];
          if (existingAtAnchor) {
            const existingDef = PIECES[existingAtAnchor.type];
            const existingIsMarker = !existingDef?.cells && !existingDef?.image;
            if (existingIsMarker) {
              delete next[k]; // toggle off stacked marker entry
            } else {
              // Anchor belongs to furniture — store/toggle as overlayMarker.
              if (existingAtAnchor.overlayMarker) {
                const { overlayMarker: _removed, ...rest } = existingAtAnchor;
                next[k] = rest;
              } else {
                next[k] = { ...existingAtAnchor, overlayMarker: currentTool };
              }
            }
          } else {
            // No anchor at k: place marker (even if covered by furniture).
            const coveredCells = getCoveredCellKeys(r, c, piece.cells, currentRotation);
            next[k] = { type: currentTool, blocks: piece.blocks, rotation: currentRotation, coveredCells };
          }
        } else {
          // Non-marker: click on any cell covered by a piece removes it.
          const coveringAnchor = Object.keys(next).find(ak =>
            (next[ak].coveredCells ?? [ak]).includes(k)
          );
          if (coveringAnchor) {
            delete next[coveringAnchor];
          } else {
            // Place new piece; reject if any covered cell is already occupied.
            const coveredCells = getCoveredCellKeys(r, c, piece.cells, currentRotation);
            const hasOverlap = coveredCells.some(ck =>
              Object.keys(next).some(ak => (next[ak].coveredCells ?? [ak]).includes(ck))
            );
            if (!hasOverlap)
              next[k] = { type: currentTool, blocks: piece.blocks, rotation: currentRotation, coveredCells };
          }
        }
        return next;
      });
    } else {
      setLastClick(k);
      if (region !== "C") {
        // Room cell: require a visible connecting door
        if (!hasVisibleDoorForRoom(k, doorsRef.current, fogRef.current, BOARD)) {
          setPendingRoomReveal({ r, c });
          return;
        }
      }
      const visible = computeReveal(r, c, placedRef.current);
      setFog(prev => new Set([...prev, ...visible]));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellRotate = useCallback((r, c) => {
    const k = `${r},${c}`;
    // Rotate a placed multi-cell piece covering this cell.
    setPlaced(prev => {
      const coveringAnchor = Object.keys(prev).find(ak =>
        (prev[ak].coveredCells ?? [ak]).includes(k)
      );
      if (!coveringAnchor) return prev;
      const piece    = prev[coveringAnchor];
      const pieceDef = PIECES[piece.type];
      // 1×1 image pieces can still rotate (CSS rotation applied in TokenOverlay)
      if (!pieceDef?.cells) {
        if (!pieceDef?.image) return prev;
        return { ...prev, [coveringAnchor]: { ...piece, rotation: (piece.rotation + 1) % 4 } };
      }
      const [ar, ac]      = coveringAnchor.split(",").map(Number);
      const newRotation   = (piece.rotation + 1) % 4;
      const newCovered    = getCoveredCellKeys(ar, ac, pieceDef?.cells, newRotation);
      // Reject if the rotated footprint overlaps a different piece.
      const otherPieces   = Object.keys(prev).filter(ak => ak !== coveringAnchor);
      const hasOverlap    = newCovered.some(ck =>
        otherPieces.some(ak => (prev[ak].coveredCells ?? [ak]).includes(ck))
      );
      if (hasOverlap) return prev;
      return { ...prev, [coveringAnchor]: { ...piece, rotation: newRotation, coveredCells: newCovered } };
    });
    // Rotate a door anchored at this cell (0→1→2→3→0).
    setDoors(prev => {
      if (!prev[k]) return prev;
      return { ...prev, [k]: { ...prev[k], rotation: (prev[k].rotation + 1) % 4 } };
    });
  }, []);

  const resetFog = useCallback(() => {
    setFog(new Set());
    setLastClick(null);
    setSearchedCounts({});
  }, []);

  // Note markers: save edits from the dialog.
  const saveNoteMarkerEdit = useCallback((anchorKey, note) => {
    setPlaced(prev => updateNoteMarker(prev, anchorKey, note));
    setPendingNoteEdit(null);
  }, []);

  const deleteNoteMarker = useCallback((anchorKey) => {
    setPlaced(prev => {
      const next = { ...prev };
      delete next[anchorKey];
      return next;
    });
    setPendingNoteEdit(null);
  }, []);

  // Feature B: open special monster annotation dialog from the ★ button in edit mode.
  const openMonsterAnnotation = useCallback((anchorKey) => {
    setPendingMonsterAnnotation({ anchorKey });
  }, []);

  const saveMonsterAnnotation = useCallback((anchorKey, isSpecial, specialNote) => {
    setPlaced(prev => setMonsterSpecial(prev, anchorKey, isSpecial, specialNote));
    setPendingMonsterAnnotation(null);
  }, []);

  // Search marker notes (edit mode).
  const openSearchNoteEdit = useCallback((regionId) => {
    setPendingSearchEdit({ regionId });
  }, []);

  const saveSearchNote = useCallback((regionId, notes) => {
    setSearchNotes(prev => ({ ...prev, [regionId]: notes }));
    setPendingSearchEdit(null);
  }, []);

  const handleRemoveSearchMarker = useCallback((regionId) => {
    setSearchMarkers(prev => removeSearchMarker(prev, regionId));
  }, []);

  // Search marker view (play mode): open popup for current search count.
  const searchedCountsRef      = useLatest(searchedCounts);
  const pendingSearchViewRef   = useLatest(pendingSearchView);
  const viewSearchNote = useCallback((regionId) => {
    const notes = searchNotesRef.current[regionId] ?? [];
    const count = searchedCountsRef.current[regionId] ?? 0;
    setPendingSearchView({ regionId, notes, count });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const closeSearchNote = useCallback(() => {
    const regionId = pendingSearchViewRef.current?.regionId;
    setPendingSearchView(null);
    if (regionId) setSearchedCounts(c => incrementSearchCount(c, regionId));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmPendingReveal = useCallback(() => {
    const p = pendingRoomRevealRef.current;
    if (!p) return;
    const visible = computeReveal(p.r, p.c, placedRef.current);
    setFog(prev => new Set([...prev, ...visible]));
    setPendingRoomReveal(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelPendingReveal = useCallback(() => {
    setPendingRoomReveal(null);
  }, []);

  // Clear pending room reveal when leaving play mode.
  useEffect(() => {
    if (mode !== "play") setPendingRoomReveal(null);
  }, [mode]);

  return {
    fog, placed, doors, mode, tool, rotation, setRotation, lastClick,
    setMode, setTool: handleSetTool, handleCell, handleCellRotate, resetFog,
    questTitle, setQuestTitle, questDescription, setQuestDescription,
    saveError, setSaveError,
    pendingRoomReveal, confirmPendingReveal, cancelPendingReveal,
    // Note markers
    pendingNoteEdit, setPendingNoteEdit,
    saveNoteMarkerEdit, deleteNoteMarker,
    // Feature B: Special Monsters
    pendingMonsterAnnotation,
    openMonsterAnnotation, saveMonsterAnnotation,
    cancelMonsterAnnotation: useCallback(() => setPendingMonsterAnnotation(null), []),
    // Search markers
    searchMarkers, searchNotes, searchedCounts,
    pendingSearchEdit, setPendingSearchEdit, openSearchNoteEdit, saveSearchNote,
    pendingSearchView, viewSearchNote, closeSearchNote,
    removeSearchMarker: handleRemoveSearchMarker,
  };
}
