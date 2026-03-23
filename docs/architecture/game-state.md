# Game State

`useGameState` (`src/features/game/useGameState.js`) accepts `{ initialPlaced, initialDoors, initialMode, initialTitle, initialDescription }`.

| State | Type | Description |
|---|---|---|
| `fog` | `Set<string>` | Revealed cell keys — additive, never shrinks within a session |
| `placed` | `Record<"r,c", PlacedPiece>` | Anchor key → piece data |
| `doors` | `Record<"r,c", { rotation: 0–3 }>` | Anchor key → door data |
| `mode` | `"play" \| "edit"` | Current mode |
| `tool` | `string` | Selected piece type for edit mode |
| `rotation` | `0–3` | Current placement rotation (resets to 0 on tool change) |
| `questTitle` | `string` | Editable in edit mode, shown in play mode |
| `questDescription` | `string` | Editable in edit mode |

**PlacedPiece shape:** `{ type, blocks, rotation, coveredCells: string[] }`

Uses `useLatest` refs so `handleCell` and `handleCellRotate` have no stale-closure issues and empty dependency arrays.

## Two Modes

**Play mode** — clicking a cell calls `computeReveal(r, c, placed)` and merges the result into `fog`. Fog is permanent for the session. Hero Start markers auto-reveal their surroundings when entering play mode.

**Edit mode** — clicking places or removes pieces. Right-click rotates. Pieces with `isEdge: true` (doors) are placed on cell edges rather than occupying cells.
