// ─── Secret Door Marker Logic ─────────────────────────────────────────────────

const DEFAULT_MESSAGE = "You find no secret doors here.";

/**
 * Returns true if any existing marker is anchored in a cell belonging to regionId.
 */
export function hasSecretDoorMarkerInRoom(markers, board, regionId) {
  return Object.keys(markers).some(cellKey => {
    const [r, c] = cellKey.split(",").map(Number);
    return board[r]?.[c] === regionId;
  });
}

/**
 * Place a new searchsecret marker entry at (r, c).
 * - Corridor cells: always allowed (multiple per corridor).
 * - Room cells: one-per-room constraint.
 * - Wall/null cells: no-op.
 * Returns a new markers object (immutable).
 */
export function placeSecretDoorMarker(markers, board, r, c) {
  const region = board[r]?.[c];
  if (!region) return markers;
  if (region !== "C" && hasSecretDoorMarkerInRoom(markers, board, region)) return markers;
  return { ...markers, [`${r},${c}`]: { linkedDoorKey: null, message: "" } };
}

/**
 * Remove the marker entry for a given cell key.
 * Returns a new markers object (immutable).
 */
export function removeSecretDoorMarker(markers, cellKey) {
  if (!(cellKey in markers)) return { ...markers };
  const next = { ...markers };
  delete next[cellKey];
  return next;
}

/**
 * Associate a secretdoor piece anchor key with a marker entry.
 * No-op if cellKey is not in markers.
 * Returns a new markers object (immutable).
 */
export function linkSecretDoor(markers, cellKey, doorAnchorKey) {
  if (!(cellKey in markers)) return markers;
  return { ...markers, [cellKey]: { ...markers[cellKey], linkedDoorKey: doorAnchorKey } };
}

/**
 * Set the fallback message for a marker entry.
 * No-op if cellKey is not in markers.
 * Returns a new markers object (immutable).
 */
export function setSecretDoorMessage(markers, cellKey, message) {
  if (!(cellKey in markers)) return markers;
  return { ...markers, [cellKey]: { ...markers[cellKey], message } };
}

/**
 * Resolve a click on a searchsecret marker at cellKey in play mode.
 * Returns:
 *   { action: "reveal", doorKey: string }  — door found, reveal it
 *   { action: "message", text: string }    — nothing to reveal, show message
 */
export function resolveSecretDoorSearch(markers, placed, revealedSecretDoors, cellKey) {
  const entry = markers[cellKey];
  if (!entry) return { action: "message", text: DEFAULT_MESSAGE };

  const { linkedDoorKey, message } = entry;
  const text = message || DEFAULT_MESSAGE;

  if (linkedDoorKey && placed[linkedDoorKey]) {
    if (revealedSecretDoors.has(linkedDoorKey)) {
      return { action: "message", text };
    }
    return { action: "reveal", doorKey: linkedDoorKey };
  }

  return { action: "message", text };
}
