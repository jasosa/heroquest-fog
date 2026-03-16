import { useState, useEffect, useCallback, useRef } from "react";
import { BOARD, ROWS, COLS } from "../../map.js";
import { makeComputeReveal } from "../../reveal.js";
import { getCoveredCellKeys } from "../../pieceGeometry.js";
import { PIECES } from "../../pieces.js";

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

  // advanced-use-latest: stable refs so handleCell needs no dependencies.
  const placedRef   = useLatest(placed);
  const modeRef     = useLatest(mode);
  const toolRef     = useLatest(tool);
  const rotationRef = useLatest(rotation);

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
      .filter(([, v]) => v.type === "start")
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

      setPlaced(prev => {
        const next = { ...prev };
        // Click on any cell covered by a piece removes it.
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
        return next;
      });
    } else {
      setLastClick(k);
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

  return {
    fog, placed, doors, mode, tool, rotation, setRotation, lastClick,
    setMode, setTool: handleSetTool, handleCell, handleCellRotate, resetFog,
    questTitle, setQuestTitle, questDescription, setQuestDescription,
  };
}
