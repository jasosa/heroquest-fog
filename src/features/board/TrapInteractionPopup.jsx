import { useState } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

const overlayStyle = {
  position: "absolute", inset: 0,
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

export function TrapInteractionPopup({
  anchorKey, pieceLabel, pieceImage, trapNote,
  isRevealed, onRevealTrap, onDisarmTrap, onClose,
}) {
  const [phase, setPhase] = useState(isRevealed ? "post_reveal" : "options");
  const [prevPhase, setPrevPhase] = useState(isRevealed ? "post_reveal" : "options");

  function doReveal() {
    onRevealTrap?.(anchorKey);
    setPhase("post_reveal");
  }

  function requestRemove() {
    setPrevPhase(phase);
    setPhase("remove_confirm");
  }

  function confirmRemove() {
    onDisarmTrap?.(anchorKey);
    setPhase("remove_result");
  }

  function cancelRemove() {
    setPhase(prevPhase);
  }

  const trapImg = pieceImage && (
    <img
      src={`/tiles/board2/${pieceImage}`}
      alt={pieceLabel}
      style={{ width: 80, height: 80, objectFit: "contain", alignSelf: "center" }}
    />
  );

  // ── remove_confirm ────────────────────────────────────────────────────────
  if (phase === "remove_confirm") {
    return (
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Remove Trap?</div>
          {pieceLabel && (
            <div style={{ fontSize: 13, color: T.sidebarText, fontWeight: "bold" }}>{pieceLabel}</div>
          )}
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
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Trap Removed</div>
          {pieceLabel && (
            <div style={{ fontSize: 13, color: T.sidebarText, fontWeight: "bold" }}>{pieceLabel}</div>
          )}
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

  // ── post_reveal ───────────────────────────────────────────────────────────
  if (phase === "post_reveal") {
    return (
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>{pieceLabel}</div>
          {trapImg}
          {trapNote && (
            <div style={{ fontSize: 13, color: T.sidebarText }}>{trapNote}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={requestRemove}
              style={{
                background: T.btnBg, color: T.btnText, border: `1px solid ${T.btnBorder}`, borderRadius: 4,
                padding: "8px 14px", cursor: "pointer", fontSize: 13, textAlign: "left",
              }}
            >Remove trap</button>
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

  // ── options ───────────────────────────────────────────────────────────────
  return (
    <div style={overlayStyle} onMouseDown={onClose}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Trap Spotted!</div>
        <div style={{ fontSize: 13, color: T.sidebarText, lineHeight: 1.5 }}>
          A hero can jump a trap. To jump a trap roll a Combat die when passing over it.
          If you roll a black shield the trap is sprung (Click Spring Trap button) otherwise
          you continue your movement.
        </div>
        <div style={{ fontSize: 13, color: T.sidebarText, lineHeight: 1.5 }}>
          An adjacent hero can disarm a trap. To disarm a trap follow regular HQ rules.
          If you fail, the trap is sprung (Click Spring Trap button) otherwise click the Disarm button.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={doReveal}
            style={{
              background: T.btnActiveBg, color: T.btnActiveText,
              border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
              padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold", textAlign: "left",
            }}
          >Reveal trap</button>
          <button
            onClick={requestRemove}
            style={{
              background: T.btnBg, color: T.btnText, border: `1px solid ${T.btnBorder}`, borderRadius: 4,
              padding: "8px 14px", cursor: "pointer", fontSize: 13, textAlign: "left",
            }}
          >Remove trap</button>
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
