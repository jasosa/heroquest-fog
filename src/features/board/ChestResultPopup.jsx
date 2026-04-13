import { useState } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

const overlayStyle = {
  position: "fixed", inset: 0,
  background: "#0008",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 100,
};

const dialogStyle = {
  background: T.sidebarBg,
  border: `2px solid ${T.accentGold}`,
  borderRadius: 8,
  padding: 20,
  minWidth: 260,
  maxWidth: 340,
  boxShadow: "0 8px 32px #0006",
  maxHeight: "90vh",
  overflowY: "auto",
  display: "flex", flexDirection: "column", gap: 14,
};

const btnClose = {
  background: T.btnActiveBg, color: T.btnActiveText,
  border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
  padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
};

const CHEST_RULES_MESSAGE =
  "A chest can contain a trap. If a hero searches for treasure in a room with a chest and the chest is trapped, the hero will be impacted by the trap. To avoid that, a hero adjacent to the chest can try to disarm the trap following regular HQ rules. If you fail, the trap is sprung (click Spring Trap) otherwise click Disarm.";

export function ChestResultPopup({ hasTrap, springMessage, anchorKey, onSpringTrap, onDisarmTrap, onResolve, onClose }) {
  const [phase, setPhase] = useState("options");
  const [prevPhase, setPrevPhase] = useState("options");

  function doSpring() {
    onResolve?.(anchorKey);
    if (hasTrap) {
      onSpringTrap?.(anchorKey, false);
      setPhase("spring_result");
    } else {
      setPhase("no_trap_result");
    }
  }

  function requestDisarm() {
    if (hasTrap) {
      setPrevPhase(phase);
      setPhase("disarm_confirm");
    } else {
      onResolve?.(anchorKey);
      setPhase("no_trap_result");
    }
  }

  function confirmDisarm() {
    onResolve?.(anchorKey);
    onDisarmTrap?.(anchorKey);
    setPhase("disarm_result");
  }

  function cancelDisarm() {
    setPhase(prevPhase);
  }

  // ── no_trap_result ────────────────────────────────────────────────────────
  if (phase === "no_trap_result") {
    return (
      <div data-testid="chest-popup-backdrop" style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: "#2e7d32", fontFamily: FONT_HEADING }}>
            No Trap
          </div>
          <div style={{ fontSize: 13, color: T.sidebarText, lineHeight: 1.5 }}>
            The chest was safe — there was no trap.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── spring_result ─────────────────────────────────────────────────────────
  if (phase === "spring_result") {
    return (
      <div data-testid="chest-popup-backdrop" style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Trap Sprung!</div>
          {springMessage && (
            <div style={{ fontSize: 13, color: T.sidebarText }}>{springMessage}</div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── disarm_confirm ────────────────────────────────────────────────────────
  if (phase === "disarm_confirm") {
    return (
      <div data-testid="chest-popup-backdrop" style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Disarm Trap?</div>
          <div style={{ fontSize: 13, color: T.sidebarText, lineHeight: 1.5 }}>
            Are you sure you want to disarm this trap? It will be removed for this session.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={cancelDisarm}
              style={{
                background: T.btnBg, color: T.btnText, border: `1px solid ${T.btnBorder}`,
                borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontSize: 13,
              }}
            >Cancel</button>
            <button onClick={confirmDisarm} style={btnClose}>Confirm Disarm</button>
          </div>
        </div>
      </div>
    );
  }

  // ── disarm_result ─────────────────────────────────────────────────────────
  if (phase === "disarm_result") {
    return (
      <div data-testid="chest-popup-backdrop" style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Trap Disarmed</div>
          <div style={{ fontSize: 13, color: T.sidebarText }}>
            The trap has been safely disarmed and removed for this session.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── options ───────────────────────────────────────────────────────────────
  return (
    <div data-testid="chest-popup-backdrop" style={overlayStyle} onMouseDown={onClose}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Chest — Trap!</div>
        <div style={{ fontSize: 13, color: T.sidebarText, lineHeight: 1.5 }}>
          {CHEST_RULES_MESSAGE}
        </div>
        {springMessage && (
          <div style={{ fontSize: 13, color: T.sidebarText, lineHeight: 1.5 }}>{springMessage}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={doSpring}
            style={{
              background: "#c62828", color: "#fff", border: "none", borderRadius: 4,
              padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold", textAlign: "left",
            }}
          >Spring Trap</button>
          <button
            onClick={requestDisarm}
            style={{
              background: T.btnBg, color: T.btnText, border: `1px solid ${T.btnBorder}`, borderRadius: 4,
              padding: "8px 14px", cursor: "pointer", fontSize: 13, textAlign: "left",
            }}
          >Disarm</button>
          <button
            onClick={onClose}
            style={{
              background: "transparent", color: T.sidebarTextFaint, border: "none",
              padding: "6px 0", cursor: "pointer", fontSize: 12, textAlign: "left",
            }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}
