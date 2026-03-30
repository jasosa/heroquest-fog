import { CELL } from "../../map.js";
import { PIECES, PIECE_CATEGORY_ID, resolveScale, isTrapPiece } from "../../pieces.js";
import { T } from "../../theme.js";

// Pure helper: returns true when a chest should show an amber-gold glow.
// Only glows in play mode, when the cell is in fog, and the chest has not been opened.
export function shouldShowChestGlow(type, isEditMode, isFogRevealed, isOpened) {
  return type === "chest" && !isEditMode && isFogRevealed && !isOpened;
}

// Pure helper: determines whether clicking a chest cell should intercept
// the normal fog reveal — only when the chest is visible and not yet opened.
function shouldInterceptChestClick(type, isFogRevealed, isOpened) {
  return type === "chest" && isFogRevealed && !isOpened;
}

// Pure helper: returns true when a Hero Start marker should be hidden (play mode only).
export function shouldHideHeroStart(type, isEditMode) {
  return type === "start" && !isEditMode;
}

// Pure helper: returns "warning", "real", or "hidden" for a given piece/state combo.
// "hidden"  — piece is not visible (not in fog)
// "warning" — trap in play mode, not yet revealed → show generic warning marker
// "real"    — show actual piece image/token
export function getTrapRenderMode(type, isEditMode, fog, revealedTraps, anchorKey, coveredCells, disarmedTraps, springedTraps, removeAfterSpring) {
  const isVisible = isEditMode || fog.has(anchorKey) ||
    (coveredCells && coveredCells.some(k => fog.has(k)));
  if (!isVisible) return "hidden";
  if (!isEditMode && isTrapPiece(type)) {
    if (disarmedTraps?.has(anchorKey)) return "hidden";
    if (springedTraps?.has(anchorKey) && removeAfterSpring) return "hidden";
  }
  if (isTrapPiece(type) && !isEditMode && !revealedTraps?.has(anchorKey)) return "warning";
  return "real";
}

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

