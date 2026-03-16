import { T } from "../../theme.js";
import { EditPanel } from "../../components/EditPanel.jsx";
import { PIECE_CATEGORIES } from "../../pieces.js";

// Room colors used in the play-mode legend
const ROOM_COLORS = {
  R1:  { revealed: "#2a1e14" }, R2:  { revealed: "#14202a" }, R3:  { revealed: "#1a0e1e" },
  R4:  { revealed: "#1e150a" }, R5:  { revealed: "#0e1a10" }, R6:  { revealed: "#1a1a0a" },
  R7:  { revealed: "#14101e" }, R8:  { revealed: "#1e0e14" }, R9:  { revealed: "#0a1a18" },
  R10: { revealed: "#1e180a" }, R11: { revealed: "#0a1018" }, R12: { revealed: "#1e1a0a" },
  R13: { revealed: "#0a0a1e" }, R14: { revealed: "#1a0a10" }, R15: { revealed: "#101e0a" },
  R16: { revealed: "#0a1a1a" }, R17: { revealed: "#1a0a0a" }, R18: { revealed: "#1e141a" },
  R19: { revealed: "#0a1e0a" }, R20: { revealed: "#14100e" }, R21: { revealed: "#1e0a1e" },
  R22: { revealed: "#0a1418" },
};

function ModeToggle({ mode, onSetMode }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
      {["play", "edit"].map(m => (
        <button key={m} onClick={() => onSetMode(m)} style={{
          flex: 1, padding: "8px 0",
          background: mode === m ? T.btnActiveBg : T.btnBg,
          color: mode === m ? T.btnActiveText : T.btnText,
          border: `1px solid ${mode === m ? T.btnActiveBdr : T.btnBorder}`,
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
      <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.7, margin: 0, marginTop: 4 }}>
        Click any dungeon cell to reveal what a hero standing there would see.
      </p>

      <div style={{
        background: T.panelBg, border: `1px solid ${T.panelBorder}`,
        padding: "10px 12px", fontSize: 10, color: T.textMuted, lineHeight: 1.8,
        marginTop: 2,
      }}>
        <span style={{ color: T.accent }}>Room cell</span> → entire room revealed<br />
        <span style={{ color: T.accent }}>Corridor cell</span> → straight line until wall or blocker<br />
        <span style={{ color: T.accent }}>Start marker</span> → auto-revealed at game start
      </div>

      <button onClick={onReset} style={{
        marginTop: 4, padding: "9px 0",
        background: T.btnBg, color: T.accent,
        border: `1px solid ${T.btnBorder}`, cursor: "pointer",
        fontFamily: "inherit", fontSize: 11, letterSpacing: 1,
        transition: "all 0.15s",
      }}>
        ↺ Reset Fog of War
      </button>

      <div style={{ marginTop: 8, fontSize: 9, color: T.textMuted, lineHeight: 1.8 }}>
        <div style={{ color: T.text, marginBottom: 4, letterSpacing: 2, textTransform: "uppercase", fontWeight: "bold" }}>Legend</div>
        {[
          { color: "#271809", label: "Corridor (revealed)" },
          { color: "#060401", label: "Unexplored" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, background: color, border: `1px solid ${T.btnBorder}`, flexShrink: 0 }} />
            {label}
          </div>
        ))}
        {Object.entries(ROOM_COLORS).map(([id, { revealed }]) => (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, background: revealed, border: `1px solid ${T.btnBorder}`, flexShrink: 0 }} />
            {id} (revealed)
          </div>
        ))}
      </div>
    </>
  );
}

const inputStyle = {
  background: "#e0cfae",
  border: "1px solid #b09060",
  color: "#2a1208",
  fontFamily: "inherit",
  padding: "6px 8px",
  width: "100%",
  boxSizing: "border-box",
  fontSize: 12,
};

export function Sidebar({
  mode, tool, setMode, setTool, onReset, bgImage, setBgImage,
  onBack, onSave, savedFlash,
  questTitle, questDescription, setQuestTitle, setQuestDescription,
}) {
  return (
    <div style={{
      width: 230,
      background: T.sidebarBg,
      borderLeft: `1px solid ${T.sidebarBorder}`,
      display: "flex", flexDirection: "column",
      padding: "18px 14px",
      gap: 8,
      overflowY: "auto",
    }}>
      {/* Back to library */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            alignSelf: "flex-start", padding: "4px 10px",
            background: T.btnBg, color: T.btnText,
            border: `1px solid ${T.btnBorder}`,
            cursor: "pointer", fontFamily: "inherit", fontSize: 10,
            letterSpacing: 1, marginBottom: 2,
          }}
        >
          ← Library
        </button>
      )}

      {/* Quest title */}
      {setQuestTitle ? (
        mode === "edit" ? (
          <input
            value={questTitle}
            onChange={e => setQuestTitle(e.target.value)}
            placeholder="Quest title"
            style={inputStyle}
          />
        ) : (
          <div style={{ fontSize: 13, color: T.title, fontWeight: "bold", letterSpacing: 1 }}>
            {questTitle}
          </div>
        )
      ) : null}

      {/* Quest description */}
      {setQuestDescription ? (
        mode === "edit" ? (
          <textarea
            value={questDescription}
            onChange={e => setQuestDescription(e.target.value)}
            placeholder="Quest description"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        ) : questDescription ? (
          <div style={{
            fontSize: 10, color: T.textMuted, lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}>
            {questDescription}
          </div>
        ) : null
      ) : null}

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${T.divider}`, marginTop: 2, marginBottom: 2 }} />

      <div style={{
        textAlign: "center", marginBottom: 4,
        fontSize: 13, letterSpacing: 4, color: T.title,
        textTransform: "uppercase", borderBottom: `1px solid ${T.divider}`,
        paddingBottom: 12,
      }}>
        Quest Master
      </div>

      <ModeToggle mode={mode} onSetMode={setMode} />

      {mode === "play"
        ? <PlayPanel onReset={onReset} />
        : <EditPanel pieceCategories={PIECE_CATEGORIES} tool={tool} onSelectTool={setTool} onSave={onSave} savedFlash={savedFlash} />
      }

      {/* Board background selector */}
      <div style={{
        marginTop: 8, padding: "10px 12px",
        background: T.panelBg, border: `1px solid ${T.panelBorder}`,
        fontSize: 10, color: T.textMuted,
      }}>
        <div style={{ marginBottom: 6, letterSpacing: 2, textTransform: "uppercase", fontWeight: "bold", color: T.text }}>
          Board Style
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["board", "Board 1"], ["board2", "Board 2"], ["board3", "Board 3"]].map(([b, label]) => (
            <button key={b} onClick={() => setBgImage(b)} style={{
              flex: 1, padding: "5px 0", fontSize: 9, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: 1, textTransform: "uppercase",
              background: bgImage === b ? T.btnActiveBg : T.btnBg,
              color: bgImage === b ? T.btnActiveText : T.btnText,
              border: `1px solid ${bgImage === b ? T.btnActiveBdr : T.btnBorder}`,
              transition: "all 0.15s",
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: "auto", paddingTop: 14,
        borderTop: `1px solid ${T.divider}`,
        fontSize: 9, color: T.textFaint, lineHeight: 1.8,
        textAlign: "center",
      }}>
        v0.2 — Real HeroQuest board<br />
        22 rooms · quest editor next
      </div>
    </div>
  );
}
