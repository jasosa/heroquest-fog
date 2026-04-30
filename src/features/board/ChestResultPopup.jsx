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

const btnPrimary = {
  background: T.btnActiveBg, color: T.btnActiveText,
  border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
  padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
};

const CHEST_RULES_MESSAGE =
  "A chest can contain a trap. If a hero searches for treasure in a room with a chest and the chest is trapped, the hero will be impacted by the trap. To avoid that, a hero adjacent to the chest can try to disarm the trap following regular HQ rules. If you fail, click Reveal to see the trap effect, otherwise click Remove.";

export function ChestResultPopup({ hasTrap, springMessage, anchorKey, onDisarmTrap, onResolve, onClose }) {
  const [phase, setPhase] = useState("options");
  const [prevPhase, setPrevPhase] = useState("options");

  function doReveal() {
    onResolve?.(anchorKey);
    setPhase(hasTrap ? "reveal_result" : "no_trap_result");
  }

  function requestRemove() {
    if (hasTrap) {
      setPrevPhase(phase);
      setPhase("remove_confirm");
    } else {
      onResolve?.(anchorKey);
      setPhase("no_trap_result");
    }
  }

  function confirmRemove() {
    onResolve?.(anchorKey);
    onDisarmTrap?.(anchorKey);
    setPhase("remove_result");
  }

  function cancelRemove() {
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
            <button onClick={onClose} style={btnPrimary}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── reveal_result ─────────────────────────────────────────────────────────
  if (phase === "reveal_result") {
    return (
      <div data-testid="chest-popup-backdrop" style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Trap Sprung!</div>
          {springMessage && (
            <div style={{ fontSize: 13, color: T.sidebarText }}>{springMessage}</div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnPrimary}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── remove_confirm ────────────────────────────────────────────────────────
  if (phase === "remove_confirm") {
    return (
      <div data-testid="chest-popup-backdrop" style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Remove Trap?</div>
          <div style={{ fontSize: 13, color: T.sidebarText, lineHeight: 1.5 }}>
            Are you sure you want to remove this trap? It will be removed for this session.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={cancelRemove}
              style={{
                background: T.btnBg, color: T.btnText, border: `1px solid ${T.btnBorder}`,
                borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontSize: 13,
              }}
            >Cancel</button>
            <button onClick={confirmRemove} style={btnPrimary}>Confirm Remove</button>
          </div>
        </div>
      </div>
    );
  }

  // ── remove_result ─────────────────────────────────────────────────────────
  if (phase === "remove_result") {
    return (
      <div data-testid="chest-popup-backdrop" style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Trap Removed</div>
          <div style={{ fontSize: 13, color: T.sidebarText }}>
            The trap has been removed for this session.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnPrimary}>Close</button>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={doReveal}
            style={{
              background: "#c62828", color: "#fff", border: "none", borderRadius: 4,
              padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold", textAlign: "left",
            }}
          >Reveal</button>
          <button
            onClick={requestRemove}
            style={{
              background: T.btnBg, color: T.btnText, border: `1px solid ${T.btnBorder}`, borderRadius: 4,
              padding: "8px 14px", cursor: "pointer", fontSize: 13, textAlign: "left",
            }}
          >Remove</button>
          <button
            onClick={onClose}
            style={{
              background: "transparent", color: T.sidebarTextFaint, border: "none",
              padding: "6px 0", cursor: "pointer", fontSize: 12, textAlign: "left",
            }}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
