# CLAUDE.md

## Commands

```bash
npm run dev       # Start dev server with HMR (Vite)
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm run test      # Run Vitest unit tests (117 tests across 5 suites)
```

## Architecture

React + Vite app. No routing library, no state management library, no CSS files — all inline styles. No backend — runs entirely in the browser; localStorage only.

Theme constant `T` in `src/theme.js` — import from there, never redefine inline.

For detailed subsystem docs, see:
- @docs/architecture/board.md — board representation, screen routing, styling
- @docs/architecture/game-state.md — useGameState hook, PlacedPiece shape, play/edit modes
- @docs/architecture/reveal.md — fog of war logic, wide corridor detection
- @docs/architecture/pieces.md — piece catalogue, special behaviors, multi-cell rotation
- @docs/architecture/data-model.md — doors, quest persistence, calibration

## Development Workflow

Always follow strict Red/Green/Refactor TDD:

1. **Red** — Write a failing test first. Run `npm test` and confirm it fails for the right reason.
2. **Green** — Write the minimum code to make the test pass. No more, no less.
3. **Refactor** — Clean up while keeping tests green.

Rules:
- Never write implementation code without a failing test first
- Run `npm test` after every small change
- If fixing a bug, write a failing test that reproduces it first
- One failing test at a time — don't write multiple failing tests ahead
- Commit at Green (passing tests), never at Red

## Key Constraints (do not revisit)

- Board layout is hardcoded — rooms and corridors are fixed data, not dynamically generated
- No `null` wall cells — walls are implicit (out of bounds or non-`C`/non-room value)
- Reveal logic is in `reveal.js`, not in components — tested independently
- Piece rotation never normalizes to `[0,0]` — negative offsets are intentional
- `key={quest.id}` on GameScreen forces full remount on quest switch — intentional

## Workflow

When asked to work on a feature:
1. Read `docs/planning/FEATURES.md`, pick the highest-priority `not_started` feature, update its status to `in_progress`
2. Invoke the `planner` subagent — review the plan before proceeding
3. Invoke the `swe` subagent with the approved plan to implement it
4. Update `docs/planning/FEATURES.md` status to `done` when complete