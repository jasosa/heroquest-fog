import { useState, useRef } from "react";
import { T } from "../../theme.js";

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
  maxHeight: "90vh",
  overflowY: "auto",
  display: "flex", flexDirection: "column", gap: 14,
};

function SubLabel({ text }) {
  return <div style={{ fontSize: 11, color: T.textFaint, marginTop: 2 }}>{text}</div>;
}

export function TrapInteractionPopup({
  anchorKey, pieceType, pieceLabel, pieceImage, springMessage, removeAfterSpring,
  alreadySprung, onSpringTrap, onDisarmTrap, onClose,
}) {
  const initialPhase = alreadySprung ? "already_sprung" : "options";
  const [phase, setPhase] = useState(initialPhase);
  const prevPhaseRef = useRef(initialPhase);

  // ── already_sprung ────────────────────────────────────────────────────────
  if (phase === "already_sprung") {
    return (
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
            Trap — Already Sprung
          </div>
          {pieceLabel && (
            <div style={{ fontSize: 13, color: T.text, fontWeight: "bold" }}>{pieceLabel}</div>
          )}
          {springMessage && (
            <div style={{ fontSize: 13, color: T.text }}>{springMessage}</div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                background: T.btnActiveBg, color: T.btnActiveText,
                border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
                padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
              }}
            >Close</button>
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
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>Trap Sprung!</div>
          {springMessage && (
            <div style={{ fontSize: 13, color: T.text }}>{springMessage}</div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                background: T.btnActiveBg, color: T.btnActiveText,
                border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
                padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
              }}
            >Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── disarm_confirm ────────────────────────────────────────────────────────
  if (phase === "disarm_confirm") {
    return (
      <div style={overlayStyle} onMouseDown={() => setPhase(prevPhaseRef.current)}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>Disarm Trap?</div>
          <div style={{ fontSize: 13, color: T.text }}>
            The trap will be marked as disarmed for this session.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => setPhase(prevPhaseRef.current)}
              style={{
                background: T.btnBg, color: T.btnText,
                border: `1px solid ${T.btnBorder}`, borderRadius: 4,
                padding: "6px 14px", cursor: "pointer", fontSize: 13,
              }}
            >Cancel</button>
            <button
              onClick={() => {
                onDisarmTrap?.(anchorKey);
                onClose?.();
              }}
              style={{
                background: T.btnActiveBg, color: T.btnActiveText,
                border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4,
                padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
              }}
            >Confirm</button>
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
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>{pieceLabel}</div>
          {pieceImage && (
            <img
              src={`/tiles/board2/${pieceImage}`}
              alt={pieceLabel}
              style={{ width: 80, height: 80, objectFit: "contain", alignSelf: "center" }}
            />
          )}
          {springMessage && (
            <div style={{ fontSize: 13, color: T.text }}>{springMessage}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => {
                onSpringTrap?.(anchorKey, removeAfterSpring ?? true);
                setPhase("spring_result");
              }}
              style={{ background: "#c62828", color: "#fff", border: "none", borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold", textAlign: "left" }}
            >
              Spring
              <SubLabel text="Trigger the trap — effect applies immediately" />
            </button>
            <button
              onClick={() => {
                prevPhaseRef.current = "post_reveal";
                setPhase("disarm_confirm");
              }}
              style={{ background: T.btnBg, color: T.btnText, border: `1px solid ${T.btnBorder}`, borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontSize: 13, textAlign: "left" }}
            >
              Disarm
              <SubLabel text="Remove trap for this session" />
            </button>
            <button
              onClick={onClose}
              style={{ background: "transparent", color: T.textFaint, border: "none", padding: "4px 0", cursor: "pointer", fontSize: 12, textAlign: "left" }}
            >
              Dismiss
              <SubLabel text="Close without doing anything" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── options ────────────────────────────────────────────────────────────────
  return (
    <div style={overlayStyle} onMouseDown={onClose}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>Trap Spotted!</div>
        <div style={{ fontSize: 13, color: T.text }}>
          A hero may attempt to jump over the trap — a black shield on a combat die springs the trap.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => {
              onSpringTrap?.(anchorKey, removeAfterSpring ?? true);
              setPhase("spring_result");
            }}
            style={{ background: "#c62828", color: "#fff", border: "none", borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold", textAlign: "left" }}
          >
            Spring
            <SubLabel text="Trigger the trap — effect applies immediately" />
          </button>
          <button
            onClick={() => {
              prevPhaseRef.current = "options";
              setPhase("post_reveal");
            }}
            style={{ background: T.btnActiveBg, color: T.btnActiveText, border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold", textAlign: "left" }}
          >
            Reveal
            <SubLabel text="See trap type and effect — no action taken" />
          </button>
          <button
            onClick={() => {
              prevPhaseRef.current = "options";
              setPhase("disarm_confirm");
            }}
            style={{ background: T.btnBg, color: T.btnText, border: `1px solid ${T.btnBorder}`, borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontSize: 13, textAlign: "left" }}
          >
            Disarm
            <SubLabel text="Remove trap for this session" />
          </button>
          <button
            onClick={onClose}
            style={{ background: "transparent", color: T.textFaint, border: "none", padding: "4px 0", cursor: "pointer", fontSize: 12, textAlign: "left" }}
          >
            Dismiss
            <SubLabel text="Close without doing anything" />
          </button>
        </div>
      </div>
    </div>
  );
}
