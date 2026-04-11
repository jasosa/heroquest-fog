import { useState } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

export function SpecialMonsterDialog({ monsterLabel, initialIsSpecial, initialNote, onSave, onCancel }) {
  const [isSpecial, setIsSpecial] = useState(initialIsSpecial ?? false);
  const [note, setNote] = useState(initialNote ?? "");

  return (
    <div className="hq-modal-backdrop" onMouseDown={onCancel}>
      <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 360 }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.sidebarBorder}` }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
            <h6 className="modal-title m-0" style={{ color: T.sidebarTitle, fontFamily: FONT_HEADING, fontSize: 14 }}>
              {monsterLabel ?? "Monster"} — Special
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel} />
          </div>
          <div className="modal-body px-3 py-3 d-flex flex-column gap-3">
            <div className="form-check">
              <input
                type="checkbox"
                id="special-monster-chk"
                checked={isSpecial}
                onChange={e => setIsSpecial(e.target.checked)}
                className="form-check-input"
                style={{ accentColor: "#9c27b0" }}
              />
              <label htmlFor="special-monster-chk" className="form-check-label" style={{ color: T.sidebarText, fontSize: 14 }}>
                Mark as Special Monster
              </label>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 11, color: T.sidebarTextMuted }}>Note (shown on hover)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="e.g. Boss with 5 HP, drops the iron key…"
                className="form-control hq-input-dark"
                style={{ resize: "vertical", fontSize: 13 }}
              />
            </div>
          </div>
          <div className="modal-footer py-2 px-3 gap-2" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
            <button onClick={onCancel} className="btn btn-hq-light" style={{ fontSize: 13 }}>Cancel</button>
            <button
              onClick={() => onSave(isSpecial, note)}
              className="btn btn-sm"
              style={{ background: "#9c27b0", color: "#fff", border: "1px solid #7b1fa2", fontSize: 13, fontWeight: "bold" }}
            >Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
