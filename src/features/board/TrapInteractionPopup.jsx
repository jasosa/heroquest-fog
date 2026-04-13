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

const btnClose = {
  background: T.btnActiveBg, color: T.btnActiveText,
  border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
  padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
};

export function TrapInteractionPopup({
  anchorKey, pieceLabel, pieceImage, springMessage, removeAfterSpring,
  alreadySprung, onSpringTrap, onDisarmTrap, onClose,
}) {
  const initialPhase = alreadySprung ? "already_sprung" : "options";
  const [phase, setPhase] = useState(initialPhase);
  const [prevPhase, setPrevPhase] = useState(initialPhase);

  function doSpring() {
    onSpringTrap?.(anchorKey, removeAfterSpring ?? true);
    setPhase("spring_result");
  }

  function requestDisarm() {
    setPrevPhase(phase);
    setPhase("disarm_confirm");
  }

  function confirmDisarm() {
    onDisarmTrap?.(anchorKey);
    setPhase("disarm_result");
  }

  function cancelDisarm() {
    setPhase(prevPhase);
  }

  const trapImg = pieceImage && (
    <img
      src={`/tiles/board2/${pieceImage}`}
      alt={pieceLabel}
      style={{ width: 80, height: 80, objectFit: "contain", alignSelf: "center" }}
    />
  );

  // ── already_sprung ────────────────────────────────────────────────────────
  if (phase === "already_sprung") {
    return (
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>
            Trap — Already Sprung
          </div>
          {pieceLabel && (
            <div style={{ fontSize: 13, color: T.sidebarText, fontWeight: "bold" }}>{pieceLabel}</div>
          )}
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

  // ── spring_result ─────────────────────────────────────────────────────────
  if (phase === "spring_result") {
    return (
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Trap Sprung!</div>
          {pieceLabel && (
            <div style={{ fontSize: 13, color: T.sidebarText, fontWeight: "bold" }}>{pieceLabel}</div>
          )}
          {trapImg}
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
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Disarm Trap?</div>
          {pieceLabel && (
            <div style={{ fontSize: 13, color: T.sidebarText, fontWeight: "bold" }}>{pieceLabel}</div>
          )}
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
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>Trap Disarmed</div>
          {pieceLabel && (
            <div style={{ fontSize: 13, color: T.sidebarText, fontWeight: "bold" }}>{pieceLabel}</div>
          )}
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

  // ── shared action buttons (used in options and post_reveal) ───────────────
  const actionButtons = (
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
  );

  // ── post_reveal ───────────────────────────────────────────────────────────
  if (phase === "post_reveal") {
    return (
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.sidebarTitle, fontFamily: FONT_HEADING }}>{pieceLabel}</div>
          {trapImg}
          {springMessage && (
            <div style={{ fontSize: 13, color: T.sidebarText }}>{springMessage}</div>
          )}
          {actionButtons}
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
            onClick={() => setPhase("post_reveal")}
            style={{
              background: T.btnActiveBg, color: T.btnActiveText,
              border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
              padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold", textAlign: "left",
            }}
          >Reveal</button>
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
