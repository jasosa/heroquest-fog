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
  boxShadow: "0 8px 32px #0006",
  display: "flex", flexDirection: "column", gap: 14,
};

export function SearchNoteDialog({ regionId, initialNote, onSave, onCancel }) {
  const [note, setNote] = useState(initialNote ?? "");

  return (
    <div style={overlayStyle} onMouseDown={onCancel}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
          🔍 {regionId} — Search Note
        </div>

        <div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Note (shown to players on search)</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. You find a hidden passage…"
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              background: T.btnBg, color: T.text,
              border: `1px solid ${T.btnBorder}`, borderRadius: 4,
              padding: "6px 8px", fontSize: 13, resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

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
            onClick={() => onSave(note)}
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
