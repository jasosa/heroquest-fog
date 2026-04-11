import { useState } from "react";
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
  minWidth: 300,
  boxShadow: "0 8px 32px #0006",
  display: "flex", flexDirection: "column", gap: 14,
};

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: T.btnBg, color: T.text,
  border: `1px solid ${T.btnBorder}`, borderRadius: 4,
  padding: "5px 8px", fontSize: 12, fontFamily: "inherit",
};

export function SecretDoorConfigDialog({ cellKey, entry, secretDoorOptions, onSave, onDelete, onCancel }) {
  const [linkedDoorKey, setLinkedDoorKey] = useState(entry.linkedDoorKey ?? "");
  const [message, setMessage] = useState(entry.message ?? "");

  return (
    <div style={overlayStyle} onMouseDown={onCancel}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
          🗝 Secret Door Search — {cellKey}
        </div>

        <div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>
            Link to a Secret Door (optional)
          </div>
          <select
            value={linkedDoorKey}
            onChange={e => setLinkedDoorKey(e.target.value)}
            style={inputStyle}
          >
            <option value="">— None —</option>
            {secretDoorOptions.map(key => (
              <option key={key} value={key}>Secret Door at {key}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>
            Fallback message (shown when nothing found / already revealed)
          </div>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="You find no secret doors here."
            style={inputStyle}
            autoFocus
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                marginRight: "auto",
                background: "#c62828", color: "#fff",
                border: "none", borderRadius: 4,
                padding: "6px 14px", cursor: "pointer", fontSize: 13,
              }}
            >Delete</button>
          )}
          <button
            onClick={onCancel}
            style={{
              background: T.btnBg, color: T.btnText,
              border: `1px solid ${T.btnBorder}`, borderRadius: 4,
              padding: "6px 14px", cursor: "pointer", fontSize: 13,
            }}
          >Cancel</button>
          <button
            onClick={() => onSave(linkedDoorKey || null, message)}
            style={{
              background: T.btnActiveBg, color: T.btnActiveText,
              border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
              padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}
