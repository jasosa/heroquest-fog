import { useState } from "react";
import { T } from "../../shared/theme.js";

const overlayStyle = {
  position: "fixed", inset: 0,
  background: "#0008",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 100,
};

const dialogStyle = {
  background: T.sidebarBg,
  border: `2px solid ${T.sidebarBorder}`,
  borderRadius: 8,
  padding: 20,
  minWidth: 260,
  maxWidth: 340,
  boxShadow: "0 8px 32px #0006",
  display: "flex", flexDirection: "column", gap: 14,
};

export function TrapConfigDialog({ initialSpringMessage, initialRemoveAfterSpring, trapTypeLabel, onSave, onCancel }) {
  const [springMessage, setSpringMessage] = useState(initialSpringMessage ?? "");
  const [removeAfterSpring, setRemoveAfterSpring] = useState(initialRemoveAfterSpring ?? true);
  const [applyToAll, setApplyToAll] = useState(false);

  const msgId = "trap-spring-msg";
  const chkId = "trap-remove-after";
  const allChkId = "trap-apply-to-all";

  return (
    <div style={overlayStyle} onMouseDown={onCancel}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
          Trap — Configuration
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label htmlFor={msgId} style={{ fontSize: 12, color: T.textMuted }}>Spring effect message</label>
          <textarea
            id={msgId}
            rows={3}
            value={springMessage}
            onChange={e => setSpringMessage(e.target.value)}
            placeholder="Optional message shown when trap springs"
            style={{
              width: "100%", boxSizing: "border-box",
              background: T.btnBg, color: T.text,
              border: `1px solid ${T.btnBorder}`, borderRadius: 4,
              padding: "6px 8px", fontSize: 13,
              fontFamily: "inherit", resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            id={chkId}
            type="checkbox"
            checked={removeAfterSpring}
            onChange={e => setRemoveAfterSpring(e.target.checked)}
          />
          <label htmlFor={chkId} style={{ fontSize: 13, color: T.text, cursor: "pointer" }}>
            Remove from board after spring
          </label>
        </div>

        {trapTypeLabel && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id={allChkId}
              type="checkbox"
              checked={applyToAll}
              onChange={e => setApplyToAll(e.target.checked)}
            />
            <label htmlFor={allChkId} style={{ fontSize: 13, color: T.text, cursor: "pointer" }}>
              Apply to all {trapTypeLabel} traps in this quest
            </label>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: T.btnBg, color: T.btnText,
              border: `1px solid ${T.btnBorder}`, borderRadius: 4,
              padding: "6px 14px", cursor: "pointer", fontSize: 13,
            }}
          >Cancel</button>
          <button
            onClick={() => onSave({ springMessage, removeAfterSpring, applyToAll })}
            style={{
              background: T.btnActiveBg, color: T.btnActiveText,
              border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
              padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}
