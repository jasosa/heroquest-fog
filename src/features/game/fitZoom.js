// Pure arithmetic — no DOM, no React.
// Computes the zoom level that fits the board into the available container
// space, clamped to [zoomMin, zoomMax].
export function computeFitZoom({ availableWidth, availableHeight, boardWidth, boardHeight, zoomMin, zoomMax }) {
  if (!availableWidth || availableWidth <= 0 || !availableHeight || availableHeight <= 0) {
    return 1;
  }
  const rawFit = Math.min(availableWidth / boardWidth, availableHeight / boardHeight);
  return Math.max(zoomMin, Math.min(zoomMax, rawFit));
}
