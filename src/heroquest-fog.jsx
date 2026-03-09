import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { BOARD, ROWS, COLS } from "./map.js";
import { makeComputeReveal } from "./reveal.js";
import { rotateCells, getDistinctRotations, getCoveredCellKeys } from "./pieceGeometry.js";

const C = "C";
const CELL = 37;
const computeReveal = makeComputeReveal(BOARD, ROWS, COLS);

// advanced-use-latest: stable ref that always holds the latest value,
// lets callbacks read current state without listing it as a dependency.
function useLatest(value) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}

// ═══════════════════════════════════════════════
//  ROOM COLORS  (real board — R1–R22)
// ═══════════════════════════════════════════════
const ROOM_COLORS = {
  R1:  { revealed: "#2a1e14", border: "#4a3020" },
  R2:  { revealed: "#14202a", border: "#204048" },
  R3:  { revealed: "#1a0e1e", border: "#381838" },
  R4:  { revealed: "#1e150a", border: "#3a2a14" },
  R5:  { revealed: "#0e1a10", border: "#183020" },
  R6:  { revealed: "#1a1a0a", border: "#303214" },
  R7:  { revealed: "#14101e", border: "#282038" },
  R8:  { revealed: "#1e0e14", border: "#381828" },
  R9:  { revealed: "#0a1a18", border: "#143430" },
  R10: { revealed: "#1e180a", border: "#3a3014" },
  R11: { revealed: "#0a1018", border: "#142030" },
  R12: { revealed: "#1e1a0a", border: "#3a3414" },
  R13: { revealed: "#0a0a1e", border: "#141438" },
  R14: { revealed: "#1a0a10", border: "#341420" },
  R15: { revealed: "#101e0a", border: "#203814" },
  R16: { revealed: "#0a1a1a", border: "#143434" },
  R17: { revealed: "#1a0a0a", border: "#341414" },
  R18: { revealed: "#1e141a", border: "#382830" },
  R19: { revealed: "#0a1e0a", border: "#143814" },
  R20: { revealed: "#14100e", border: "#28201c" },
  R21: { revealed: "#1e0a1e", border: "#381438" },
  R22: { revealed: "#0a1418", border: "#142830" },
};

// ═══════════════════════════════════════════════
//  PIECE CATALOGUE
//  Add new categories or pieces here — nothing
//  else in the codebase needs to change.
// ═══════════════════════════════════════════════
const PIECE_CATEGORIES = [
  {
    id: "monsters", label: "Monsters",
    pieces: [
      { id: "goblin",       label: "Goblin",         icon: "G",  color: "#66bb6a", shape: "circle",  blocks: false },
      { id: "orc",          label: "Orc",             icon: "O",  color: "#a5714d", shape: "circle",  blocks: false },
      { id: "skeleton",     label: "Skeleton",        icon: "Sk", color: "#c0cdd4", shape: "circle",  blocks: false },
      { id: "zombie",       label: "Zombie",          icon: "Zm", color: "#78909c", shape: "circle",  blocks: false },
      { id: "mummy",        label: "Mummy",           icon: "Mm", color: "#c4a87a", shape: "circle",  blocks: false },
      { id: "abomination",  label: "Abomination",     icon: "Ab", color: "#6a4c93", shape: "circle",  blocks: false },
      { id: "dread",        label: "Dread Warrior",   icon: "Dw", color: "#b71c1c", shape: "circle",  blocks: false },
      { id: "gargoyle",     label: "Gargoyle",        icon: "Ga", color: "#8d9eaa", shape: "circle",  blocks: false },
    ],
  },
  {
    id: "traps", label: "Traps",
    pieces: [
      { id: "trap",         label: "Trap",            icon: "T",  color: "#ef5350", shape: "circle",  blocks: false },
      { id: "pit",          label: "Pit Trap",        icon: "Pt", color: "#d32f2f", shape: "circle",  blocks: false },
      { id: "spear",        label: "Spear Trap",      icon: "Sp", color: "#e64a19", shape: "circle",  blocks: false },
      { id: "falling",      label: "Falling Block",   icon: "Fb", color: "#bf360c", shape: "square",  blocks: false },
    ],
  },
  {
    id: "furniture", label: "Furniture",
    pieces: [
      { id: "chest",        label: "Chest",           icon: "Ch", color: "#ffa726", shape: "square",  blocks: false },
      { id: "bookcase",     label: "Bookcase",         icon: "Bk", color: "#795548", shape: "square",  blocks: true,  cells: [[0,0],[0,1],[0,2]] },
      { id: "table",        label: "Table",            icon: "Tb", color: "#8d6e63", shape: "square",  blocks: false, cells: [[0,0],[0,1]] },
      { id: "throne",       label: "Throne",           icon: "Th", color: "#ffd54f", shape: "square",  blocks: false, cells: [[0,0],[0,1]] },
      { id: "fireplace",    label: "Fireplace",        icon: "Fi", color: "#ff6f00", shape: "square",  blocks: true,  cells: [[0,0],[0,1]] },
      { id: "cupboard",     label: "Cupboard",         icon: "Cu", color: "#6d4c41", shape: "square",  blocks: false, cells: [[0,0],[0,1]] },
      { id: "alchemist",    label: "Alchemist's Bench",icon: "Al", color: "#80cbc4", shape: "square",  blocks: false, cells: [[0,0],[0,1]] },
      { id: "rack",         label: "Rack",             icon: "Rk", color: "#546e7a", shape: "square",  blocks: false, cells: [[0,0],[0,1]] },
      { id: "tomb",         label: "Tomb",             icon: "To", color: "#455a64", shape: "square",  blocks: false, cells: [[0,0],[0,1]] },
      { id: "weaponsrack",  label: "Weapons Rack",     icon: "Wr", color: "#607d8b", shape: "square",  blocks: false, cells: [[0,0],[0,1],[0,2]] },
    ],
  },
  {
    id: "markers", label: "Markers",
    pieces: [
      { id: "start",        label: "Hero Start",      icon: "⚔", color: "#f0c040", shape: "diamond", blocks: false },
      { id: "door",         label: "Secret Door",     icon: "SD", color: "#9c6b2e", shape: "square",  blocks: false },
      { id: "stairs",       label: "Stairs",           icon: "St", color: "#90a4ae", shape: "square",  blocks: false, cells: [[0,0],[0,1],[1,0],[1,1]] },
      { id: "blocker",      label: "Blocked Square",  icon: "▪",  color: "#455a64", shape: "square",  blocks: true  },
    ],
  },
];

