import { T } from "../../shared/theme.js";

const overlayStyle = {
  position: "fixed", inset: 0,
  background: "#0008",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 100,
};

const dialogStyle = {
  background: T.sidebarBg,
  border: `2px solid ${T.sidebarBorder}`,
  borderRadius: 8,
  padding: 20,
  minWidth: 260,
  maxWidth: 340,
  boxShadow: "0 8px 32px #0006",
  display: "flex", flexDirection: "column", gap: 14,
};

export function SecretDoorResultPopup({ action, text, onClose }) {
  const isReveal = action === "reveal";

  return (
    <div style={overlayStyle} onMouseDown={onClose}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
          {isReveal ? "🗝 Secret Door Found!" : "🗝 Search Result"}
        </div>
        <div style={{ fontSize: 15, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {isReveal ? "You discovered a secret door!" : text}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: T.btnActiveBg, color: T.btnActiveText,
              border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
              padding: "6px 18px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
            }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}
