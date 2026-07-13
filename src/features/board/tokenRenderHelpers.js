import { isTrapPiece } from "../../shared/pieces.js";

// Pure helpers deciding how a placed token renders in play/edit mode.
// Extracted from TokenOverlay.jsx so the component file only exports a
// component (keeps React Fast Refresh happy) and the logic stays unit-tested.

// Returns true when a chest should show an amber-gold glow.
// Only glows in play mode, when the cell is in fog, and the chest has not been opened.
export function shouldShowChestGlow(type, isEditMode, isFogRevealed, isOpened) {
  return type === "chest" && !isEditMode && isFogRevealed && !isOpened;
}

// Determines whether clicking a chest cell should intercept the normal fog
// reveal — only when the chest is visible and not yet opened.
export function shouldInterceptChestClick(type, isFogRevealed, isOpened) {
  return type === "chest" && isFogRevealed && !isOpened;
}

// Returns true when a Hero Start marker should be hidden (play mode only).
export function shouldHideHeroStart(type, isEditMode) {
  return type === "start" && !isEditMode;
}

// Returns "warning", "real", or "hidden" for a given piece/state combo.
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
