import { useState } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

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
    <div className="hq-modal-backdrop" onMouseDown={onCancel}>
      <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 380 }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.sidebarBorder}` }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
            <h6 className="modal-title m-0" style={{ color: T.sidebarTitle, fontFamily: FONT_HEADING, fontSize: 14 }}>
              🔍 {regionId} — Search Notes
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel} />
          </div>
          <div className="modal-body px-3 py-3 d-flex flex-column gap-2">
            <div style={{ fontSize: 11, color: T.sidebarTextMuted }}>Leave empty to use the default message.</div>
            {notes.map((note, i) => (
              <div key={i}>
                <label className="form-label mb-1" style={{ fontSize: 11, color: T.sidebarTextMuted }}>Search {i + 1}</label>
                <input
                  value={note}
                  onChange={e => setNote(i, e.target.value)}
                  placeholder="e.g. You find a hidden passage…"
                  autoFocus={i === 0}
                  className="form-control form-control-sm hq-input-dark"
                />
              </div>
            ))}
          </div>
          <div className="modal-footer py-2 px-3 gap-2" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
            {onDelete && (
              <button onClick={onDelete} className="btn btn-danger btn-sm me-auto">Delete</button>
            )}
            <button onClick={onCancel} className="btn btn-hq-light" style={{ fontSize: 13 }}>Cancel</button>
            <button onClick={() => onSave(notes)} className="btn btn-hq-light active" style={{ fontSize: 13 }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
