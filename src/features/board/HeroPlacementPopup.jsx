import { T } from "../../shared/theme.js";

const DEFAULT_MESSAGE = "Place your heroes in the stairway";

const overlayStyle = {
  position: "absolute", inset: 0,
  background: "#0008",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 100,
};

const dialogStyle = {
  background: T.sidebarBg,
  border: `2px solid ${T.sidebarBorder}`,
  borderRadius: 8,
  padding: 24,
  minWidth: 280,
  maxWidth: 380,
  boxShadow: "0 8px 32px #0006",
  display: "flex", flexDirection: "column", gap: 16,
};

export function HeroPlacementPopup({ message, onClose }) {
  const displayMessage = message || DEFAULT_MESSAGE;

  return (
    <div style={overlayStyle} onMouseDown={onClose}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.title, letterSpacing: 1 }}>
          Before you begin...
        </div>
        <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {displayMessage}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: T.btnActiveBg, color: T.btnActiveText,
              border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
              padding: "6px 22px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