// Flat lookup map derived from the catalogue — used by game logic and Token.
// Adding a piece to PIECE_CATEGORIES automatically makes it available here.
const PIECES = Object.fromEntries(
  PIECE_CATEGORIES.flatMap(cat => cat.pieces.map(p => [p.id, p]))
);

// computeReveal is created at module level via makeComputeReveal (see top of file)

// Geometry utilities imported from pieceGeometry.js

// ═══════════════════════════════════════════════
//  GAME STATE HOOK
// ═══════════════════════════════════════════════
function useGameState() {
  // rerender-lazy-state-init: pass a function so new Set() runs only once,
  // not on every render.
  const [fog, setFog]             = useState(() => new Set());
  const [placed, setPlaced]       = useState({});
  const [mode, setMode]           = useState("play");
  const [tool, setTool]           = useState("goblin");
  const [rotation, setRotation]   = useState(0);
  const [lastClick, setLastClick] = useState(null);

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
    setPlaced(prev => {
      const coveringAnchor = Object.keys(prev).find(ak =>
        (prev[ak].coveredCells ?? [ak]).includes(k)
      );
      if (!coveringAnchor) return prev;
      const piece    = prev[coveringAnchor];
      const pieceDef = PIECES[piece.type];
      if (!pieceDef?.cells) return prev; // 1×1 pieces have nothing to rotate
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
  }, []);

  const resetFog = useCallback(() => {
    setFog(new Set());
    setLastClick(null);
  }, []);

  return { fog, placed, mode, tool, rotation, setRotation, lastClick, setMode, setTool: handleSetTool, handleCell, handleCellRotate, resetFog };
}

// ═══════════════════════════════════════════════
//  TOKEN COMPONENT
// ═══════════════════════════════════════════════
function Token({ type }) {
  const p = PIECES[type];
  if (!p) return null;
  const size = 26;
  const radius = p.shape === "circle" ? "50%" : "3px";
  return (
    <div style={{
      width: size, height: size,
      background: p.color,
      borderRadius: radius,
      transform: p.shape === "diamond" ? "rotate(45deg)" : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 8, fontWeight: "bold", color: "#111",
      boxShadow: `0 0 8px ${p.color}99, 0 1px 3px #0008`,
      flexShrink: 0, zIndex: 3,
    }}>
      <span style={{ transform: p.shape === "diamond" ? "rotate(-45deg)" : "none" }}>
        {p.icon}
      </span>
    </div>
  );
}

