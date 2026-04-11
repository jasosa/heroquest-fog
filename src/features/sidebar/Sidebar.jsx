import { useState } from "react";
import { T, FONT_HEADING, FONT_BODY } from "../../shared/theme.js";
import { EditPanel } from "./EditPanel.jsx";
import { PIECE_CATEGORIES } from "../../shared/pieces.js";


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
