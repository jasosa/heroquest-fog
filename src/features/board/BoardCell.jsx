import { memo } from "react";
import { CELL } from "../../map.js";
import { PIECES } from "../../pieces.js";
import { T } from "../../theme.js";

// rerender-memo: cells only re-render when their own props change.
// coverage — the placed entry whose footprint includes this cell (or undefined)
// isAnchor — true only for the anchor cell of a multi-cell piece (token goes here)
const BoardCell = memo(function BoardCell({ r, c, region, isRevealed, isEditMode, isLastClick, coverage, onClick, onRightClick }) {
  const isWall      = region === null;
  // Fog is now rendered by the SVG layer in BoardGrid; cells are always transparent.
  const borderColor = "transparent";
  const pieceColor  = coverage ? PIECES[coverage.type]?.color : null;

  return (
    <div
      onClick={onClick}
      style={{
        width: CELL, height: CELL,
        background: "transparent",
        border: `1px solid ${borderColor}`,
        cursor: isWall ? "default" : "pointer",
        boxSizing: "border-box",
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "filter 0.1s",
        userSelect: "none",
        outline: isLastClick && isEditMode ? "2px solid #c0302066" : "none",
        outlineOffset: "-2px",
      }}
      onContextMenu={e => { e.preventDefault(); if (!isWall && onRightClick) onRightClick(); }}
      onMouseEnter={e => { if (!isWall) e.currentTarget.style.filter = "brightness(1.4)"; }}
      onMouseLeave={e =>  { e.currentTarget.style.filter = "none"; }}
    >
      {/* Piece footprint — coloured tint across all covered cells (multi-cell pieces only, not image pieces) */}
      {coverage && (isRevealed || isEditMode) && coverage.coveredCells?.length > 1 && !PIECES[coverage.type]?.image && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
          background: pieceColor + "55",
          outline: `1px solid ${pieceColor}88`,
          outlineOffset: "-1px",
        }} />
      )}

      {/* Edit-mode coordinate hint on empty cells */}
      {isEditMode && !coverage && !isWall && (
        <span style={{ fontSize: 7, color: T.textMuted, zIndex: 2, opacity: 0.5 }}>{r},{c}</span>
      )}
    </div>
  );
});

export default BoardCell;