// rendering-hoist-jsx: these overlays are fully static — hoisting them as
// module-level constants means they are never recreated across renders.
const STONE_TEXTURE = (
  <div style={{
    position: "absolute", inset: 0, opacity: 0.04,
    backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px), radial-gradient(circle at 50% 80%, #fff 1px, transparent 1px)",
    backgroundSize: "12px 12px, 8px 8px, 16px 16px",
    pointerEvents: "none",
  }} />
);

const FOG_OVERLAY = (
  <div style={{
    position: "absolute", inset: 0,
    background: "radial-gradient(circle at 50% 50%, #060301 0%, #040200 100%)",
    zIndex: 1, pointerEvents: "none",
  }} />
);

// ═══════════════════════════════════════════════
//  BOARD CELL COMPONENT
// ═══════════════════════════════════════════════
// rerender-memo: cells only re-render when their own props change.
// coverage — the placed entry whose footprint includes this cell (or undefined)
// isAnchor — true only for the anchor cell of a multi-cell piece (token goes here)
const BoardCell = memo(function BoardCell({ r, c, region, isRevealed, isEditMode, isLastClick, coverage, isAnchor, onClick, onRightClick }) {
  const isWall   = region === null;
  const isFogged = !isEditMode && !isWall && !isRevealed;

  // Revealed and edit cells are transparent — the board image shows through.
  // Fogged cells use an opaque dark fill to hide the image underneath.
  let bg = "transparent";
  if (!isWall && !isEditMode && !isRevealed) bg = "#060401";

  const borderColor = isEditMode || isRevealed || isWall ? "transparent" : "#110803";
  const pieceColor  = coverage ? PIECES[coverage.type]?.color : null;

  return (
    <div
      onClick={onClick}
      style={{
        width: CELL, height: CELL,
        background: bg,
        border: `1px solid ${borderColor}`,
        cursor: isWall ? "default" : "pointer",
        boxSizing: "border-box",
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s, filter 0.1s",
        userSelect: "none",
        outline: isLastClick && !isEditMode ? "2px solid #c0302066" : "none",
        outlineOffset: "-2px",
      }}
      onContextMenu={e => { e.preventDefault(); if (!isWall && onRightClick) onRightClick(); }}
      onMouseEnter={e => { if (!isWall) e.currentTarget.style.filter = "brightness(1.4)"; }}
      onMouseLeave={e =>  { e.currentTarget.style.filter = "none"; }}
    >
      {/* Dense fog overlay */}
      {isFogged && FOG_OVERLAY}

      {/* Piece footprint — coloured tint across all covered cells */}
      {coverage && (isRevealed || isEditMode) && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
          background: pieceColor + "55",
          outline: `1px solid ${pieceColor}88`,
          outlineOffset: "-1px",
        }} />
      )}

      {/* Token — only on the anchor cell */}
      {isAnchor && (isRevealed || isEditMode) && (
        <div style={{ zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Token type={coverage.type} />
        </div>
      )}

      {/* Edit-mode coordinate hint on empty cells */}
      {isEditMode && !coverage && !isWall && (
        <span style={{ fontSize: 7, color: "#2a1810", zIndex: 2, opacity: 0.6 }}>{r},{c}</span>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════
//  BOARD GRID COMPONENT
// ═══════════════════════════════════════════════
function BoardGrid({ fog, placed, mode, lastClick, onCellClick, onCellRotate }) {
  const isEditMode = mode === "edit";

  // Build a cell-key → {piece, anchorKey} map so each BoardCell knows
  // whether it is covered and whether it is the anchor.
  const coverage = useMemo(() => {
    const map = {};
    for (const [anchorKey, piece] of Object.entries(placed)) {
      for (const cellKey of (piece.coveredCells ?? [anchorKey])) {
        map[cellKey] = { piece, anchorKey };
      }
    }
    return map;
  }, [placed]);

  return (
    <div style={{
      border: "2px solid #6b4c2a",
      boxShadow: "0 0 40px #6b4c2a22, inset 0 0 30px #00000055",
      display: "inline-block",
      backgroundImage: "url('/board2.png')",
      backgroundSize: `${COLS * CELL + 1}px ${ROWS * CELL + 1}px`,
      backgroundPosition: "0 0",
      backgroundRepeat: "no-repeat",
      overflow: "hidden",
      lineHeight: 0,
    }}>
      {BOARD.map((row, r) => (
        <div key={r} style={{ display: "flex" }}>
          {row.map((region, c) => {
            const k = `${r},${c}`;
            const cov = coverage[k];
            return (
              <BoardCell
                key={c}
                r={r} c={c}
                region={region}
                isRevealed={fog.has(k)}
                isEditMode={isEditMode}
                isLastClick={lastClick === k}
                coverage={cov?.piece}
                isAnchor={cov?.anchorKey === k}
                onClick={() => onCellClick(r, c)}
                onRightClick={isEditMode && coverage ? () => onCellRotate(r, c) : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  BOARD AREA (left panel)
// ═══════════════════════════════════════════════
function BoardArea({ fog, placed, mode, lastClick, onCellClick, onCellRotate }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 14, padding: 20, overflowY: "auto",
    }}>
      <h1 style={{
        margin: 0, fontSize: 20, letterSpacing: 8,
        color: "#c03020", textTransform: "uppercase",
        textShadow: "0 0 20px #c0302055, 0 2px 4px #000",
        fontWeight: "normal",
      }}>
        HeroQuest — Fog of War
      </h1>

      <div style={{
        fontSize: 10, letterSpacing: 3, textTransform: "uppercase",
        color: mode === "edit" ? "#e8a820" : "#70a870",
        border: `1px solid ${mode === "edit" ? "#6b4a10" : "#2a5a2a"}`,
        padding: "3px 12px", marginTop: -6,
      }}>
        {mode === "edit" ? "✎ Edit Mode — Click to place · Right-click to rotate" : "⚔ Play Mode — Click to reveal"}
      </div>

      <BoardGrid
        fog={fog} placed={placed} mode={mode}
        lastClick={lastClick} onCellClick={onCellClick} onCellRotate={onCellRotate}
      />

      <div style={{ fontSize: 10, color: "#3a2010", letterSpacing: 1 }}>
        HEROQUEST BOARD · 22 ROOMS · 26×19
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  SIDEBAR COMPONENTS
// ═══════════════════════════════════════════════
function ModeToggle({ mode, onSetMode }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
      {["play", "edit"].map(m => (
        <button key={m} onClick={() => onSetMode(m)} style={{
          flex: 1, padding: "8px 0",
          background: mode === m ? (m === "play" ? "#4a1010" : "#4a3808") : "#110803",
          color: mode === m ? (m === "play" ? "#ffbbbb" : "#ffe599") : "#6a4020",
          border: `1px solid ${mode === m ? (m === "play" ? "#8b1a1a" : "#8b6a10") : "#2a1408"}`,
          cursor: "pointer", fontFamily: "inherit", fontSize: 11,
          textTransform: "uppercase", letterSpacing: 1,
          transition: "all 0.15s",
        }}>
          {m === "play" ? "⚔ Play" : "✎ Edit"}
        </button>
      ))}
    </div>
  );
}

function PlayPanel({ onReset }) {
  return (
    <>
      <p style={{ fontSize: 11, color: "#7a5030", lineHeight: 1.7, margin: 0, marginTop: 4 }}>
        Click any dungeon cell to reveal what a hero standing there would see.
      </p>

      <div style={{
        background: "#110803", border: "1px solid #2a1810",
        padding: "10px 12px", fontSize: 10, color: "#5a3820", lineHeight: 1.8,
        marginTop: 2,
      }}>
        <span style={{ color: "#a06030" }}>Room cell</span> → entire room revealed<br />
        <span style={{ color: "#a06030" }}>Corridor cell</span> → straight line until wall or blocker<br />
        <span style={{ color: "#a06030" }}>Start marker</span> → auto-revealed at game start
      </div>

      <button onClick={onReset} style={{
        marginTop: 4, padding: "9px 0",
        background: "#110803", color: "#c03020",
        border: "1px solid #5a1010", cursor: "pointer",
        fontFamily: "inherit", fontSize: 11, letterSpacing: 1,
        transition: "all 0.15s",
      }}>
        ↺ Reset Fog of War
      </button>

      <div style={{ marginTop: 8, fontSize: 9, color: "#3a2010", lineHeight: 1.8 }}>
        <div style={{ color: "#5a3010", marginBottom: 4, letterSpacing: 2, textTransform: "uppercase" }}>Legend</div>
        {[
          { color: "#271809", label: "Corridor (revealed)" },
          { color: "#060401", label: "Unexplored" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, background: color, border: "1px solid #3a2010", flexShrink: 0 }} />
            {label}
          </div>
        ))}
        {Object.entries(ROOM_COLORS).map(([id, { revealed }]) => (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, background: revealed, border: "1px solid #3a2010", flexShrink: 0 }} />
            {id} (revealed)
          </div>
        ))}
      </div>
    </>
  );
}

// Memoized so it only re-renders when the selected tool changes.
const PieceButton = memo(function PieceButton({ piece, isSelected, onSelect }) {
  return (
    <button onClick={() => onSelect(piece.id)} style={{
      padding: "6px 8px",
      background: isSelected ? "#221508" : "#0e0703",
      color: isSelected ? "#c8a870" : "#7a4828",
      border: `1px solid ${isSelected ? "#6b4020" : "#1e1006"}`,
      cursor: "pointer", fontFamily: "inherit", fontSize: 11,
      textAlign: "left", display: "flex", alignItems: "center", gap: 8,
      transition: "all 0.12s", width: "100%",
    }}>
      <div style={{
        width: 16, height: 16, background: piece.color, flexShrink: 0,
        borderRadius: piece.shape === "circle" ? "50%" : "2px",
        transform: piece.shape === "diamond" ? "rotate(45deg)" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 5, fontWeight: "bold", color: "#000",
      }} />
      <span style={{ flex: 1 }}>{piece.label}</span>
      {piece.blocks && (
        <span style={{ fontSize: 8, color: "#c03020", border: "1px solid #5a1010", padding: "1px 3px" }}>
          BLK
        </span>
      )}
    </button>
  );
});

function EditPanel({ tool, onSelectTool }) {
  const [activeCatId, setActiveCatId] = useState(PIECE_CATEGORIES[0].id);
  const activeCategory = PIECE_CATEGORIES.find(c => c.id === activeCatId);

  return (
    <>
      {/* Category tabs */}
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4 }}>
        {PIECE_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCatId(cat.id)} style={{
            padding: "4px 7px", fontSize: 9, letterSpacing: 1,
            textTransform: "uppercase", fontFamily: "inherit", cursor: "pointer",
            background: activeCatId === cat.id ? "#3a1e08" : "#0e0703",
            color: activeCatId === cat.id ? "#c8a870" : "#4a2810",
            border: `1px solid ${activeCatId === cat.id ? "#6b4020" : "#1e1006"}`,
            transition: "all 0.12s",
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Pieces in active category */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
        {activeCategory.pieces.map(piece => (
          <PieceButton
            key={piece.id}
            piece={piece}
            isSelected={tool === piece.id}
            onSelect={onSelectTool}
          />
        ))}
      </div>


      <div style={{
        marginTop: 8, padding: "10px 12px",
        background: "#110803", border: "1px solid #2a1810",
        fontSize: 10, color: "#4a3020", lineHeight: 1.8,
      }}>
        <span style={{ color: "#c03020" }}>BLK</span> pieces stop corridor visibility when encountered.
        <br /><br />
        <span style={{ color: "#e8a820" }}>Hero Start</span> is auto-revealed when switching to Play mode.
      </div>
    </>
  );
}


function Sidebar({ mode, tool, setMode, setTool, onReset }) {
  return (
    <div style={{
      width: 230,
      background: "#090501",
      borderLeft: "1px solid #3a2010",
      display: "flex", flexDirection: "column",
      padding: "18px 14px",
      gap: 8,
      overflowY: "auto",
    }}>
      <div style={{
        textAlign: "center", marginBottom: 4,
        fontSize: 13, letterSpacing: 4, color: "#8b5020",
        textTransform: "uppercase", borderBottom: "1px solid #2a1810",
        paddingBottom: 12,
      }}>
        Quest Master
      </div>

      <ModeToggle mode={mode} onSetMode={setMode} />

      {mode === "play"
        ? <PlayPanel onReset={onReset} />
        : <EditPanel tool={tool} onSelectTool={setTool} />
      }

      <div style={{
        marginTop: "auto", paddingTop: 14,
        borderTop: "1px solid #1a0e05",
        fontSize: 9, color: "#2a1810", lineHeight: 1.8,
        textAlign: "center",
      }}>
        v0.2 — Real HeroQuest board<br />
        22 rooms · quest editor next
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ROOT COMPONENT
// ═══════════════════════════════════════════════
export default function HeroQuestFog() {
  const { fog, placed, mode, tool, rotation, setRotation, lastClick, setMode, setTool, handleCell, handleCellRotate, resetFog } = useGameState();

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#0c0703",
      fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, serif",
      color: "#c8a870",
    }}>
      <BoardArea
        fog={fog} placed={placed} mode={mode}
        lastClick={lastClick} onCellClick={handleCell} onCellRotate={handleCellRotate}
      />
      <Sidebar
        mode={mode} tool={tool}
        setMode={setMode} setTool={setTool}
        onReset={resetFog}
      />
    </div>
  );
}