// Tokens are rendered as overlays rather than inside grid cells so their
// position can be driven by calibrated pixel coordinates (useMapTransform).
export function TokenOverlay({
  anchorKey, type, coveredCells, rotation, fog, isEditMode, getTokenPos, tileSet, overlayMarker,
  // Note markers
  note, onEditNote,
  // Feature B
  isSpecial, specialNote, onAnnotateMonster,
  // Secret doors
  revealedSecretDoors,
  // Trap reveal
  revealedTraps, onTrapInteraction,
  // Trap config
  onConfigureTrap,
  // Trap disarm/spring tracking
  disarmedTraps, springedTraps, removeAfterSpring,
  // Chest
  hasTrap, openedChests, onOpenChest, onConfigureChest,
  // Shared tooltip callbacks (fixed-position, avoids overflow:hidden clipping)
  onShowTooltip, onHideTooltip,
}) {
  const p = PIECES[type];

  // Use getTrapRenderMode to determine visibility and warning state.
  const trapMode = getTrapRenderMode(type, isEditMode, fog, revealedTraps, anchorKey, coveredCells, disarmedTraps, springedTraps, removeAfterSpring);
  if (trapMode === "hidden") return null;

  // Secret doors are hidden in play mode until explicitly revealed via search.
  if (type === "secretdoor" && !isEditMode && !revealedSecretDoors?.has(anchorKey)) return null;

  // Hero Start markers are invisible in play mode (auto-reveal still runs via useGameState).
  if (shouldHideHeroStart(type, isEditMode)) return null;

  // ── Trap warning marker (play mode, not yet revealed) ─────────────────────
  if (trapMode === "warning") {
    const [r, c] = anchorKey.split(",").map(Number);
    const [px, py] = getTokenPos(c, r);
    return (
      <img
        src="/tiles/Trap_Warning.png"
        alt="Trap"
        onClick={e => { e.stopPropagation(); onTrapInteraction?.(anchorKey); }}
        onMouseEnter={e => onShowTooltip?.(e.clientX, e.clientY, "Trap!")}
        onMouseLeave={() => onHideTooltip?.()}
        style={{
          position: "absolute",
          left: px - CELL * 0.4,
          top: py - CELL * 0.4,
          width: CELL * 0.8,
          height: CELL * 0.8,
          zIndex: 10,
          pointerEvents: "auto",
          cursor: "pointer",
          filter: "drop-shadow(0 0 4px #c0392b) drop-shadow(0 0 8px #e74c3caa)",
        }}
      />
    );
  }

  const [r, c] = anchorKey.split(",").map(Number);
  const isMonster = PIECE_CATEGORY_ID[type] === "monsters";

  // ── Note marker ────────────────────────────────────────────────────────────
  if (type === "notemarker") {
    const [px, py] = getTokenPos(c, r);
    const hoverProps = (!isEditMode && note)
      ? {
          onMouseEnter: e => onShowTooltip?.(e.clientX, e.clientY, note),
          onMouseLeave: () => onHideTooltip?.(),
        }
      : {};
    return (
      <div style={{ position: "absolute", left: px, top: py, transform: "translate(-50%, -50%)", zIndex: 15, pointerEvents: "none" }}>
        <div style={{ position: "relative" }}>
          <img
            src="/tiles/note.png"
            alt="Event Note"
            {...hoverProps}
            onClick={e => {
              e.stopPropagation();
              if (isEditMode) onEditNote?.(anchorKey);
              else if (note) onShowTooltip?.(e.clientX, e.clientY, note);
            }}
            style={{
              width: 28, height: 28,
              display: "block",
              pointerEvents: "auto",
              cursor: "pointer",
              opacity: isEditMode ? 0.85 : 1,
            }}
          />
          {/* Edit pencil button in edit mode */}
          {isEditMode && (
            <button
              onMouseDown={e => { e.stopPropagation(); onEditNote?.(anchorKey); }}
              title="Edit note"
              style={{
                position: "absolute",
                top: -8, right: -8,
                width: 16, height: 16,
                padding: 0,
                background: note ? "#c4a870" : "#444",
                color: "#fff",
                border: "none", borderRadius: "50%",
                fontSize: 9, lineHeight: "16px", textAlign: "center",
                cursor: "pointer",
                pointerEvents: "auto",
              }}
            >✎</button>
          )}
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

    // Chest: compute glow and clickability state.
    const isChest = type === "chest";
    const isChestInFog = fog.has(anchorKey) || coveredCells?.some(k => fog.has(k));
    const isOpened = openedChests?.has(anchorKey);
    const showGlow = shouldShowChestGlow(type, isEditMode, isChestInFog, isOpened);
    const chestGlowFilter = "drop-shadow(0 0 4px #b8860b) drop-shadow(0 0 8px #ffd700aa)";
    const isChestClickable = shouldInterceptChestClick(type, isChestInFog, isOpened) && !isEditMode;

    // Trap image: clickable in play mode when revealed
    const isTrapImage = isTrapPiece(type) && !isEditMode;

    // Hover callbacks for special monster note in play mode.
    const monsterHoverProps = (!isEditMode && isMonster && isSpecial && specialNote)
      ? {
          onMouseEnter: e => onShowTooltip?.(e.clientX, e.clientY, specialNote),
          onMouseLeave: () => onHideTooltip?.(),
          style: { cursor: "pointer" },
        }
      : {};

    const isSpecialMonsterInPlay = !isEditMode && isMonster && isSpecial && specialNote;

    let imgOnClick;
    if (isChestClickable) {
      imgOnClick = e => { e.stopPropagation(); onOpenChest?.(anchorKey); };
    } else if (isTrapImage) {
      imgOnClick = e => { e.stopPropagation(); onTrapInteraction?.(anchorKey, true); };
    } else if (isSpecialMonsterInPlay) {
      imgOnClick = e => { e.stopPropagation(); onShowTooltip?.(e.clientX, e.clientY, specialNote); };
    }

    return (
      <>
        <img
          src={`/tiles/${tileSet}/${p.image}`}
          alt={p.label}
          {...(!isChestClickable && !isTrapImage ? monsterHoverProps : {})}
          onClick={imgOnClick}
          onMouseEnter={isChestClickable ? (e => onShowTooltip?.(e.clientX, e.clientY, "Chests can hide traps. Click to search.")) : (monsterHoverProps.onMouseEnter)}
          onMouseLeave={isChestClickable ? (() => onHideTooltip?.()) : (monsterHoverProps.onMouseLeave)}
          style={{
            position: "absolute",
            left: cx - w / 2,
            top: cy - h / 2,
            width: w,
            height: h,
            transform: `rotate(${(rotation ?? 0) * 90}deg)`,
            zIndex: isMonster ? 12 : 5,
            pointerEvents: (isChest && !isEditMode && !isOpened && isChestInFog) || (isMonster && !isEditMode) || isTrapImage ? "auto" : "none",
            objectFit: "fill",
            filter: showGlow ? chestGlowFilter : (specialFilter || undefined),
            cursor: isChestClickable ? "pointer" : (isTrapImage ? "pointer" : (monsterHoverProps.style?.cursor)),
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

        {/* Chest: ⚠ configure trap button in edit mode */}
        {isEditMode && isChest && (
          <div
            onMouseDown={e => { e.stopPropagation(); onConfigureChest?.(anchorKey); }}
            style={{
              position: "absolute",
              left: cx - CELL * 0.18,
              top: cy - CELL * 0.48,
              width: CELL * 0.4,
              height: CELL * 0.4,
              background: hasTrap ? T.accentGold : "#333a",
              color: "#fff",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: CELL * 0.28,
              cursor: "pointer",
              zIndex: 20,
            }}
            title="Configure chest trap"
          >⚠</div>
        )}

        {/* Trap image: configure button in edit mode */}
        {isEditMode && isTrapPiece(type) && (
          <button
            onMouseDown={e => { e.stopPropagation(); onConfigureTrap?.(anchorKey); }}
            style={{
              position: "absolute",
              left: cx - CELL * 0.18,
              top: cy - CELL * 0.48,
              width: CELL * 0.4,
              height: CELL * 0.4,
              background: "#333a",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: CELL * 0.28,
              cursor: "pointer",
              zIndex: 20,
              padding: 0,
            }}
            title="Configure trap note"
          >✎</button>
        )}

        {overlayMarker && !(overlayMarker === "start" && !isEditMode) && (
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
      {/* Trap config button in edit mode for plain trap token */}
      {isEditMode && isTrapPiece(type) && (
        <button
          onMouseDown={e => { e.stopPropagation(); onConfigureTrap?.(anchorKey); }}
          style={{
            position: "absolute",
            top: -8, right: -8,
            width: 16, height: 16,
            background: "#333a",
            color: "#fff",
            border: "none", borderRadius: "50%",
            fontSize: 9, lineHeight: "16px", textAlign: "center",
            cursor: "pointer",
            zIndex: 20,
            padding: 0,
            pointerEvents: "auto",
          }}
          title="Configure trap note"
        >✎</button>
      )}
    </div>
  );
}
