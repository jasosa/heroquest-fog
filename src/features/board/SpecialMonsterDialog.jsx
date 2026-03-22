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

export function SpecialMonsterDialog({ monsterLabel, initialIsSpecial, initialNote, onSave, onCancel }) {
  const [isSpecial, setIsSpecial] = useState(initialIsSpecial ?? false);
  const [note, setNote] = useState(initialNote ?? "");

  return (
    <div style={overlayStyle} onMouseDown={onCancel}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
          {monsterLabel ?? "Monster"} — Special
        </div>

        {/* Special toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isSpecial}
            onChange={e => setIsSpecial(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#9c27b0" }}
          />
          <span style={{ color: T.text, fontSize: 14 }}>Mark as Special Monster</span>
        </label>

        {/* Note textarea */}
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Note (shown on hover)</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Boss with 5 HP, drops the iron key…"
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
          <button
            onClick={onCancel}
            style={{
              background: T.btnBg, color: T.btnText,
              border: `1px solid ${T.btnBorder}`, borderRadius: 4,
              padding: "6px 14px", cursor: "pointer", fontSize: 13,
            }}
          >Cancel</button>
          <button
            onClick={() => onSave(isSpecial, note)}
            style={{
              background: "#9c27b0", color: "#fff",
              border: "1px solid #7b1fa2", borderRadius: 4,
              padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}
