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

export function SearchNoteDialog({ regionId, initialNotes, onSave, onDelete, onCancel }) {
  const [notes, setNotes] = useState(() => {
    const base = Array.isArray(initialNotes) ? [...initialNotes] : ["", "", "", ""];
    while (base.length < 4) base.push("");
    return base;
  });

  function setNote(i, value) {
    setNotes(prev => { const n = [...prev]; n[i] = value; return n; });
  }

  return (
    <div style={overlayStyle} onMouseDown={onCancel}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
          🔍 {regionId} — Search Notes
        </div>

        <div style={{ fontSize: 11, color: T.textMuted }}>
          Leave empty to use the default message.
        </div>

        {notes.map((note, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>Search {i + 1}</div>
            <input
              value={note}
              onChange={e => setNote(i, e.target.value)}
              placeholder="e.g. You find a hidden passage…"
              autoFocus={i === 0}
              style={inputStyle}
            />
          </div>
        ))}

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
            onClick={() => onSave(notes)}
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
