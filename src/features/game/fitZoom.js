// Pure arithmetic — no DOM, no React.
// Computes the zoom level that covers the available container space (the
// board fully fills the container on both axes, overflowing on whichever
// axis isn't the binding constraint — scrollable, same as manual zoom),
// clamped to [zoomMin, zoomMax].
export function computeFitZoom({ availableWidth, availableHeight, boardWidth, boardHeight, zoomMin, zoomMax }) {
  if (!availableWidth || availableWidth <= 0 || !availableHeight || availableHeight <= 0) {
    return 1;
  }
  const rawFit = Math.max(availableWidth / boardWidth, availableHeight / boardHeight);
  return Math.max(zoomMin, Math.min(zoomMax, rawFit));
}
