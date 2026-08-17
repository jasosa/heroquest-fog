import { useState } from "react";
import { T, FONT_HEADING, FONT_BODY } from "../../shared/theme.js";
import { EditPanel } from "./EditPanel.jsx";
import { SectionHeader } from "./SectionHeader.jsx";
import { PIECE_CATEGORIES } from "../../shared/pieces.js";
import { useI18n } from "../../shared/i18n/useI18n.js";


function ModeToggle({ mode, onSetMode, t }) {
  return (
    <div className="btn-group w-100 mb-1" role="group" aria-label={t("sidebar.modeToggleAriaLabel")}>
      {["play", "edit"].map(m => (
        <button
          key={m}
          onClick={() => onSetMode(m)}
          className={`btn btn-hq-dark${mode === m ? " active" : ""}`}
          style={{
            padding: "12px 0", fontSize: 12, letterSpacing: 3, minHeight: 44,
            ...(mode === m ? { textShadow: "0 0 8px #f0c04088" } : {}),
          }}
        >
          {m === "play" ? t("common.play") : t("common.edit")}
        </button>
      ))}
    </div>
  );
}

function PlayPanel({ onReset, t }) {
  return (
    <>
      <p style={{ fontSize: 11, color: T.sidebarTextMuted, lineHeight: 1.7, margin: 0, marginTop: 4, fontFamily: FONT_BODY }}>
        {t("sidebar.playIntro")}
      </p>

      <div style={{
        background: T.sidebarPanelBg, border: `1px solid ${T.sidebarPanelBorder}`,
        padding: "10px 12px", fontSize: 10, color: T.sidebarTextMuted, lineHeight: 1.8,
        marginTop: 2, fontFamily: FONT_BODY,
      }}>
        <span style={{ color: T.accentGold }}>{t("sidebar.roomCellLabel")}</span> {t("sidebar.roomCellText")}<br />
        <span style={{ color: T.accentGold }}>{t("sidebar.corridorCellLabel")}</span> {t("sidebar.corridorCellText")}<br />
        <span style={{ color: T.accentGold }}>{t("sidebar.startMarkerLabel")}</span> {t("sidebar.startMarkerText")}
      </div>

      <button onClick={onReset} className="btn btn-hq-dark w-100 mt-1" style={{ color: T.accent, padding: "9px 0", letterSpacing: 2 }}>
        {t("sidebar.resetFog")}
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
  const { locale, setLocale, t } = useI18n();
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
      width: isCollapsed ? 44 : 300,
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

        {/* Back to library + language switcher */}
        <div className="d-flex align-items-center justify-content-between mb-1">
          {onBack && (
            <button
              onClick={onBack}
              className="btn btn-hq-dark btn-sm align-self-start"
              style={{ fontSize: 11, letterSpacing: 2, minHeight: 34 }}
            >
              {t("sidebar.backToLibrary")}
            </button>
          )}
          {!isCollapsed && (
            <div
              role="group"
              aria-label={t("sidebar.languageSwitcherLabel")}
              className="btn-group"
            >
              <button
                onClick={() => setLocale("en")}
                className={`btn btn-hq-dark btn-sm${locale === "en" ? " active" : ""}`}
                style={{ fontSize: 11, minHeight: 34 }}
              >EN</button>
              <button
                onClick={() => setLocale("es")}
                className={`btn btn-hq-dark btn-sm${locale === "es" ? " active" : ""}`}
                style={{ fontSize: 11, minHeight: 34 }}
              >ES</button>
            </div>
          )}
        </div>

        {/* Quest title */}
        <SectionHeader label={t("sidebar.questInfo")} />
        {setQuestTitle ? (
          mode === "edit" ? (
            <input
              value={questTitle}
              onChange={e => setQuestTitle(e.target.value)}
              placeholder={t("sidebar.questTitlePlaceholder")}
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
            <div>
              <label
                htmlFor="sidebar-quest-description"
                style={{ fontSize: 11, color: T.sidebarTextMuted, display: "block", marginBottom: 4 }}
              >
                {t("sidebar.description")}
              </label>
              <textarea
                id="sidebar-quest-description"
                value={questDescription}
                onChange={e => setQuestDescription(e.target.value)}
                placeholder={t("sidebar.questDescriptionPlaceholder")}
                rows={3}
                className="form-control form-control-sm hq-input-dark"
                style={{ resize: "vertical" }}
              />
              <div style={{ fontSize: 10, color: T.sidebarTextMuted, marginTop: 3, opacity: 0.8 }}>
                {t("sidebar.descriptionHint")}
              </div>
            </div>
          ) : questDescription ? (
            <div
              data-testid="play-quest-description"
              style={{
                fontSize: 12, color: T.sidebarText, lineHeight: 1.6, fontFamily: FONT_BODY,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
              }}
            >
              {questDescription}
            </div>
          ) : null
        ) : null}

        {/* Placement message — edit mode only */}
        {setQuestPlacementMessage && mode === "edit" && (
          <div>
            <label
              htmlFor="sidebar-placement-message"
              style={{ fontSize: 11, color: T.sidebarTextMuted, display: "block", marginBottom: 4 }}
            >
              {t("sidebar.placementMessage")}
            </label>
            <textarea
              id="sidebar-placement-message"
              value={placementMessage ?? ""}
              onChange={e => setQuestPlacementMessage(e.target.value)}
              placeholder={t("sidebar.placementMessagePlaceholder")}
              rows={3}
              className="form-control form-control-sm hq-input-dark"
              style={{ resize: "vertical" }}
            />
          </div>
        )}

        <SectionHeader label={t("sidebar.mode")} />

        <ModeToggle mode={mode} onSetMode={setMode} t={t} />

        {mode === "play"
          ? <PlayPanel onReset={onReset} t={t} />
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
          <SectionHeader label={t("sidebar.boardStyle")} />
          <div className="btn-group w-100" role="group">
            {[["board", t("sidebar.board1")], ["board2", t("sidebar.board2")], ["board3", t("sidebar.board3")]].map(([b, label]) => (
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
      </div>
    </aside>
  );
}
