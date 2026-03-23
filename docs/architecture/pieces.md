# Piece Catalogue (`src/pieces.js`)

Four categories: **Monsters**, **Traps**, **Furniture**, **Markers**. Adding a piece to `PIECE_CATEGORIES` automatically registers it in the `PIECES` flat lookup map.

## Piece Definition Fields

- `id`, `label`, `icon`, `color`, `shape` — display
- `blocks: true` — stops corridor rays and room flood fills
- `cells: [r,c][]` — multi-cell footprint (omit for 1×1); offsets relative to anchor `[0,0]`
- `isEdge: true` — door pieces; placed on cell edges, not in cells
- `image` — filename in `public/` directory; rendered as image overlay on the cell
- `imageScale` — scale factor; plain number (all tilesets) or object keyed by tileset ID (e.g. `{ board2: 1, board3: 0.95 }`). Use `resolveScale(imageScale, tileSet)` to resolve.

## Special Piece Behaviors

**Marker stacking:** A marker (1×1, no `image`) can be placed on top of furniture. The furniture's `placed` entry gains an `overlayMarker: pieceId` field. Clicking the cell again removes the marker. Logic lives in `togglePlacedPiece` in `placementState.js`.

**Letter markers (`id: "letter"`):** Store extra fields `letter: string` (A–Z) and `note: string` on the `PlacedPiece`. Placed via `placeLetterMarker`. In edit mode, clicking opens `LetterMarkerDialog`. In play mode, clicking toggles tooltip (mobile); hovering shows/hides on desktop.

**Special monsters:** Any placed piece can carry `isSpecial: boolean` and `specialNote: string` via `setMonsterSpecial`. In edit mode, a ★ button opens `SpecialMonsterDialog`. In play mode, special monsters render with a purple glowing ring.

**Multi-cell pieces** store `coveredCells` (absolute `"r,c"` keys) at placement time. Rotation uses `getCoveredCellKeys(anchorR, anchorC, cells, rotation)` from `pieceGeometry.js`. 4 × 90° increments always return to original orientation. No normalization — negative offsets are valid.
