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

## Permissions

**On a feature branch** (`feat/*` or `fix/*`): proceed autonomously — read, write, edit, and run any
files within this project directory without asking for confirmation. Do not prompt the user for
permission on file edits, file writes, or test runs.

**On `main`**: follow the default permission behaviour — ask before modifying any file.

## Workflow

When asked to work on the next item:
1. Read `docs/planning/Backlog.md`
2. Pick the highest-priority `not_started` item across features and issues —
   for issues, consider both priority and impact
3. Update its status to `in_progress`
4. Create a git branch for the item: `git checkout -b feat/FEAT-XXX` for features
   or `git checkout -b fix/ISSUE-XXX` for issues, where XXX is the item ID number.
   Branch off `main` (`git checkout main && git pull` first if needed).
5. If the item is a feature with `complexity: high`, invoke the `architect` 
   subagent first — review the recommendation and confirm the approach
6. If the item is a new feature (not a bug fix), invoke the `ux` subagent —
   review the UX proposal before continuing
7. Invoke the `planner` subagent with the feature description plus any
   architect and UX outputs
8. Review the plan before proceeding
9. Invoke the `swe` subagent with the approved plan
10. If all tests pass (`npm test`), commit all changes on the feature branch with
    the item ID and title as the commit message (e.g. `[FEAT-013] Manage traps in Chests`)
11. Update the item status to `committed` — **never mark items as `done`**
12. **Never merge the feature branch into `main`** — the user merges manually
13. Switch back to `main` (`git checkout main`) and loop back to step 1 to pick
    the next highest-priority `not_started` item — **only `not_started` items are eligible, never `committed` or `in_progress`**