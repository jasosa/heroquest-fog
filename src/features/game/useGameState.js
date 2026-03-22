import { useState, useEffect, useCallback, useRef } from "react";
import { BOARD, ROWS, COLS } from "../../map.js";
import { makeComputeReveal, hasVisibleDoorForRoom } from "../../reveal.js";
import { getCoveredCellKeys } from "../../pieceGeometry.js";
import { PIECES } from "../../pieces.js";
import { placeLetterMarker, updateLetterMarker, setMonsterSpecial } from "../../placementState.js";

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
export function useGameState({ initialPlaced = {}, initialDoors = {}, initialMode = "play", initialTitle = "Untitled Quest", initialDescription = "" } = {}) {
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

  // Feature A: Letter Markers
  const [activeLetter, setActiveLetter]           = useState("A");
  const [letterNotes, setLetterNotes]             = useState({});    // Record<letter, note>
  const [pendingLetterEdit, setPendingLetterEdit] = useState(null);  // {anchorKey,letter,note}|null

  // Feature B: Special Monsters
  const [pendingMonsterAnnotation, setPendingMonsterAnnotation] = useState(null); // {anchorKey}|null

  // advanced-use-latest: stable refs so handleCell needs no dependencies.
  const placedRef   = useLatest(placed);
  const modeRef     = useLatest(mode);
  const toolRef     = useLatest(tool);
  const rotationRef = useLatest(rotation);
  const fogRef      = useLatest(fog);
  const doorsRef    = useLatest(doors);
  const pendingRoomRevealRef    = useLatest(pendingRoomReveal);
  const activeLetterRef         = useLatest(activeLetter);
  const letterNotesRef          = useLatest(letterNotes);

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

      // Letter markers: click on existing opens note dialog; click on empty places then opens dialog.
      if (currentTool === "letter") {
        const existing = placedRef.current[k];
        if (existing?.type === "letter") {
          setPendingLetterEdit({ anchorKey: k, letter: existing.letter, note: existing.note ?? "" });
        } else {
          const letter = activeLetterRef.current;
          setPlaced(prev => placeLetterMarker(prev, r, c, letter, ""));
          setPendingLetterEdit({ anchorKey: k, letter, note: "" });
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
  }, []);

  // Feature A: save edits from the letter marker dialog.
  const saveLetterMarkerEdit = useCallback((anchorKey, letter, note) => {
    setPlaced(prev => updateLetterMarker(prev, anchorKey, letter, note));
    setPendingLetterEdit(null);
  }, []);

  const deleteLetterMarker = useCallback((anchorKey) => {
    setPlaced(prev => {
      const next = { ...prev };
      delete next[anchorKey];
      return next;
    });
    setPendingLetterEdit(null);
  }, []);

  // Feature B: open special monster annotation dialog from the ★ button in edit mode.
  const openMonsterAnnotation = useCallback((anchorKey) => {
    setPendingMonsterAnnotation({ anchorKey });
  }, []);

  const saveMonsterAnnotation = useCallback((anchorKey, isSpecial, specialNote) => {
    setPlaced(prev => setMonsterSpecial(prev, anchorKey, isSpecial, specialNote));
    setPendingMonsterAnnotation(null);
  }, []);

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
    // Feature A: Letter Markers
    activeLetter, setActiveLetter,
    letterNotes, setLetterNotes,
    pendingLetterEdit, setPendingLetterEdit,
    saveLetterMarkerEdit, deleteLetterMarker,
    // Feature B: Special Monsters
    pendingMonsterAnnotation,
    openMonsterAnnotation, saveMonsterAnnotation,
    cancelMonsterAnnotation: useCallback(() => setPendingMonsterAnnotation(null), []),
  };
}
