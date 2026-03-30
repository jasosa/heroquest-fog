import { useState, useRef } from "react";
import { T } from "../../theme.js";

const TRAP_RULES = {
  trap: "A hidden trap. The trap activates — the DM will tell you the effect.",
  pit: "Pit Trap — Fall in and lose 1 Body Point. An adjacent hero may attempt to help you climb out.",
  spear: "Spear Trap — A spear shoots from the wall. Lose 2 Body Points.",
  falling: "Falling Block Trap — A stone block falls. Lose 3 Body Points.",
};

const overlayStyle = {
  position: "absolute", inset: 0,
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

export function TrapInteractionPopup({
  anchorKey, isRevealed, pieceType, pieceLabel, pieceImage, trapNote,
  onRevealTrap, onDisarmTrap, onClose,
}) {
  const [phase, setPhase] = useState(isRevealed ? "revealed" : "options");
  const prevPhaseRef = useRef(isRevealed ? "revealed" : "options");

  // ── options phase ────────────────────────────────────────────────────────
  if (phase === "options") {
    return (
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
            Trap Spotted!
          </div>
          <div style={{ fontSize: 13, color: T.text }}>
            A hero may attempt to jump over the trap (requires 1 black shield on a combat die).
            An adjacent hero may attempt to disarm it.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => {
                onRevealTrap?.(anchorKey);
                setPhase("revealed");
              }}
              style={{
                background: "#b8860b", color: "#fff",
                border: "1px solid #8b6508", borderRadius: 4,
                padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
              }}
            >Reveal Trap</button>
            <button
              onClick={() => {
                prevPhaseRef.current = "options";
                setPhase("confirming_disarm");
              }}
              style={{
                background: T.btnBg, color: T.btnText,
                border: `1px solid ${T.btnBorder}`, borderRadius: 4,
                padding: "6px 14px", cursor: "pointer", fontSize: 13,
              }}
            >Disarm Trap</button>
            <button
              onClick={onClose}
              style={{
                background: "none", color: T.textMuted,
                border: "none",
                padding: "4px 0", cursor: "pointer", fontSize: 12,
              }}
            >Dismiss</button>
          </div>
        </div>
      </div>
    );
  }

  // ── revealed phase ───────────────────────────────────────────────────────
  if (phase === "revealed") {
    const ruleText = trapNote || TRAP_RULES[pieceType] || "";
    return (
      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
            {pieceLabel}
          </div>
          {pieceImage && (
            <img
              src={`/tiles/board2/${pieceImage}`}
              alt={pieceLabel}
              style={{ width: 80, height: 80, objectFit: "contain", alignSelf: "center" }}
            />
          )}
          {ruleText && (
            <div style={{ fontSize: 13, color: T.text }}>{ruleText}</div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                prevPhaseRef.current = "revealed";
                setPhase("confirming_disarm");
              }}
              style={{
                background: T.btnBg, color: T.btnText,
                border: `1px solid ${T.btnBorder}`, borderRadius: 4,
                padding: "6px 14px", cursor: "pointer", fontSize: 13,
              }}
            >Disarm</button>
            <button
              onClick={onClose}
              style={{
                background: "#b8860b", color: "#fff",
                border: "1px solid #8b6508", borderRadius: 4,
                padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
              }}
            >Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── confirming_disarm phase ──────────────────────────────────────────────
  if (phase === "confirming_disarm") {
    return (
      <div style={overlayStyle} onMouseDown={() => setPhase(prevPhaseRef.current)}>
        <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
          <div style={{ fontWeight: "bold", fontSize: 15, color: T.title }}>
            Disarm Trap?
          </div>
          <div style={{ fontSize: 13, color: T.text }}>
            This will permanently remove the trap from the board.
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
                setPhase("disarmed");
              }}
              style={{
                background: "#b8860b", color: "#fff",
                border: "1px solid #8b6508", borderRadius: 4,
                padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
              }}
            >Confirm</button>
          </div>
        </div>
      </div>
    );
  }

  // ── disarmed phase ───────────────────────────────────────────────────────
  return (
    <div style={overlayStyle} onMouseDown={onClose}>
      <div style={dialogStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ fontSize: 13, color: T.text }}>Trap removed.</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "#b8860b", color: "#fff",
              border: "1px solid #8b6508", borderRadius: 4,
              padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold",
            }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}
