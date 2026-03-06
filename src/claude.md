# HeroQuest Fog of War App

## What this is
A React web app to play HeroQuest solo with a fog-of-war mechanic.
The player clicks cells to reveal what a hero standing there would see.
Built with React + Vite. No backend, runs entirely in the browser.

## Core architecture decisions (already agreed, do not revisit)
- The HeroQuest board layout is FIXED — rooms and corridors are hardcoded once
- Walls are edges between cells, not cells themselves
- Reveal logic: flood fill for rooms, ray casting for corridors
- Doors are a special edge type that can be open or closed
- Quest data = only a list of placed elements (monsters, furniture, blockers)
- Quest data saves/loads as JSON files

## Current state
- Demo board working: 4 rooms + corridors, fog of war, edit/play modes
- Main component: src/heroquest-fog.jsx

## Next steps in order
1. Encode the real HeroQuest board (26 cols × 19 rows, all rooms + corridors)
2. Build the quest editor (place elements on the real board)
3. Quest save/load as JSON
4. Quest notes/DM text panel
5. Polish: fog animations, mobile layout

## Tech stack
- React 18 + Vite
- Inline styles (no CSS framework)
- No external dependencies beyond React