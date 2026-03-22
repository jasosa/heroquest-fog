# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR (Vite)
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm run test      # Run Vitest unit tests (117 tests across 5 suites)
```

## Architecture

React + Vite app. No routing library, no state management library, no CSS files — all inline styles.

### File map

| File | Purpose |
|---|---|
| `src/heroquest-fog.jsx` | Root app component: screen router, `HeroQuestFog` |
| `src/QuestLibrary.jsx` | Quest library screen (two-panel: books sidebar + quest cards grid) |
| `src/questStorage.js` | Pure localStorage CRUD for quest books, quests, and calibration |
| `src/theme.js` | Shared `T` theme constant (light parchment palette) |
| `src/map.js` | Real HeroQuest board: 26×19, exports `BOARD`, `ROWS`, `COLS` |
| `src/reveal.js` | `makeComputeReveal(board, rows, cols)` factory — fog of war logic |
| `src/pieceGeometry.js` | Rotation and coverage utilities for multi-cell pieces |
| `src/pieces.js` | Piece catalogue: `PIECE_CATEGORIES`, `PIECES` lookup map, `resolveScale` |
| `src/placementState.js` | Pure placement mutations: `togglePlacedPiece`, `rotatePlacedPiece`, `toggleDoor`, `cycleDoorRotation` |
| `src/features/game/useGameState.js` | `useGameState` hook — all game state and handlers |
| `src/features/board/BoardGrid.jsx` | Board grid renderer |
| `src/features/board/BoardCell.jsx` | Individual cell renderer (fog, piece image, marker overlay) |
| `src/features/board/DoorOverlay.jsx` | Absolutely-positioned door overlays on the board |
| `src/features/board/TokenOverlay.jsx` | Token/piece image overlays on cells |
| `src/features/board/RoomConfirmDialog.jsx` | Confirmation dialog for room actions |
| `src/features/board/LetterMarkerDialog.jsx` | Dialog for editing a letter marker (letter A–Z + note) |
| `src/features/board/SpecialMonsterDialog.jsx` | Dialog for marking a monster as special and adding a DM note |
| `src/features/sidebar/Sidebar.jsx` | Game sidebar (mode controls, piece picker, quest info) |
| `src/components/EditPanel.jsx` | Edit-mode panel (shared across edit tools) |
| `src/components/MapCalibrator.jsx` | Calibration UI; exports `useMapTransform` hook |
| `src/reveal.test.js` | 21 unit tests for reveal logic |
| `src/pieceGeometry.test.js` | 25 unit tests for piece geometry |
| `src/placementState.test.js` | Unit tests for placement state mutations |
| `src/features/game/useGameState.test.js` | Unit tests for game state hook |
| `src/calibration.test.js` | Unit tests for calibration CRUD and `useMapTransform` |

### Board representation

`BOARD` is a 26×19 2D array. Each cell is `"C"` (corridor) or a room ID string (`"R1"`–`"R22"`). There are no `null`/wall cells — the board covers only playable cells; anything outside the array bounds is implicitly a wall. Cell coordinates are referenced as `"r,c"` string keys throughout.

The real board has two double-wide corridor sections (cols 12–13, rows 0–6 and rows 12–18).

### Screen routing

The root `HeroQuestFog` component manages two screens:
- `"library"` → renders `<QuestLibrary>` — list/create/delete quests and quest books
- `"game"` → renders `<GameScreen key={quest.id}>` — board + sidebar for play or edit

`key={quest.id}` forces a full remount (and state reset) when switching quests.

### Game state (`useGameState`)

Accepts `{ initialPlaced, initialDoors, initialMode, initialTitle, initialDescription }`.

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

### Two modes

**Play mode** — clicking a cell calls `computeReveal(r, c, placed)` and merges the result into `fog`. Fog is permanent for the session. Hero Start markers auto-reveal their surroundings when entering play mode.

**Edit mode** — clicking places or removes pieces. Right-click rotates. Pieces with `isEdge: true` (doors) are placed on cell edges rather than occupying cells.

### Reveal logic (`src/reveal.js`)

- **Room cell** → flood fill within cells sharing the same room ID, blocked by `blocks: true` pieces.
- **Corridor cell** → for each of the 4 cardinal directions, collect parallel-lane starting cells (wide corridor detection), then cast an independent ray per lane.

**Wide corridor detection:** a neighboring cell qualifies as a parallel start only if *both* the hero cell and the neighbor extend in the ray direction. This prevents T-junctions from incorrectly triggering multi-lane behavior (e.g. standing at col 16 looking right must not reveal the row-9 perpendicular corridor).

### Piece catalogue (`PIECE_CATEGORIES`)

Four categories: **Monsters**, **Traps**, **Furniture**, **Markers**. Adding a piece to `PIECE_CATEGORIES` automatically registers it in the `PIECES` flat lookup map.

Piece definition fields:
- `id`, `label`, `icon`, `color`, `shape` — display
- `blocks: true` — stops corridor rays and room flood fills
- `cells: [r,c][]` — multi-cell footprint (omit for 1×1); offsets are relative to anchor `[0,0]`
- `isEdge: true` — door pieces; placed on cell edges, not in cells
- `image` — filename in `public/` directory; rendered as image overlay on the cell
- `imageScale` — scale factor for the image; can be a plain number (all tilesets) or an object keyed by tileset ID (e.g. `{ board2: 1, board3: 0.95 }`). Use `resolveScale(imageScale, tileSet)` from `pieces.js` to resolve the effective value.

**Marker stacking:** A marker (1×1, no `image`) can be placed on top of furniture. The furniture's `placed` entry gains an `overlayMarker: pieceId` field. Clicking the cell again removes the marker. This stacking logic lives in `togglePlacedPiece` in `placementState.js`.

**Letter markers (`id: "letter"`):** Special 1×1 markers that store two extra fields on the `PlacedPiece`: `letter: string` (A–Z) and `note: string`. Placed via `placeLetterMarker` in `placementState.js`. In edit mode, clicking an existing letter marker opens `LetterMarkerDialog` for editing. In play mode, clicking toggles the tooltip (mobile); hovering on desktop shows/hides it.

**Special monsters:** Any placed piece can be annotated with `isSpecial: boolean` and `specialNote: string` via `setMonsterSpecial` in `placementState.js`. In edit mode, a ★ button overlays placed monsters to open `SpecialMonsterDialog`. In play mode, special monsters render with a purple glowing ring (`box-shadow` on an absolutely-positioned overlay element).

**Multi-cell pieces** store `coveredCells` (absolute `"r,c"` keys) at placement time. Rotation uses `getCoveredCellKeys(anchorR, anchorC, cells, rotation)` from `pieceGeometry.js`. 4 × 90° increments always return to the original orientation. No normalization — negative offsets are valid (piece extends behind the anchor).

### Doors

Doors are edge objects, not cell objects. Stored in `doors` state: `Record<"r,c", { rotation: 0|1|2|3 }>` where `"r,c"` is the anchor cell.

Rotations: **0** = right edge, **1** = bottom edge, **2** = left edge, **3** = top edge.

Rendered as absolutely-positioned overlays on the board container (`position: relative`). Visible in play mode when either adjacent cell is revealed.

Placement: click with Door tool toggles the door at the anchor cell. Right-click cycles rotation (0→1→2→3→0).

### Quest persistence (`src/questStorage.js`)

All data in `localStorage` (no backend). Two collections:

**Quest books** (`hq_quest_books`): `{ id, title, description, createdAt }`

**Quests** (`hq_quests`): `{ id, title, description, questBookId, placed, doors, createdAt, updatedAt }`

Key functions: `createQuestBook`, `deleteQuestBook` (cascades), `createQuest`, `persistQuest` (upsert), `deleteQuest`, `loadQuests`, `loadQuestBooks`, `loadCalibration`, `saveCalibration`.

Fog is **not** saved — it is always reset when loading a quest.

**Calibration** (`hq_calibration`): `Record<mapId, { anchors: { pixel: [x,y], logical: [r,c] }[], ready: boolean }>`. Used by `MapCalibrator` to map board image pixel coordinates to logical grid coordinates. `useMapTransform(calibrationData, mapId)` returns a function `(col, row) → [px, py]` using affine transform (3 anchors) or homography (4+ anchors); returns `[0,0]` if calibration is absent or has fewer than 3 anchors.

### Styling

- All inline styles; parchment/dark-fantasy aesthetic
- Theme constant `T` in `src/theme.js` — import from there, never redefine inline
- Cell size: `CELL = 37px`
- Board background image: `public/board2.png` (default) or `public/board.png`, sized `100% 100%` to fit the grid exactly
- Board image: 963×704px, 37px per cell, no border offset needed

## Development Workflow

Always follow strict Red/Green/Refactor TDD:

1. **Red** — Write a failing test first. Run `npm test` and confirm it fails for the right reason before writing any implementation.
2. **Green** — Write the minimum code to make the test pass. No more, no less.
3. **Refactor** — Clean up the code while keeping tests green.

### Rules
- Never write implementation code without a failing test first
- Run `npm test` after every small change
- If fixing a bug, write a failing test that reproduces it first
- One failing test at a time — don't write multiple failing tests ahead
- Commit at Green (passing tests), never at Red

## Key constraints (do not revisit)

- Board layout is hardcoded — rooms and corridors are fixed data, not dynamically generated
- No `null` wall cells — walls are implicit (out of bounds or non-`C`/non-room value)
- No backend — runs entirely in the browser; localStorage only
- Reveal logic is in `reveal.js`, not in the component — tested independently
- Piece rotation never normalizes to `[0,0]` — negative offsets are intentional
