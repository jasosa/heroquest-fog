import { useState } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

export function TrapConfigDialog({ initialSpringMessage, initialRemoveAfterSpring, trapTypeLabel, onSave, onCancel }) {
  const [springMessage, setSpringMessage] = useState(initialSpringMessage ?? "");
  const [removeAfterSpring, setRemoveAfterSpring] = useState(initialRemoveAfterSpring ?? true);
  const [applyToAll, setApplyToAll] = useState(false);

  return (
    <div className="hq-modal-backdrop" onMouseDown={onCancel}>
      <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 360 }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.sidebarBorder}` }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
            <h6 className="modal-title m-0" style={{ color: T.sidebarTitle, fontFamily: FONT_HEADING, fontSize: 14 }}>
              Trap — Configuration
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel} />
          </div>
          <div className="modal-body px-3 py-3 d-flex flex-column gap-3">
            <div>
              <label htmlFor="trap-spring-msg" className="form-label" style={{ fontSize: 12, color: T.sidebarTextMuted }}>
                Spring effect message
              </label>
              <textarea
                id="trap-spring-msg"
                rows={3}
                value={springMessage}
                onChange={e => setSpringMessage(e.target.value)}
                placeholder="Optional message shown when trap springs"
                className="form-control hq-input-dark"
                style={{ resize: "vertical", fontSize: 13 }}
              />
            </div>
            <div className="form-check">
              <input
                id="trap-remove-after"
                type="checkbox"
                checked={removeAfterSpring}
                onChange={e => setRemoveAfterSpring(e.target.checked)}
                className="form-check-input"
              />
              <label htmlFor="trap-remove-after" className="form-check-label" style={{ fontSize: 13, color: T.sidebarText }}>
                Remove from board after spring
              </label>
            </div>
            {trapTypeLabel && (
              <div className="form-check">
                <input
                  id="trap-apply-to-all"
                  type="checkbox"
                  checked={applyToAll}
                  onChange={e => setApplyToAll(e.target.checked)}
                  className="form-check-input"
                />
                <label htmlFor="trap-apply-to-all" className="form-check-label" style={{ fontSize: 13, color: T.sidebarText }}>
                  Apply to all {trapTypeLabel} traps in this quest
                </label>
              </div>
            )}
          </div>
          <div className="modal-footer py-2 px-3 gap-2" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
            <button onClick={onCancel} className="btn btn-hq-light" style={{ fontSize: 13 }}>Cancel</button>
            <button
              onClick={() => onSave({ springMessage, removeAfterSpring, applyToAll })}
              className="btn btn-hq-light active"
              style={{ fontSize: 13 }}
            >Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
