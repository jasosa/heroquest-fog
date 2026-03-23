# Board Representation

`BOARD` is a 26×19 2D array (`src/map.js`). Each cell is `"C"` (corridor) or a room ID string (`"R1"`–`"R22"`). There are no `null`/wall cells — the board covers only playable cells; anything outside the array bounds is implicitly a wall. Cell coordinates are referenced as `"r,c"` string keys throughout.

The real board has two double-wide corridor sections (cols 12–13, rows 0–6 and rows 12–18).

## Screen Routing

The root `HeroQuestFog` component manages two screens:
- `"library"` → renders `<QuestLibrary>` — list/create/delete quests and quest books
- `"game"` → renders `<GameScreen key={quest.id}>` — board + sidebar for play or edit

`key={quest.id}` forces a full remount (and state reset) when switching quests.

## Styling

- All inline styles; parchment/dark-fantasy aesthetic
- Theme constant `T` in `src/theme.js` — import from there, never redefine inline
- Cell size: `CELL = 37px`
- Board background image: `public/board2.png` (default) or `public/board.png`, sized `100% 100%` to fit the grid exactly
- Board image: 963×704px, 37px per cell, no border offset needed
