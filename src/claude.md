# src/CLAUDE.md

Source-level notes for this directory.

## Completed work

1. ✅ Real HeroQuest board encoded (`map.js` — 26×19, 22 rooms)
2. ✅ Quest editor — place monsters, traps, furniture, doors in edit mode
3. ✅ Quest save/load — localStorage via `questStorage.js`; quest library screen in `QuestLibrary.jsx`
4. ✅ Quest books — quests can be grouped; quest library has two-panel layout
5. ✅ Board background image — `board2.png` default, `board.png` alternative; switchable in sidebar
6. ✅ Multi-cell pieces with rotation — bookcase 3×1, stairs 2×2, fireplace 2×1, etc.
7. ✅ Doors on cell edges — 4 rotation positions (right/bottom/left/top); independent of piece system
8. ✅ Wide corridor visibility — double lanes (cols 12–13) reveal simultaneously; T-junctions fixed
9. ✅ Light parchment theme — `theme.js` shared across files
10. ✅ Image-based piece rendering — monsters/furniture rendered as images from `public/`; `imageScale` supports per-tileset values via `resolveScale`
11. ✅ Code organisation refactor — board/game/sidebar split into `features/` subdirectories; placement logic extracted to `placementState.js`; piece catalogue to `pieces.js`
12. ✅ Marker stacking — markers (e.g. Hero Start) can overlay furniture cells via `overlayMarker` field
13. ✅ Map calibration — `MapCalibrator` component + `useMapTransform` for pixel↔logical coordinate mapping; persisted to `hq_calibration` in localStorage
14. ✅ Letter markers (Feature A) — place A–Z letters on cells with optional DM notes; tooltip on hover (desktop) or tap (mobile) in play mode; edit dialog on click in edit mode
15. ✅ Special monsters (Feature B) — ★ button in edit mode opens annotation dialog; special monsters show a purple glowing ring in play mode

## Possible next steps

- Quest notes / DM text panel (per-quest rich text)
- Fog animations (CSS transitions on reveal)
- Mobile layout
- Open/closed door state affecting visibility (currently doors are visual only)
- Export/import quests as JSON files
