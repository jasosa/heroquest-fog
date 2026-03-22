import { CELL } from "../../map.js";
import { PIECES, PIECE_CATEGORY_ID, resolveScale } from "../../pieces.js";

function Token({ type }) {
  const p = PIECES[type];
  if (!p) return null;
  const size = 26;
  const radius = p.shape === "circle" ? "50%" : "3px";
  return (
    <div style={{
      width: size, height: size,
      background: p.color,
      borderRadius: radius,
      transform: p.shape === "diamond" ? "rotate(45deg)" : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 8, fontWeight: "bold", color: "#111",
      boxShadow: `0 0 8px ${p.color}99, 0 1px 3px #0008`,
      flexShrink: 0, zIndex: 3,
    }}>
      <span style={{ transform: p.shape === "diamond" ? "rotate(-45deg)" : "none" }}>
        {p.icon}
      </span>
    </div>
  );
}

// ─── Letter Marker ────────────────────────────────────────────────────────────

function LetterToken({ letter }) {
  return (
    <div style={{
      width: 28, height: 28,
      background: "#ffe082",
      border: "2px solid #f9a825",
      borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: "bold", color: "#333",
      boxShadow: "0 1px 4px #0006",
      userSelect: "none",
    }}>
      {letter}
    </div>
  );
}

// Tokens are rendered as overlays rather than inside grid cells so their
// position can be driven by calibrated pixel coordinates (useMapTransform).
export function TokenOverlay({
  anchorKey, type, coveredCells, rotation, fog, isEditMode, getTokenPos, tileSet, overlayMarker,
  // Feature A
  isLetterMarker, letter, note, onEditLetter,
  // Feature B
  isSpecial, specialNote, onAnnotateMonster,
  // Shared tooltip callbacks (fixed-position, avoids overflow:hidden clipping)
  onShowTooltip, onHideTooltip,
}) {
  const p = PIECES[type];
  const isVisible = isEditMode || fog.has(anchorKey) ||
    (coveredCells && coveredCells.some(k => fog.has(k)));
  if (!isVisible) return null;

  const [r, c] = anchorKey.split(",").map(Number);
  const isMonster = PIECE_CATEGORY_ID[type] === "monsters";

  // ── Letter marker ──────────────────────────────────────────────────────────
  if (isLetterMarker) {
    const [px, py] = getTokenPos(c, r);
    // Same pattern as special monsters: build hover props only when there is content to show.
    const letterHoverProps = (!isEditMode && note)
      ? {
          onMouseEnter: e => onShowTooltip?.(e.clientX, e.clientY, note),
          onMouseLeave: () => onHideTooltip?.(),
        }
      : {};
    return (
      <div style={{ position: "absolute", left: px, top: py, transform: "translate(-50%, -50%)", zIndex: 15, pointerEvents: "none" }}>
        <div
          {...letterHoverProps}
          onClick={e => {
            e.stopPropagation();
            if (isEditMode) onEditLetter?.(anchorKey);
            else if (note) onShowTooltip?.(e.clientX, e.clientY, note);
          }}
          style={{
            width: 28, height: 28,
            background: "#ffe082",
            border: "2px solid #f9a825",
            borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: "bold", color: "#333",
            boxShadow: "0 1px 4px #0006",
            userSelect: "none",
            pointerEvents: "auto",
            cursor: isEditMode ? "pointer" : (note ? "pointer" : "default"),
          }}
        >
          {letter}
        </div>
      </div>
    );
  }

  // ── Image piece (multi-cell or 1×1 with image) ────────────────────────────
  if (p?.image && coveredCells?.length) {
    const cells = coveredCells.map(k => k.split(",").map(Number));
    const minR = Math.min(...cells.map(([cr]) => cr));
    const maxR = Math.max(...cells.map(([cr]) => cr));
    const minC = Math.min(...cells.map(([, cc]) => cc));
    const maxC = Math.max(...cells.map(([, cc]) => cc));
    const [left, top] = getTokenPos(minC - 0.5, minR - 0.5);
    const [right, bottom] = getTokenPos(maxC + 0.5, maxR + 0.5);
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;

    // Natural (rotation=0) dimensions from piece definition
    const natCells = p.cells ?? [[0, 0]];
    const natRows = Math.max(...natCells.map(([dr]) => dr)) - Math.min(...natCells.map(([dr]) => dr)) + 1;
    const natCols = Math.max(...natCells.map(([, dc]) => dc)) - Math.min(...natCells.map(([, dc]) => dc)) + 1;
    const isOdd = (rotation ?? 0) % 2 === 1;
    const bbW = right - left;
    const scale = resolveScale(p.imageScale, tileSet);
    const cellPx = isOdd ? bbW / natRows : bbW / natCols;
    const w = natCols * cellPx * scale;
    const h = natRows * cellPx * scale;

    const [anchorPx, anchorPy] = getTokenPos(c, r);

    // Feature B: special glow via CSS filter drop-shadow on the image element.
    const specialFilter = isSpecial
      ? "drop-shadow(0 0 4px #9c27b0) drop-shadow(0 0 8px #ce93d8)"
      : undefined;

    // Hover callbacks for special monster note in play mode.
    const monsterHoverProps = (!isEditMode && isMonster && isSpecial && specialNote)
      ? {
          onMouseEnter: e => onShowTooltip?.(e.clientX, e.clientY, specialNote),
          onMouseLeave: () => onHideTooltip?.(),
          style: { cursor: "pointer" },
        }
      : {};

    return (
      <>
        <img
          src={`/tiles/${tileSet}/${p.image}`}
          alt={p.label}
          {...monsterHoverProps}
          style={{
            position: "absolute",
            left: cx - w / 2,
            top: cy - h / 2,
            width: w,
            height: h,
            transform: `rotate(${(rotation ?? 0) * 90}deg)`,
            zIndex: isMonster ? 12 : 5,
            pointerEvents: isMonster && !isEditMode ? "auto" : "none",
            objectFit: "fill",
            filter: specialFilter,
            ...(monsterHoverProps.style ?? {}),
          }}
        />

        {/* Feature B: ★ annotate button in edit mode (monsters only) */}
        {isEditMode && isMonster && (
          <button
            onMouseDown={e => { e.stopPropagation(); onAnnotateMonster?.(anchorKey); }}
            style={{
              position: "absolute",
              left: anchorPx + CELL * 0.18,
              top: anchorPy - CELL * 0.48,
              width: 16, height: 16,
              background: isSpecial ? "#9c27b0" : "#333a",
              color: "#fff",
              border: "none", borderRadius: "50%",
              fontSize: 9, lineHeight: "16px", textAlign: "center",
              cursor: "pointer",
              zIndex: 20,
              padding: 0,
            }}
            title="Mark as special monster"
          >★</button>
        )}

        {overlayMarker && (
          <div style={{
            position: "absolute",
            left: anchorPx, top: anchorPy,
            transform: "translate(-50%, -50%)",
            zIndex: 8, pointerEvents: "none",
          }}>
            <Token type={overlayMarker} />
          </div>
        )}
      </>
    );
  }

  // ── Fallback: plain token (no image) ──────────────────────────────────────
  const isHeroStart = type === "start";
  const [px, py] = getTokenPos(c, r);
  return (
    <div style={{
      position: "absolute",
      left: px, top: py,
      transform: "translate(-50%, -50%)",
      zIndex: isHeroStart ? 8 : isMonster ? 12 : 5, pointerEvents: "none",
    }}>
      <Token type={type} />
    </div>
  );
}
