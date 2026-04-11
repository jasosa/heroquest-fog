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

const SEARCH_SLOTS = 4;

/**
 * Set the note at a specific search slot (0–3) for a region.
 * Missing slots are initialised as empty strings.
 * Returns a new notes object (immutable).
 */
export function setSearchNoteAt(notes, regionId, index, note) {
  const existing = Array.isArray(notes[regionId])
    ? notes[regionId]
    : Array(SEARCH_SLOTS).fill("");
  const updated = [...existing];
  while (updated.length < SEARCH_SLOTS) updated.push("");
  updated[index] = note;
  return { ...notes, [regionId]: updated };
}

/**
 * Normalize legacy searchNotes (string values) to 4-element arrays.
 * - string → [string, "", "", ""]
 * - short array → padded to 4 with ""
 * - 4-element array → unchanged (new object)
 */
export function normalizeSearchNotes(notes) {
  const result = {};
  for (const [regionId, value] of Object.entries(notes)) {
    const arr = Array.isArray(value)
      ? [...value]
      : [typeof value === "string" ? value : ""];
    while (arr.length < SEARCH_SLOTS) arr.push("");
    result[regionId] = arr;
  }
  return result;
}

/**
 * Remove the search marker for a given region.
 * Returns a new markers object (immutable).
 */
export function removeSearchMarker(markers, regionId) {
  const next = { ...markers };
  delete next[regionId];
  return next;
}
