# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR (Vite)
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

There are no tests.

## Architecture

Single-component React app. All logic lives in `src/heroquest-fog.jsx` — no routing, no state management library, no CSS files.

**Board representation:** A 2D array (`BOARD`) where each cell is `null` (wall/void), `"C"` (corridor), or a room ID string (`"R1"`–`"R4"`). Cell coordinates are referenced as `"r,c"` string keys throughout.

**Two modes:**
- **Play mode** — clicking a cell runs `computeReveal()` and adds the result to the `fog` Set (revealed cells). Fog is additive/permanent per session.
- **Edit mode** — clicking a cell places/removes a piece token from the `placed` map (`"r,c"` → `{ type, blocks }`).

**Reveal logic (`computeReveal`):**
- Room cell: flood fill within the same room region, blocked by `blocks: true` pieces.
- Corridor cell: ray cast in 4 cardinal directions along `"C"` cells, stopped by walls or `blocks: true` pieces.

**State:**
- `fog` — `Set<string>` of revealed cell keys
- `placed` — `Record<string, { type, blocks }>` of placed piece tokens
- `mode` — `"play" | "edit"`
- `tool` — currently selected piece type for edit mode

**Piece types** are defined in the `PIECES` constant. A piece with `blocks: true` (currently only `blocker`) stops corridor visibility rays and room flood fills.

**Styling:** All inline styles, dark fantasy aesthetic. No CSS framework, no stylesheet. Cell size is `CELL = 40px`.

## Current state & roadmap

This is a demo board (16×12, 4 rooms). The `src/CLAUDE.md` file contains the agreed next steps:

1. Encode the real HeroQuest board (26 cols × 19 rows)
2. Build the quest editor (place elements on real board)
3. Quest save/load as JSON
4. Quest notes/DM text panel
5. Polish: fog animations, mobile layout

## Key constraints (do not revisit)

- Board layout is hardcoded — rooms and corridors are fixed data, not dynamically generated
- Walls are `null` cells, not a separate edge type (current demo; doors as edge types are planned)
- No backend — runs entirely in the browser
