import { useState, useEffect, useCallback, useRef, memo } from "react";
import { BOARD, ROWS, COLS } from "./map.js";
import { makeComputeReveal } from "./reveal.js";

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
//  PIECE TYPES
// ═══════════════════════════════════════════════
const PIECES = {
  start:    { label: "Hero Start",     icon: "⚔",  color: "#f0c040", shape: "diamond", blocks: false },
  goblin:   { label: "Goblin",         icon: "G",   color: "#66bb6a", shape: "circle",  blocks: false },
  orc:      { label: "Orc",            icon: "O",   color: "#a5714d", shape: "circle",  blocks: false },
  skeleton: { label: "Skeleton",       icon: "Sk",  color: "#c0cdd4", shape: "circle",  blocks: false },
  zombie:   { label: "Zombie",         icon: "Zm",  color: "#78909c", shape: "circle",  blocks: false },
  chest:    { label: "Chest",          icon: "Ch",  color: "#ffa726", shape: "square",  blocks: false },
  trap:     { label: "Trap",           icon: "T",   color: "#ef5350", shape: "circle",  blocks: false },
  blocker:  { label: "Blocked Square", icon: "▪",   color: "#455a64", shape: "square",  blocks: true  },
};

// computeReveal is created at module level via makeComputeReveal (see top of file)

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
  const [lastClick, setLastClick] = useState(null);

  // advanced-use-latest: stable refs so handleCell needs no dependencies.
  const placedRef = useLatest(placed);
  const modeRef   = useLatest(mode);
  const toolRef   = useLatest(tool);

  // Auto-reveal Hero Start positions when entering play mode.
  // placedRef lets us read current placed without it being a dependency
  // (effect fires only on mode change, not on every piece placement).
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

  // rerender-functional-setstate + advanced-use-latest: reading mode/tool/placed
  // from refs removes all dependencies, making handleCell a stable reference
  // that never causes child re-renders.
  const handleCell = useCallback((r, c) => {
    const region = BOARD[r]?.[c];
    if (!region) return;
    const k = `${r},${c}`;
    if (modeRef.current === "edit") {
      const currentTool = toolRef.current;
      setPlaced(prev => {
        const next = { ...prev };
        if (next[k]?.type === currentTool) delete next[k];
        else next[k] = { type: currentTool, blocks: PIECES[currentTool].blocks };
        return next;
      });
    } else {
      setLastClick(k);
      const visible = computeReveal(r, c, placedRef.current);
      setFog(prev => new Set([...prev, ...visible]));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetFog = useCallback(() => {
    setFog(new Set());
    setLastClick(null);
  }, []);

  return { fog, placed, mode, tool, lastClick, setMode, setTool, handleCell, resetFog };
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
const BoardCell = memo(function BoardCell({ r, c, region, isRevealed, isEditMode, isLastClick, elem, onClick }) {
  const isWall   = region === null;
  const isFogged = !isEditMode && !isWall && !isRevealed;

  // Revealed and edit cells are transparent — the board image shows through.
  // Fogged cells use an opaque dark fill to hide the image underneath.
  let bg = "transparent";
  if (!isWall && !isEditMode && !isRevealed) bg = "#060401";

  // Borders are only visible on fogged cells; revealed cells let the
  // image's own grid lines show through.
  const borderColor = isEditMode || isRevealed || isWall
    ? "transparent"
    : "#110803";

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
      onMouseEnter={e => { if (!isWall) e.currentTarget.style.filter = "brightness(1.4)"; }}
      onMouseLeave={e =>  { e.currentTarget.style.filter = "none"; }}
    >
      {/* Dense fog overlay */}
      {isFogged && FOG_OVERLAY}

      {/* Piece token */}
      {elem && (isRevealed || isEditMode) && (
        <div style={{ zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Token type={elem.type} />
        </div>
      )}

      {/* Edit-mode coordinate hint */}
      {isEditMode && !elem && !isWall && (
        <span style={{ fontSize: 7, color: "#2a1810", zIndex: 2, opacity: 0.6 }}>{r},{c}</span>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════
//  BOARD GRID COMPONENT
// ═══════════════════════════════════════════════
function BoardGrid({ fog, placed, mode, lastClick, onCellClick }) {
  const isEditMode = mode === "edit";
  return (
    <div style={{
      border: "2px solid #6b4c2a",
      boxShadow: "0 0 40px #6b4c2a22, inset 0 0 30px #00000055",
      display: "inline-block",
      backgroundImage: "url('/board2.png')",
      backgroundSize: `${COLS * CELL + 2}px ${ROWS * CELL + 2}px`,
      backgroundPosition: "0 0",
      backgroundRepeat: "no-repeat",
      overflow: "hidden",
      lineHeight: 0,
    }}>
      {BOARD.map((row, r) => (
        <div key={r} style={{ display: "flex" }}>
          {row.map((region, c) => {
            const k = `${r},${c}`;
            return (
              <BoardCell
                key={c}
                r={r} c={c}
                region={region}
                isRevealed={fog.has(k)}
                isEditMode={isEditMode}
                isLastClick={lastClick === k}
                elem={placed[k]}
                onClick={() => onCellClick(r, c)}
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
function BoardArea({ fog, placed, mode, lastClick, onCellClick }) {
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
        {mode === "edit" ? "✎ Edit Mode — Click to place pieces" : "⚔ Play Mode — Click to reveal"}
      </div>

      <BoardGrid
        fog={fog} placed={placed} mode={mode}
        lastClick={lastClick} onCellClick={onCellClick}
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

function EditPanel({ tool, onSelectTool }) {
  return (
    <>
      <p style={{ fontSize: 11, color: "#7a5030", lineHeight: 1.6, margin: 0, marginTop: 4 }}>
        Select a piece and click a cell to place or remove it.
      </p>

      <div style={{ fontSize: 9, letterSpacing: 2, color: "#4a2810", textTransform: "uppercase", marginTop: 6, marginBottom: 2 }}>
        Pieces
      </div>

      {Object.entries(PIECES).map(([key, p]) => (
        <button key={key} onClick={() => onSelectTool(key)} style={{
          padding: "7px 9px",
          background: tool === key ? "#221508" : "#0e0703",
          color: tool === key ? "#c8a870" : "#7a4828",
          border: `1px solid ${tool === key ? "#6b4020" : "#1e1006"}`,
          cursor: "pointer", fontFamily: "inherit", fontSize: 11,
          textAlign: "left", display: "flex", alignItems: "center", gap: 8,
          transition: "all 0.12s",
        }}>
          <div style={{
            width: 18, height: 18, background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            transform: p.shape === "diamond" ? "rotate(45deg)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 6, fontWeight: "bold", color: "#000", flexShrink: 0,
          }} />
          <span style={{ flex: 1 }}>{p.label}</span>
          {p.blocks && (
            <span style={{ fontSize: 8, color: "#c03020", border: "1px solid #5a1010", padding: "1px 4px" }}>
              BLK
            </span>
          )}
        </button>
      ))}

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
  const { fog, placed, mode, tool, lastClick, setMode, setTool, handleCell, resetFog } = useGameState();

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#0c0703",
      fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, serif",
      color: "#c8a870",
    }}>
      <BoardArea
        fog={fog} placed={placed} mode={mode}
        lastClick={lastClick} onCellClick={handleCell}
      />
      <Sidebar
        mode={mode} tool={tool}
        setMode={setMode} setTool={setTool}
        onReset={resetFog}
      />
    </div>
  );
}
