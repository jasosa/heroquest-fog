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

export function AssignQuestBookDialog({ quest, books, onSave, onCancel }) {
  const [selectedBookId, setSelectedBookId] = useState(quest.questBookId ?? "");
  const [questNumber, setQuestNumber] = useState(
    quest.questNumber != null ? String(quest.questNumber) : ""
  );

  function handleSave() {
    onSave(
      selectedBookId === "" ? null : selectedBookId,
      questNumber === "" ? null : Number(questNumber)
    );
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
          Assign to Quest Book
        </div>
        <div style={{ fontSize: 11, color: T.textMuted }}>
          {quest.title}
        </div>
        <select
          value={selectedBookId}
          onChange={e => setSelectedBookId(e.target.value)}
          style={inputStyle}
        >
          <option value="">— No book —</option>
          {books.map(b => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Quest number (optional)"
          value={questNumber}
          onChange={e => setQuestNumber(e.target.value)}
          min={0}
          style={inputStyle}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1, padding: "8px 0",
              background: T.btnActiveBg, color: T.btnActiveText,
              border: `1px solid ${T.btnActiveBdr}`,
              cursor: "pointer", fontFamily: "inherit",
              fontSize: 11, letterSpacing: 1,
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
