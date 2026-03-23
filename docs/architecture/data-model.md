# Data Model

## Doors

Doors are edge objects, not cell objects. Stored in `doors` state: `Record<"r,c", { rotation: 0|1|2|3 }>` where `"r,c"` is the anchor cell.

Rotations: **0** = right edge, **1** = bottom edge, **2** = left edge, **3** = top edge.

Rendered as absolutely-positioned overlays on the board container (`position: relative`). Visible in play mode when either adjacent cell is revealed.

Placement: click with Door tool toggles the door at the anchor cell. Right-click cycles rotation (0→1→2→3→0).

## Quest Persistence (`src/questStorage.js`)

All data in `localStorage`. Two collections:

**Quest books** (`hq_quest_books`): `{ id, title, description, createdAt }`

**Quests** (`hq_quests`): `{ id, title, description, questBookId, placed, doors, createdAt, updatedAt }`

Key functions: `createQuestBook`, `deleteQuestBook` (cascades), `createQuest`, `persistQuest` (upsert), `deleteQuest`, `loadQuests`, `loadQuestBooks`, `loadCalibration`, `saveCalibration`.

Fog is **not** saved — always reset when loading a quest.

## Calibration

**`hq_calibration`**: `Record<mapId, { anchors: { pixel: [x,y], logical: [r,c] }[], ready: boolean }>`. Used by `MapCalibrator` to map board image pixel coordinates to logical grid coordinates.

`useMapTransform(calibrationData, mapId)` returns `(col, row) → [px, py]` using affine transform (3 anchors) or homography (4+ anchors); returns `[0,0]` if calibration is absent or has fewer than 3 anchors.
