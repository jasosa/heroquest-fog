import { useState } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

export function NoteMarkerDialog({ initialNote, onSave, onDelete, onCancel }) {
  const [note, setNote] = useState(initialNote ?? "");

  return (
    <div className="hq-modal-backdrop" onMouseDown={onCancel}>
      <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 360 }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.sidebarBorder}` }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
            <h6 className="modal-title m-0" style={{ color: T.sidebarTitle, fontFamily: FONT_HEADING, fontSize: 14 }}>
              📝 Event Note
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel} />
          </div>
          <div className="modal-body px-3 py-3">
            <label className="form-label" style={{ fontSize: 11, color: T.sidebarTextMuted }}>
              Note (shown on hover / tap in play mode)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              placeholder="e.g. The heroes hear a faint sound from behind the wall…"
              autoFocus
              className="form-control hq-input-dark"
              style={{ resize: "vertical", fontSize: 13 }}
            />
          </div>
          <div className="modal-footer py-2 px-3 gap-2" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
            {onDelete && (
              <button onClick={onDelete} className="btn btn-danger btn-sm me-auto">Delete</button>
            )}
            <button onClick={onCancel} className="btn btn-hq-light" style={{ fontSize: 13 }}>Cancel</button>
            <button onClick={() => onSave(note)} className="btn btn-hq-light active" style={{ fontSize: 13 }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
