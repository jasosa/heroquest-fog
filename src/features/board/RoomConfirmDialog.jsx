import { T } from "../../shared/theme.js";

export function RoomConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      zIndex: 20,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: T.sidebarBg,
        border: `2px solid ${T.accentGold}`,
        boxShadow: "0 4px 24px #0008",
        padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 14,
        maxWidth: 260,
        fontFamily: "inherit",
      }}>
        <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>
          No revealed door connects to this room yet.
          <br />Reveal anyway?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "8px 0",
            background: "#2a4a1a", color: "#d8f0c8",
            border: `1px solid ${T.accentGold}`,
            cursor: "pointer", fontFamily: "inherit",
            fontSize: 11, letterSpacing: 1,
          }}>
            Yes — Reveal
          </button>
          <button onClick={onCancel} style={{
            flex: 1, padding: "8px 0",
            background: T.btnBg, color: T.btnText,
            border: `1px solid ${T.btnBorder}`,
            cursor: "pointer", fontFamily: "inherit",
            fontSize: 11, letterSpacing: 1,
          }}>
            No — Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
