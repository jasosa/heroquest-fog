import { useState } from "react";
import { T } from "../../theme.js";

const inputStyle = {
  background: T.btnBg,
  border: `1px solid ${T.btnBorder}`,
  color: T.text,
  fontFamily: "inherit",
  padding: "6px 8px",
  width: "100%",
  boxSizing: "border-box",
  fontSize: 12,
};

export function EditQuestBookDialog({ initialTitle, initialDescription = "", onSave, onCancel }) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");

  function handleSave() {
    if (!title.trim()) return;
    onSave(title.trim(), description.trim());
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: T.sidebarBg,
        border: `2px solid ${T.accentGold}`,
        boxShadow: "0 4px 24px #0008",
        padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 12,
        width: 320,
        fontFamily: "inherit",
      }}>
        <div style={{ fontSize: 13, color: T.title, letterSpacing: 2, textTransform: "uppercase" }}>
          Edit Quest Book
        </div>
        <input
          placeholder="Book title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          style={inputStyle}
          autoFocus
        />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={inputStyle}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            style={{
              flex: 1, padding: "8px 0",
              background: title.trim() ? T.btnActiveBg : T.btnBg,
              color: title.trim() ? T.btnActiveText : T.textFaint,
              border: `1px solid ${title.trim() ? T.btnActiveBdr : T.btnBorder}`,
              cursor: title.trim() ? "pointer" : "default",
              fontFamily: "inherit", fontSize: 11, letterSpacing: 1,
            }}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "8px 0",
              background: T.btnBg, color: T.btnText,
              border: `1px solid ${T.btnBorder}`,
              cursor: "pointer", fontFamily: "inherit",
              fontSize: 11, letterSpacing: 1,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
