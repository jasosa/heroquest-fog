/**
 * Compute the default search-marker position for every region on the board.
 * Returns Record<regionId, [r, c]> — one entry per unique region.
 * The chosen cell is the median cell when all cells in the region are sorted
 * in row-major order (top-left → bottom-right).
 */
export function computeDefaultSearchMarkers(board, rows, cols) {
  const cells = {}; // regionId → [r, c][]
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const region = board[r]?.[c];
      if (!region || region === "C") continue;
      if (!cells[region]) cells[region] = [];
      cells[region].push([r, c]);
    }
  }
  const markers = {};
  for (const [region, regionCells] of Object.entries(cells)) {
    regionCells.sort((a, b) => a[0] * cols + a[1] - (b[0] * cols + b[1]));
    markers[region] = regionCells[Math.floor(regionCells.length / 2)];
  }
  return markers;
}

/**
 * Move the search marker for the region containing (r, c) to (r, c).
 * No-op if the cell is a wall (null/undefined/out of bounds).
 */
export function moveSearchMarker(markers, board, r, c) {
  const region = board[r]?.[c];
  if (!region || region === "C") return markers;
  return { ...markers, [region]: [r, c] };
}

/**
 * Set or update the note for a search marker region.
 * Returns a new notes object (immutable).
 */
export function setSearchNote(notes, regionId, note) {
  return { ...notes, [regionId]: note };
}
