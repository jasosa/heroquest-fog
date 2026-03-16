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
 */
export function togglePlacedPiece(placed, piece, r, c, rotation) {
  if (!piece || piece.isEdge) return placed;
  const k = `${r},${c}`;

  // Remove if clicking an occupied cell.
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
