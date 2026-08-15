import { useState, useEffect } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

export function NewQuestDialog({ books, onCreate, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questBookId, setQuestBookId] = useState(null);
  const [questNumber, setQuestNumber] = useState("");

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleCreate() {
    if (!title.trim()) return;
    onCreate(
      title.trim(),
      description.trim(),
      questBookId,
      questNumber === "" ? null : Number(questNumber)
    );
  }

  return (
    <div
      className="hq-modal-backdrop"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 420 }}>
        <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.accentGold}` }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
            <h6 className="modal-title m-0" style={{ color: T.sidebarTitle, letterSpacing: 2, textTransform: "uppercase", fontFamily: FONT_HEADING, fontSize: 13 }}>
              New Quest
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel} />
          </div>
          <div className="modal-body px-3 py-3 d-flex flex-column gap-2" style={{ overflowY: "auto", maxHeight: "60vh" }}>
            <input
              placeholder="Quest title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-control form-control-sm hq-input-dark"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="form-control form-control-sm hq-input-dark"
              style={{ resize: "vertical" }}
            />
            <select
              value={questBookId ?? ""}
              onChange={e => setQuestBookId(e.target.value || null)}
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
            <button onClick={handleCreate} disabled={!title.trim()} className="btn btn-hq-light active flex-grow-1" style={{ fontSize: 11 }}>
              Create &amp; Edit
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
