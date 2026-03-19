import { memo, useState } from "react";
import { T } from "../theme.js";

export const PieceButton = memo(function PieceButton({ piece, isSelected, onSelect }) {
  return (
    <button onClick={() => onSelect(piece.id)} style={{
      padding: "6px 8px",
      background: isSelected ? T.btnActiveBg : T.btnBg,
      color: isSelected ? T.btnActiveText : T.btnText,
      border: `1px solid ${isSelected ? T.btnActiveBdr : T.btnBorder}`,
      cursor: "pointer", fontFamily: "inherit", fontSize: 11,
      textAlign: "left", display: "flex", alignItems: "center", gap: 8,
      transition: "all 0.12s", width: "100%",
    }}>
      <div style={{
        width: 16, height: 16, background: piece.color, flexShrink: 0,
        borderRadius: piece.shape === "circle" ? "50%" : "2px",
        transform: piece.shape === "diamond" ? "rotate(45deg)" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 5, fontWeight: "bold", color: "#000",
      }} />
      <span style={{ flex: 1 }}>{piece.label}</span>
      {piece.blocks && (
        <span style={{ fontSize: 8, color: T.accent, border: `1px solid ${T.accent}`, padding: "1px 3px" }}>
          BLK
        </span>
      )}
    </button>
  );
});

/**
 * Shared edit-mode piece palette.
 * Props:
 *   pieceCategories  — array of { id, label, pieces[] }
 *   tool             — currently selected piece id
 *   onSelectTool     — (id) => void
 *   onSave           — optional () => void  (omit to hide Save button)
 *   savedFlash       — optional bool
 */
export function EditPanel({ pieceCategories, tool, onSelectTool, onSave, savedFlash, saveError }) {
  const [activeCatId, setActiveCatId] = useState(pieceCategories[0]?.id ?? null);
  const activeCategory = pieceCategories.find(c => c.id === activeCatId);

  return (
    <>
      {/* Category tabs */}
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4 }}>
        {pieceCategories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCatId(cat.id)} style={{
            padding: "4px 7px", fontSize: 9, letterSpacing: 1,
            textTransform: "uppercase", fontFamily: "inherit", cursor: "pointer",
            background: activeCatId === cat.id ? T.btnActiveBg : T.btnBg,
            color: activeCatId === cat.id ? T.btnActiveText : T.btnText,
            border: `1px solid ${activeCatId === cat.id ? T.btnActiveBdr : T.btnBorder}`,
            transition: "all 0.12s",
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Pieces in active category */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
        {(activeCategory?.pieces ?? []).map(piece => (
          <PieceButton
            key={piece.id}
            piece={piece}
            isSelected={tool === piece.id}
            onSelect={onSelectTool}
          />
        ))}
      </div>

      <div style={{
        marginTop: 8, padding: "10px 12px",
        background: T.panelBg, border: `1px solid ${T.panelBorder}`,
        fontSize: 10, color: T.textMuted, lineHeight: 1.8,
      }}>
        <span style={{ color: T.accent }}>BLK</span> pieces stop corridor visibility.
        <br /><br />
        Click to place · Right-click to rotate
      </div>

      {onSave && (
        <div style={{ marginTop: 8 }}>
          <button onClick={onSave} style={{
            width: "100%", padding: "10px 0",
            background: "#2a4a1a", color: "#d8f0c8",
            border: `1px solid ${T.accentGold}`,
            cursor: "pointer", fontFamily: "inherit", fontSize: 11,
            letterSpacing: 1, transition: "all 0.15s",
          }}>
            {savedFlash ? "✓ Saved!" : "💾 Save Quest"}
          </button>
          {saveError && (
            <div style={{
              marginTop: 6, padding: "6px 8px",
              background: "#2a0a0a", color: "#f0c0b0",
              border: `1px solid ${T.accent}`,
              fontSize: 10, lineHeight: 1.5,
            }}>
              {saveError}
            </div>
          )}
        </div>
      )}
    </>
  );
}
