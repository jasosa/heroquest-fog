import { memo, useState } from "react";
import { T } from "../../shared/theme.js";
import { resolveTilePath } from "./editPanelUtils.js";

export const PieceButton = memo(function PieceButton({ piece, isSelected, onSelect, tileSet }) {
  const imgSrc = resolveTilePath(piece, tileSet);
  return (
    <button
      onClick={() => onSelect(piece.id)}
      className={`btn btn-hq-dark w-100 text-start d-flex align-items-center gap-2${isSelected ? " active" : ""}`}
      style={{ padding: "6px 8px", fontSize: 11, transition: "all 0.12s" }}
    >
      {imgSrc
        ? <img src={imgSrc} alt={piece.label} style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
        : <div style={{
            width: 28, height: 28, background: piece.color, flexShrink: 0,
            borderRadius: piece.shape === "circle" ? "50%" : "2px",
            transform: piece.shape === "diamond" ? "rotate(45deg)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 5, fontWeight: "bold", color: "#000",
          }} />
      }
      <span className="flex-grow-1">{piece.label}</span>
      {piece.blocks && (
        <span style={{ fontSize: 8, color: T.accent, border: `1px solid ${T.accent}`, padding: "1px 3px", flexShrink: 0 }}>
          BLK
        </span>
      )}
    </button>
  );
});

export function EditPanel({ pieceCategories, tool, onSelectTool, onSave, savedFlash, saveError, tileSet }) {
  const [activeCatId, setActiveCatId] = useState(pieceCategories[0]?.id ?? null);
  const activeCategory = pieceCategories.find(c => c.id === activeCatId);

  return (
    <>
      {/* Category tabs */}
      <div className="d-flex flex-wrap gap-1 mt-1">
        {pieceCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCatId(cat.id)}
            className={`btn btn-hq-dark btn-sm${activeCatId === cat.id ? " active" : ""}`}
            style={{ padding: "4px 7px", fontSize: 9, letterSpacing: 1 }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Pieces in active category */}
      <div className="d-flex flex-column gap-1 mt-1">
        {(activeCategory?.pieces ?? []).map(piece => (
          <PieceButton
            key={piece.id}
            piece={piece}
            isSelected={tool === piece.id}
            onSelect={onSelectTool}
            tileSet={tileSet}
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
        <div className="mt-2">
          <button
            onClick={onSave}
            className="btn w-100"
            style={{
              padding: "10px 0",
              background: "#2a4a1a", color: "#d8f0c8",
              border: `1px solid ${T.accentGold}`,
              fontSize: 11, letterSpacing: 1,
              fontFamily: "inherit", transition: "all 0.15s",
            }}
          >
            {savedFlash ? "✓ Saved!" : "💾 Save Quest"}
          </button>
          {saveError && (
            <div className="alert alert-danger py-1 px-2 mt-1 mb-0" style={{ fontSize: 10, lineHeight: 1.5 }}>
              {saveError}
            </div>
          )}
        </div>
      )}
    </>
  );
}
