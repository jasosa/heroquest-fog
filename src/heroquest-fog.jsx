import { useState, useEffect, useCallback } from "react";
import { BOARD, ROWS, COLS } from "./map.js";

const C = "C";

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

// ═══════════════════════════════════════════════
//  REVEAL LOGIC
// ═══════════════════════════════════════════════
function computeReveal(r, c, placed) {
  const region = BOARD[r]?.[c];
  if (!region) return new Set();

  const blockers = new Set(
    Object.entries(placed)
      .filter(([, v]) => v.blocks)
      .map(([k]) => k)
  );

  if (region !== C) {
    // ROOM → flood fill within same region, respecting blockers
    const vis = new Set();
    const q = [[r, c]];
    while (q.length) {
      const [cr, cc] = q.shift();
      if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
      const k = `${cr},${cc}`;
      if (vis.has(k)) continue;
      if (BOARD[cr][cc] !== region) continue;
      if (blockers.has(k)) continue;
      vis.add(k);
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]])
        q.push([cr + dr, cc + dc]);
    }
    return vis;
  } else {
    // CORRIDOR → ray cast in 4 directions, stop at wall or blocker
    const vis = new Set([`${r},${c}`]);
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let [cr, cc] = [r + dr, c + dc];
      while (cr >= 0 && cr < ROWS && cc >= 0 && cc < COLS) {
        if (BOARD[cr][cc] !== C) break;
        const k = `${cr},${cc}`;
        if (blockers.has(k)) { vis.add(k); break; }
        vis.add(k);
        cr += dr; cc += dc;
      }
    }
    return vis;
  }
}

