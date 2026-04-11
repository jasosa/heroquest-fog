import { useState } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

export function SecretDoorConfigDialog({ cellKey, entry, secretDoorOptions, onSave, onDelete, onCancel }) {
  const [linkedDoorKey, setLinkedDoorKey] = useState(entry.linkedDoorKey ?? "");
  const [message, setMessage] = useState(entry.message ?? "");

  return (
    <div className="hq-modal-backdrop" onMouseDown={onCancel}>
      <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 380 }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.sidebarBorder}` }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
            <h6 className="modal-title m-0" style={{ color: T.sidebarTitle, fontFamily: FONT_HEADING, fontSize: 14 }}>
              🗝 Secret Door Search — {cellKey}
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel} />
          </div>
          <div className="modal-body px-3 py-3 d-flex flex-column gap-3">
            <div>
              <label className="form-label" style={{ fontSize: 11, color: T.sidebarTextMuted }}>
                Link to a Secret Door (optional)
              </label>
              <select
                value={linkedDoorKey}
                onChange={e => setLinkedDoorKey(e.target.value)}
                className="form-select form-select-sm hq-input-dark"
              >
                <option value="">— None —</option>
                {secretDoorOptions.map(key => (
                  <option key={key} value={key}>Secret Door at {key}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 11, color: T.sidebarTextMuted }}>
                Fallback message (shown when nothing found / already revealed)
              </label>
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="You find no secret doors here."
                autoFocus
                className="form-control form-control-sm hq-input-dark"
              />
            </div>
          </div>
          <div className="modal-footer py-2 px-3 gap-2" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
            {onDelete && (
              <button onClick={onDelete} className="btn btn-danger btn-sm me-auto">Delete</button>
            )}
            <button onClick={onCancel} className="btn btn-hq-light" style={{ fontSize: 13 }}>Cancel</button>
            <button
              onClick={() => onSave(linkedDoorKey || null, message)}
              className="btn btn-hq-light active"
              style={{ fontSize: 13 }}
            >Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
