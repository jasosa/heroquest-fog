# Data Model

## Doors

Doors are edge objects, not cell objects. Stored in `doors` state: `Record<"r,c", { rotation: 0|1|2|3 }>` where `"r,c"` is the anchor cell.

Rotations: **0** = right edge, **1** = bottom edge, **2** = left edge, **3** = top edge.

Rendered as absolutely-positioned overlays on the board container (`position: relative`). Visible in play mode when either adjacent cell is revealed.

Placement: click with Door tool toggles the door at the anchor cell. Right-click cycles rotation (0→1→2→3→0).

## Quest Persistence (`src/shared/questStorage.js`)

All data in `localStorage`. Two collections plus calibration.

**Quest books** (`hq_quest_books`): `{ id, title, description, coverImage, createdAt }`
- `coverImage` is a base64 data URL (or `null`), shown in the library showcase.

**Quests** (`hq_quests`) — created with:
`{ id, title, description, questBookId, questNumber, placementMessage, placed, doors, createdAt, updatedAt }`

Quests saved from edit mode (and quests created via JSON import) may additionally carry the edit-authored marker maps:
- `searchMarkers` — room search-marker positions (or `null` = use defaults)
- `searchNotes` — `Record<region, string>` search-note text
- `secretDoorMarkers` — placed secret-door markers
- `placementMessage` — hero-placement popup text

`placed` is `Record<"r,c", PlacedPiece>` and `doors` is `Record<"r,c", { rotation }>` (see the Doors section above).

Key functions: `createQuestBook`, `updateQuestBook`, `deleteQuestBook` (cascades to its quests), `createQuest`, `persistQuest` (upsert), `deleteQuest`, `loadQuests`, `loadQuestBooks`, `migrateQuests` (backfills `questNumber`), `loadCalibration`, `saveCalibration`.

**JSON import/export:** `exportQuestAsJson(quest)` returns a downloadable JSON string with runtime-only fields (`id`, `questBookId`, `createdAt`, `updatedAt`) stripped. `importQuestFromJson(jsonString, questBookId)` validates required fields (`title`, `placed`, `doors`), assigns a fresh `id`, and persists the quest under `questBookId`; it throws on malformed or invalid JSON.

Fog is **not** saved — always reset when loading a quest.

## Calibration

**`hq_calibration`**: `Record<mapId, { anchors: { pixel: [x,y], logical: [r,c] }[], ready: boolean }>`. Used by `MapCalibrator` to map board image pixel coordinates to logical grid coordinates.

`useMapTransform(calibrationData, mapId)` returns `(col, row) → [px, py]` using affine transform (3 anchors) or homography (4+ anchors); returns `[0,0]` if calibration is absent or has fewer than 3 anchors.
