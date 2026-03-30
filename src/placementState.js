import { getCoveredCellKeys } from "./pieceGeometry.js";

// Find the anchor key of the piece whose footprint covers cell key `k`.
function findAnchor(placed, k) {
  if (placed[k]) return k;
  return Object.keys(placed).find(
    (ak) => (placed[ak].coveredCells ?? [ak]).includes(k)
  ) ?? null;
}

/**
 * Toggle a piece at (r, c):
 * - If any cell in the new footprint is already occupied → no-op.
 * - If clicking an existing piece's footprint → remove it.
 * - Otherwise → place the piece.
 * Edge pieces (isEdge) are ignored — use toggleDoor instead.
 *
 * Optional `pieces` map enables marker-stacking behaviour:
 * a marker (1×1, no image) can be placed on top of furniture without
 * removing the furniture, and clicking a stacked marker removes only it.
 */
export function togglePlacedPiece(placed, piece, r, c, rotation, pieces) {
  if (!piece || piece.isEdge) return placed;
  const k = `${r},${c}`;

  const isIncomingMarker = !piece.cells && !piece.image;

  if (isIncomingMarker && pieces) {
    const existingAtAnchor = placed[k];
    if (existingAtAnchor) {
      const existingDef = pieces[existingAtAnchor.type];
      const existingIsMarker = !existingDef?.cells && !existingDef?.image;
      if (existingIsMarker) {
        // Toggle off the stacked marker entry.
        const next = { ...placed };
        delete next[k];
        return next;
      }
      // Anchor belongs to furniture — store/toggle the marker as overlayMarker.
      if (existingAtAnchor.overlayMarker) {
        const { overlayMarker: _removed, ...rest } = existingAtAnchor;
        return { ...placed, [k]: rest };
      }
      return { ...placed, [k]: { ...existingAtAnchor, overlayMarker: piece.id } };
    }
    // No anchor at k: place marker (even if cell is covered by furniture).
    const coveredCells = getCoveredCellKeys(r, c, piece.cells ?? [[0, 0]], rotation);
    return { ...placed, [k]: { type: piece.id, blocks: piece.blocks ?? false, rotation, coveredCells } };
  }

  // Non-marker (or legacy call without pieces map): original behaviour.
  const anchor = findAnchor(placed, k);
  if (anchor) {
    const next = { ...placed };
    delete next[anchor];
    return next;
  }

  // Reject if any covered cell is already occupied.
  const coveredCells = getCoveredCellKeys(r, c, piece.cells ?? [[0, 0]], rotation);
  const hasOverlap = coveredCells.some((ck) => findAnchor(placed, ck) !== null);
  if (hasOverlap) return placed;

  return {
    ...placed,
    [k]: { type: piece.id, blocks: piece.blocks ?? false, rotation, coveredCells },
  };
}

/**
 * Rotate the piece whose footprint covers (r, c) by 90° clockwise.
 * No-op for 1×1 pieces or if the rotated footprint overlaps another piece.
 * `pieces` is the flat piece map: Record<id, PieceDef>.
 */
export function rotatePlacedPiece(placed, pieces, r, c) {
  const k = `${r},${c}`;
  const anchor = findAnchor(placed, k);
  if (!anchor) return placed;

  const entry   = placed[anchor];
  const pieceDef = pieces[entry.type];
  if (!pieceDef?.cells) return placed; // 1×1 — nothing to rotate

  const [ar, ac]    = anchor.split(",").map(Number);
  const newRotation = (entry.rotation + 1) % 4;
  const newCovered  = getCoveredCellKeys(ar, ac, pieceDef.cells, newRotation);

  // Reject if the rotated footprint overlaps a different piece.
  const hasOverlap = newCovered.some((ck) => {
    const a = findAnchor(placed, ck);
    return a !== null && a !== anchor;
  });
  if (hasOverlap) return placed;

  return { ...placed, [anchor]: { ...entry, rotation: newRotation, coveredCells: newCovered } };
}

/**
 * Toggle a door at (r, c):
 * - If already present → remove.
 * - Otherwise → place with the given rotation.
 */
export function toggleDoor(doors, r, c, rotation) {
  const k = `${r},${c}`;
  if (doors[k]) {
    const next = { ...doors };
    delete next[k];
    return next;
  }
  return { ...doors, [k]: { rotation } };
}

/**
 * Cycle an existing door's rotation (0→1→2→3→0).
 * No-op if no door at (r, c).
 */
export function cycleDoorRotation(doors, r, c) {
  const k = `${r},${c}`;
  if (!doors[k]) return doors;
  return { ...doors, [k]: { rotation: (doors[k].rotation + 1) % 4 } };
}

/**
 * Place a note marker at (r, c).
 * If a note marker already exists at that cell, remove it (toggle).
 */
export function placeNoteMarker(placed, r, c, note) {
  const k = `${r},${c}`;
  if (placed[k]?.type === "notemarker") {
    const next = { ...placed };
    delete next[k];
    return next;
  }
  return { ...placed, [k]: { type: "notemarker", note: note ?? "", blocks: false, rotation: 0, coveredCells: [k] } };
}

/**
 * Update the note of an existing note marker.
 * No-op if no note marker at anchorKey.
 */
export function updateNoteMarker(placed, anchorKey, note) {
  if (!placed[anchorKey] || placed[anchorKey].type !== "notemarker") return placed;
  return { ...placed, [anchorKey]: { ...placed[anchorKey], note: note ?? "" } };
}

/**
 * Set or clear the special status and note on a placed piece (typically a monster).
 * No-op if no piece at anchorKey.
 */
export function setMonsterSpecial(placed, anchorKey, isSpecial, specialNote) {
  if (!placed[anchorKey]) return placed;
  return { ...placed, [anchorKey]: { ...placed[anchorKey], isSpecial, specialNote: specialNote ?? "" } };
}

/**
 * Set or clear the trap configuration on a placed chest piece.
 * No-op if no piece at anchorKey.
 */
export function setChestTrap(placed, anchorKey, hasTrap, trapNote) {
  if (!placed[anchorKey]) return placed;
  return { ...placed, [anchorKey]: { ...placed[anchorKey], hasTrap, trapNote: trapNote ?? "" } };
}

/**
 * Set springMessage and removeAfterSpring on a placed trap piece.
 * No-op if no piece at anchorKey.
 */
export function setTrapSpringConfig(placed, anchorKey, { springMessage, removeAfterSpring }) {
  if (!placed[anchorKey]) return placed;
  return { ...placed, [anchorKey]: { ...placed[anchorKey], springMessage, removeAfterSpring } };
}

/**
 * Set springMessage and removeAfterSpring on all placed pieces matching trapType.
 * Returns the original reference if no entries matched.
 */
export function setTrapSpringConfigForAll(placed, trapType, { springMessage, removeAfterSpring }) {
  const matchingKeys = Object.keys(placed).filter(k => placed[k].type === trapType);
  if (matchingKeys.length === 0) return placed;
  const next = { ...placed };
  for (const k of matchingKeys) {
    next[k] = { ...placed[k], springMessage, removeAfterSpring };
  }
  return next;
}
