import { useState } from "react";
import { T } from "../../theme.js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
  minWidth: 280,
  boxShadow: "0 8px 32px #0006",
  display: "flex", flexDirection: "column", gap: 14,
};

export function LetterMarkerDialog({ initialLetter, initialNote, onSave, onDelete, onCancel }) {
  const [letter, setLetter] = useState(initialLetter ?? "A");
  const [note, setNote] = useState(initialNote ?? "");

  return (
    <div style={overlayStyle} onMouseDown={onCancel}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.text }}>Edit Letter Marker</div>

        {/* Letter grid */}
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Letter</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 240 }}>
            {LETTERS.map(l => (
              <button
                key={l}
                onClick={() => setLetter(l)}
                style={{
                  width: 28, height: 28,
                  background: letter === l ? T.btnActiveBg : T.btnBg,
                  color: letter === l ? T.btnActiveText : T.btnText,
                  border: `1px solid ${letter === l ? T.btnActiveBdr : T.btnBorder}`,
                  borderRadius: 4,
                  fontWeight: "bold", fontSize: 12,
                  cursor: "pointer",
                }}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Note textarea */}
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Note (shown on hover / tap)</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="Optional note…"
            style={{
              width: "100%", boxSizing: "border-box",
              background: T.btnBg, color: T.text,
              border: `1px solid ${T.btnBorder}`, borderRadius: 4,
              padding: "6px 8px", fontSize: 13, resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Actions */}
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
            onClick={() => onSave(letter, note)}
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
