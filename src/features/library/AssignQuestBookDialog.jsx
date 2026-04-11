import { useState } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

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
      className="hq-modal-backdrop"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 320 }}>
        <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.accentGold}` }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
            <h6 className="modal-title m-0" style={{ color: T.sidebarTitle, letterSpacing: 2, textTransform: "uppercase", fontFamily: FONT_HEADING, fontSize: 13 }}>
              Assign to Quest Book
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel} />
          </div>
          <div className="modal-body px-3 py-3 d-flex flex-column gap-2">
            <div style={{ fontSize: 11, color: T.sidebarTextMuted }}>{quest.title}</div>
            <select
              value={selectedBookId}
              onChange={e => setSelectedBookId(e.target.value)}
              className="form-select form-select-sm hq-input-dark"
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
              className="form-control form-control-sm hq-input-dark"
            />
          </div>
          <div className="modal-footer py-2 px-3 gap-2" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
            <button onClick={handleSave} className="btn btn-hq-light active flex-grow-1" style={{ fontSize: 11 }}>
              Save
            </button>
            <button onClick={onCancel} className="btn btn-hq-light flex-grow-1" style={{ fontSize: 11 }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
