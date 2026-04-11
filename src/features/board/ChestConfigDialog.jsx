import { useState } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

export function ChestConfigDialog({ initialHasTrap, initialTrapNote, onSave, onCancel }) {
  const [hasTrap, setHasTrap] = useState(initialHasTrap ?? false);
  const [trapNote, setTrapNote] = useState(initialTrapNote ?? "");

  return (
    <div className="hq-modal-backdrop" onMouseDown={onCancel}>
      <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 360 }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.sidebarBorder}` }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
            <h6 className="modal-title m-0" style={{ color: T.sidebarTitle, fontFamily: FONT_HEADING, fontSize: 14 }}>
              Chest — Trap Configuration
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel} />
          </div>
          <div className="modal-body px-3 py-3 d-flex flex-column gap-3">
            <div className="form-check">
              <input
                type="checkbox"
                id="chest-has-trap"
                checked={hasTrap}
                onChange={e => setHasTrap(e.target.checked)}
                className="form-check-input"
                style={{ accentColor: "#b8860b" }}
              />
              <label htmlFor="chest-has-trap" className="form-check-label" style={{ color: T.sidebarText, fontSize: 14 }}>
                Contains a trap
              </label>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 11, color: T.sidebarTextMuted }}>Trap message (shown on trigger)</label>
              <input
                type="text"
                value={trapNote}
                onChange={e => setTrapNote(e.target.value)}
                placeholder="e.g. A rusty spike shoots out!"
                className="form-control form-control-sm hq-input-dark"
              />
            </div>
          </div>
          <div className="modal-footer py-2 px-3 gap-2" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
            <button onClick={onCancel} className="btn btn-hq-light" style={{ fontSize: 13 }}>Cancel</button>
            <button
              onClick={() => onSave(hasTrap, trapNote)}
              className="btn btn-sm"
              style={{ background: "#b8860b", color: "#fff", border: "1px solid #8b6508", fontSize: 13, fontWeight: "bold" }}
            >Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
