import { useState } from "react";
import { T } from "../../theme.js";

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

export function TrapConfigDialog({ initialTrapNote, onSave, onCancel }) {
  const [trapNote, setTrapNote] = useState(initialTrapNote ?? "");

  return (
    <div style={overlayStyle} onMouseDown={onCancel}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
          Trap — Note Configuration
        </div>

        <textarea
          rows={3}
          value={trapNote}
          onChange={e => setTrapNote(e.target.value)}
          placeholder="Optional DM note for this trap"
          style={{
            width: "100%", boxSizing: "border-box",
            background: T.btnBg, color: T.text,
            border: `1px solid ${T.btnBorder}`, borderRadius: 4,
            padding: "6px 8px", fontSize: 13,
            fontFamily: "inherit", resize: "vertical",
          }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: T.btnBg, color: T.btnText,
              border: `1px solid ${T.btnBorder}`, borderRadius: 4,
              padding: "6px 14px", cursor: "pointer", fontSize: 13,
            }}
          >Cancel</button>
          <button
            onClick={() => onSave(trapNote)}
            style={{
              background: "#b8860b", color: "#fff",
              border: "1px solid #8b6508", borderRadius: 4,
              padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}
