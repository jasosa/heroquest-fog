import { useState } from "react";
import { T, FONT_HEADING, FONT_BODY } from "../../shared/theme.js";
import { EditPanel } from "./EditPanel.jsx";
import { PIECE_CATEGORIES } from "../../shared/pieces.js";

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
    <div className="btn-group w-100 mb-1" role="group" aria-label="Mode toggle">
      {["play", "edit"].map(m => (
        <button
          key={m}
          onClick={() => onSetMode(m)}
          className={`btn btn-hq-dark${mode === m ? " active" : ""}`}
          style={{ padding: "8px 0", fontSize: 10, letterSpacing: 2 }}
        >
          {m === "play" ? "⚔ Play" : "✎ Edit"}
        </button>
      ))}
    </div>
  );
}

function PlayPanel({ onReset }) {
  const [legendVisible, setLegendVisible] = useState(
    () => localStorage.getItem("hq_legend_visible") !== "false"
  );

  function toggleLegend() {
    const next = !legendVisible;
    setLegendVisible(next);
    localStorage.setItem("hq_legend_visible", String(next));
  }

  return (
    <>
      <p style={{ fontSize: 11, color: T.sidebarTextMuted, lineHeight: 1.7, margin: 0, marginTop: 4, fontFamily: FONT_BODY }}>
        Click any dungeon cell to reveal what a hero standing there would see.
      </p>

      <div style={{
        background: T.sidebarPanelBg, border: `1px solid ${T.sidebarPanelBorder}`,
        padding: "10px 12px", fontSize: 10, color: T.sidebarTextMuted, lineHeight: 1.8,
        marginTop: 2, fontFamily: FONT_BODY,
      }}>
        <span style={{ color: T.accentGold }}>Room cell</span> → entire room revealed<br />
        <span style={{ color: T.accentGold }}>Corridor cell</span> → straight line until wall or blocker<br />
        <span style={{ color: T.accentGold }}>Start marker</span> → auto-revealed at game start
      </div>

      <button onClick={onReset} className="btn btn-hq-dark w-100 mt-1" style={{ color: T.accent, padding: "9px 0", letterSpacing: 2 }}>
        ↺ Reset Fog of War
      </button>

      <div style={{ marginTop: 8, fontSize: 9, color: T.sidebarTextMuted, lineHeight: 1.8, fontFamily: FONT_BODY }}>
        <div className="d-flex align-items-center justify-content-between mb-1">
          <div style={{ color: T.sidebarTitle, letterSpacing: 3, textTransform: "uppercase", fontFamily: FONT_HEADING, fontSize: 9 }}>
            Legend
          </div>
          <button
            onClick={toggleLegend}
            className="btn btn-hq-dark"
            style={{ padding: "1px 6px", fontSize: 9, letterSpacing: 1 }}
            title={legendVisible ? "Hide legend" : "Show legend"}
          >
            {legendVisible ? "Hide" : "Show"}
          </button>
        </div>

        {legendVisible && (
          <>
            {[
              { color: "#271809", label: "Corridor (revealed)" },
              { color: "#060401", label: "Unexplored" },
            ].map(({ color, label }) => (
              <div key={label} className="d-flex align-items-center gap-2">
                <div style={{ width: 10, height: 10, background: color, border: `1px solid ${T.sidebarBtnBorder}`, flexShrink: 0 }} />
                {label}
              </div>
            ))}
            {Object.entries(ROOM_COLORS).map(([id, { revealed }]) => (
              <div key={id} className="d-flex align-items-center gap-2">
                <div style={{ width: 10, height: 10, background: revealed, border: `1px solid ${T.sidebarBtnBorder}`, flexShrink: 0 }} />
                {id} (revealed)
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

export function Sidebar({
  mode, tool, setMode, setTool, onReset, bgImage, setBgImage,
  onBack, onSave, savedFlash, saveError,
  questTitle, questDescription, setQuestTitle, setQuestDescription,
  placementMessage, setQuestPlacementMessage,
}) {
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("hq_sidebar_collapsed") === "true"
  );

  function toggleCollapsed() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("hq_sidebar_collapsed", String(next));
  }

  return (
    <aside className="hq-sidebar d-flex flex-column" style={{
      width: isCollapsed ? 44 : 270,
      transition: "width 180ms ease-out",
      overflow: "hidden",
      flexShrink: 0,
      background: T.sidebarBg,
      borderLeft: `1px solid ${T.sidebarBorder}`,
    }}>
      {/* Toggle button */}
      <button
        onClick={toggleCollapsed}
        className="btn btn-hq-dark w-100 border-0 border-bottom"
        style={{ minHeight: 44, fontSize: 16, color: T.sidebarTitle, borderBottomColor: `${T.sidebarBorder} !important` }}
      >
        {isCollapsed ? "‹" : "›"}
      </button>

      {/* Inner content */}
      <div className="d-flex flex-column flex-grow-1 overflow-y-auto gap-2 p-3">

        {/* Back to library */}
        {onBack && (
          <button
            onClick={onBack}
            className="btn btn-hq-dark btn-sm align-self-start mb-1"
            style={{ fontSize: 9, letterSpacing: 2 }}
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
              className="form-control form-control-sm hq-input-dark"
            />
          ) : (
            <div style={{ fontSize: 13, color: T.sidebarTitle, fontWeight: "bold", letterSpacing: 1, fontFamily: FONT_HEADING }}>
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
              className="form-control form-control-sm hq-input-dark"
              style={{ resize: "vertical" }}
            />
          ) : questDescription ? (
            <div style={{
              fontSize: 10, color: T.sidebarTextMuted, lineHeight: 1.5, fontFamily: FONT_BODY,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
            }}>
              {questDescription}
            </div>
          ) : null
        ) : null}

        {/* Placement message — edit mode only */}
        {setQuestPlacementMessage && mode === "edit" && (
          <textarea
            value={placementMessage ?? ""}
            onChange={e => setQuestPlacementMessage(e.target.value)}
            placeholder="Hero placement message (shown at quest start)"
            rows={3}
            className="form-control form-control-sm hq-input-dark"
            style={{ resize: "vertical" }}
          />
        )}

        <hr style={{ borderColor: T.sidebarDivider, margin: "2px 0" }} />

        <div style={{
          textAlign: "center", marginBottom: 4,
          fontSize: 11, letterSpacing: 4, color: T.sidebarTitle,
          textTransform: "uppercase", borderBottom: `1px solid ${T.sidebarDivider}`,
          paddingBottom: 12, fontFamily: FONT_HEADING,
          textShadow: "0 0 12px #c8921a66",
        }}>
          Quest Master
        </div>

        <ModeToggle mode={mode} onSetMode={setMode} />

        {mode === "play"
          ? <PlayPanel onReset={onReset} />
          : (
            <EditPanel
              pieceCategories={PIECE_CATEGORIES}
              tool={tool}
              onSelectTool={setTool}
              onSave={onSave}
              savedFlash={savedFlash}
              saveError={saveError}
              tileSet={bgImage}
            />
          )
        }

        {/* Board style selector */}
        <div className="p-2 mt-2" style={{ background: T.sidebarPanelBg, border: `1px solid ${T.sidebarPanelBorder}` }}>
          <div className="mb-2" style={{ letterSpacing: 3, textTransform: "uppercase", fontFamily: FONT_HEADING, fontSize: 9, color: T.sidebarTitle }}>
            Board Style
          </div>
          <div className="btn-group w-100" role="group">
            {[["board", "Board 1"], ["board2", "Board 2"], ["board3", "Board 3"]].map(([b, label]) => (
              <button
                key={b}
                onClick={() => setBgImage(b)}
                className={`btn btn-hq-dark${bgImage === b ? " active" : ""}`}
                style={{ flex: 1, padding: "5px 0", fontSize: 9, letterSpacing: 1 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-3" style={{
          borderTop: `1px solid ${T.sidebarDivider}`,
          fontSize: 9, color: T.sidebarTextFaint, lineHeight: 1.8,
          textAlign: "center", fontFamily: FONT_BODY, fontStyle: "italic",
        }}>
          v0.2 — Real HeroQuest board<br />
          22 rooms · quest editor next
        </div>
      </div>
    </aside>
  );
}
