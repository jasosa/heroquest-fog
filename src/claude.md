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

## Possible next steps

- Quest notes / DM text panel (per-quest rich text)
- Fog animations (CSS transitions on reveal)
- Mobile layout
- Open/closed door state affecting visibility (currently doors are visual only)
- Export/import quests as JSON files
