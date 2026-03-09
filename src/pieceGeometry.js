// ═══════════════════════════════════════════════
//  PIECE GEOMETRY UTILITIES
// ═══════════════════════════════════════════════

// Rotate offsets 90° clockwise around the anchor [0,0].
// No normalisation — negative offsets are intentional (piece extends behind anchor).
export function rotateCells90(cells) {
  // `|| 0` converts -0 to 0 to avoid JavaScript's -0 !== 0 quirk.
  return cells.map(([r, c]) => [c || 0, -r || 0]);
}

// Apply n × 90° clockwise rotations.
export function rotateCells(cells, n) {
  let result = cells;
  for (let i = 0; i < (n % 4); i++) result = rotateCells90(result);
  return result;
}

// Number of visually distinct orientations (1 or 4).
// Without normalisation every rotation of a multi-cell piece covers a different
// set of cells relative to the anchor, so multi-cell pieces always return 4.
export function getDistinctRotations(cells) {
  if (!cells || cells.length <= 1) return 1;
  const key = cs => cs.map(([r, c]) => `${r},${c}`).sort().join("|");
  const seen = new Set();
  let current = cells;
  for (let i = 0; i < 4; i++) {
    const k = key(current);
    if (seen.has(k)) break;
    seen.add(k);
    current = rotateCells90(current);
  }
  return seen.size;
}

// Cell keys covered by a piece placed at (anchorR, anchorC) with given rotation.
export function getCoveredCellKeys(anchorR, anchorC, cells, rotation) {
  const offsets = rotateCells(cells ?? [[0, 0]], rotation);
  return offsets.map(([dr, dc]) => `${anchorR + dr},${anchorC + dc}`);
}