// ═══════════════════════════════════════════════
//  PIECE TOKEN COMPONENT
// ═══════════════════════════════════════════════
function Token({ type }) {
  const p = PIECES[type];
  if (!p) return null;
  const size = 26;
  const radius = p.shape === "circle" ? "50%" : p.shape === "diamond" ? "3px" : "3px";
  return (
    <div style={{
      width: size, height: size,
      background: p.color,
      borderRadius: radius,
      transform: p.shape === "diamond" ? "rotate(45deg)" : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 8, fontWeight: "bold", color: "#111",
      boxShadow: `0 0 8px ${p.color}99, 0 1px 3px #0008`,
      flexShrink: 0,
      zIndex: 3,
    }}>
      <span style={{ transform: p.shape === "diamond" ? "rotate(-45deg)" : "none" }}>
        {p.icon}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════
export default function HeroQuestFog() {
  const [fog, setFog] = useState(new Set());           // revealed cell keys
  const [placed, setPlaced] = useState({});            // "r,c" → { type, blocks }
  const [mode, setMode] = useState("play");
  const [tool, setTool] = useState("goblin");
  const [lastClick, setLastClick] = useState(null);

  // Auto-reveal start positions when entering play mode
  useEffect(() => {
    if (mode === "play") {
      const starts = Object.entries(placed)
        .filter(([, v]) => v.type === "start")
        .map(([k]) => k);
      if (starts.length > 0) {
        setFog(prev => {
          const next = new Set(prev);
          for (const k of starts) {
            const [r, c] = k.split(",").map(Number);
            computeReveal(r, c, placed).forEach(cell => next.add(cell));
          }
          return next;
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleCell = useCallback((r, c) => {
    const region = BOARD[r]?.[c];
    if (!region) return;
    const k = `${r},${c}`;

    if (mode === "edit") {
      setPlaced(prev => {
        const next = { ...prev };
        if (next[k]?.type === tool) delete next[k];
        else next[k] = { type: tool, blocks: PIECES[tool].blocks };
        return next;
      });
    } else {
      setLastClick(k);
      const visible = computeReveal(r, c, placed);
      setFog(prev => new Set([...prev, ...visible]));
    }
  }, [mode, tool, placed]);

  const CELL = 40;

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#0c0703",
      fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, serif",
      color: "#c8a870",
    }}>

      {/* ─── BOARD AREA ─── */}
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

        {/* Mode badge */}
        <div style={{
          fontSize: 10, letterSpacing: 3, textTransform: "uppercase",
          color: mode === "edit" ? "#e8a820" : "#70a870",
          border: `1px solid ${mode === "edit" ? "#6b4a10" : "#2a5a2a"}`,
          padding: "3px 12px", marginTop: -6,
        }}>
          {mode === "edit" ? "✎ Edit Mode — Click to place pieces" : "⚔ Play Mode — Click to reveal"}
        </div>

        {/* Grid */}
        <div style={{
          border: "2px solid #6b4c2a",
          boxShadow: "0 0 40px #6b4c2a22, inset 0 0 30px #00000055",
          display: "inline-block",
          background: "#0c0703",
          lineHeight: 0,
        }}>
          {BOARD.map((row, r) => (
            <div key={r} style={{ display: "flex" }}>
              {row.map((region, c) => {
                const k = `${r},${c}`;
                const isWall = region === null;
                const isRevealed = fog.has(k);
                const elem = placed[k];
                const isEditMode = mode === "edit";
                const isFogged = !isEditMode && !isWall && !isRevealed;
                const isLastClick = lastClick === k;

                // Cell background
                let bg = "#0c0703"; // wall default
                if (!isWall) {
                  if (isEditMode) {
                    bg = region === C ? "#1c1008" : (ROOM_COLORS[region]?.revealed || "#2a1a10");
                  } else if (isRevealed) {
                    bg = region === C ? "#271809" : (ROOM_COLORS[region]?.revealed || "#3a2010");
                  } else {
                    bg = "#060401"; // fogged
                  }
                }

                const borderColor = isWall
                  ? "#100804"
                  : isEditMode || isRevealed
                    ? (ROOM_COLORS[region]?.border || "#3a2718")
                    : "#110803";

                return (
                  <div
                    key={c}
                    onClick={() => handleCell(r, c)}
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
                    onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
                  >
                    {/* Stone texture for revealed/edit non-wall cells */}
                    {!isWall && (isRevealed || isEditMode) && (
                      <div style={{
                        position: "absolute", inset: 0, opacity: 0.04,
                        backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px), radial-gradient(circle at 50% 80%, #fff 1px, transparent 1px)",
                        backgroundSize: "12px 12px, 8px 8px, 16px 16px",
                        pointerEvents: "none",
                      }} />
                    )}

                    {/* Dense fog overlay */}
                    {isFogged && (
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "radial-gradient(circle at 50% 50%, #060301 0%, #040200 100%)",
                        zIndex: 1, pointerEvents: "none",
                      }} />
                    )}

                    {/* Element token */}
                    {elem && (isRevealed || isEditMode) && (
                      <div style={{ zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Token type={elem.type} />
                      </div>
                    )}

                    {/* Edit mode coord hint */}
                    {isEditMode && !elem && !isWall && (
                      <span style={{ fontSize: 7, color: "#2a1810", zIndex: 2, opacity: 0.6 }}>{r},{c}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "#3a2010", letterSpacing: 1 }}>
          HEROQUEST BOARD · 22 ROOMS · 26×19
        </div>
      </div>

      {/* ─── SIDEBAR ─── */}
      <div style={{
        width: 230,
        background: "#090501",
        borderLeft: "1px solid #3a2010",
        display: "flex", flexDirection: "column",
        padding: "18px 14px",
        gap: 8,
        overflowY: "auto",
      }}>

        {/* Logo / title */}
        <div style={{
          textAlign: "center", marginBottom: 4,
          fontSize: 13, letterSpacing: 4, color: "#8b5020",
          textTransform: "uppercase", borderBottom: "1px solid #2a1810",
          paddingBottom: 12,
        }}>
          Quest Master
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {["play", "edit"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
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

        {mode === "play" ? (
          <>
            <p style={{ fontSize: 11, color: "#7a5030", lineHeight: 1.7, margin: 0, marginTop: 4 }}>
              Click any dungeon cell to reveal what a hero standing there would see.
            </p>

            <div style={{
              background: "#110803", border: "1px solid #2a1810",
              padding: "10px 12px", fontSize: 10, color: "#5a3820", lineHeight: 1.8,
              marginTop: 2,
            }}>
              <span style={{ color: "#a06030" }}>Room cell</span> → entire room revealed
              <br />
              <span style={{ color: "#a06030" }}>Corridor cell</span> → straight line until wall or blocker
              <br />
              <span style={{ color: "#a06030" }}>Start marker</span> → auto-revealed at game start
            </div>

            <button onClick={() => { setFog(new Set()); setLastClick(null); }} style={{
              marginTop: 4, padding: "9px 0",
              background: "#110803", color: "#c03020",
              border: "1px solid #5a1010", cursor: "pointer",
              fontFamily: "inherit", fontSize: 11, letterSpacing: 1,
              transition: "all 0.15s",
            }}>
              ↺ Reset Fog of War
            </button>

            {/* Legend */}
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
        ) : (
          <>
            <p style={{ fontSize: 11, color: "#7a5030", lineHeight: 1.6, margin: 0, marginTop: 4 }}>
              Select a piece and click a cell to place or remove it.
            </p>

            <div style={{ fontSize: 9, letterSpacing: 2, color: "#4a2810", textTransform: "uppercase", marginTop: 6, marginBottom: 2 }}>
              Pieces
            </div>

            {Object.entries(PIECES).map(([key, p]) => (
              <button key={key} onClick={() => setTool(key)} style={{
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
        )}

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
    </div>
  );
}
