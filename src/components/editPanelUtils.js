/**
 * Resolves the image path for a piece in the edit panel thumbnail.
 *
 * - Pieces with no `image` field → null (render colored swatch instead).
 * - Pieces with `tileIndependent: true` → "/tiles/<image>" (root-level, no tileset subfolder).
 * - All other pieces with `image` → "/tiles/<tileSet>/<image>" (tileset subfolder).
 *
 * @param {object} piece   - Piece definition from PIECES / PIECE_CATEGORIES
 * @param {string} tileSet - Active tileset id (e.g. "board2"); defaults to "board2"
 * @returns {string|null}
 */
export function resolveTilePath(piece, tileSet) {
  if (!piece.image) return null;
  const ts = tileSet ?? "board2";
  if (piece.tileIndependent) return `/tiles/${piece.image}`;
  return `/tiles/${ts}/${piece.image}`;
}
