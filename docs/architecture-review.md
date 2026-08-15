# Architecture Review — HeroQuest Fog of War

_Assessment date: 2026-05-30. Based on full source read; no code modified._

> **Superseded 2026-07-13:** any references below to stale `docs/architecture/*` paths (pre-`src/shared/`
> refactor) were fixed in commit `60bdf86`. Treat this report as a historical snapshot.

---

## Current Architecture

A single-page, client-only React 19 application built with Vite 7. No router, no state-management
library, no CSS files, no backend. Everything runs in the browser; the only persistence is
`localStorage`. Styling is inline, driven by a central theme-token object `T` (`src/shared/theme.js`).

### Major subsystems

```
App (App.jsx)
└── GameScreen (features/game/GameScreen.jsx)   ── screen router + modal orchestration
    ├── screen "library"  → QuestLibrary         ── books, quests, showcase, import/export
    ├── screen "game"      → BoardArea + Sidebar  ── board render + controls (key={quest.id} remount)
    │    ├── BoardGrid / BoardCell               ── grid cells, fog rendering
    │    ├── TokenOverlay                        ── placed pieces + play-mode interactive states
    │    ├── DoorOverlay / SearchMarkerOverlay / SecretDoorMarkerOverlay
    │    └── many modals (Trap/Chest/SecretDoor/Search/Note/SpecialMonster/HeroPlacement dialogs+popups)
    └── screen "calibration" → MapCalibrator      ── pixel↔grid calibration

State core:   useGameState (features/game/useGameState.js)
Pure logic:   shared/{reveal, pieceGeometry, pieces, map, questSort, theme}
              board/{searchMarkers, secretDoorMarkers}, game/{placementState, navigationGuards}
Persistence:  shared/questStorage.js  (localStorage CRUD + JSON import/export + calibration)
```

| Subsystem | Responsibility | Key files |
|---|---|---|
| **Board model** | Static 26×19 grid of corridor/room IDs; coordinate keys `"r,c"` | `shared/map.js` |
| **Reveal engine** | Fog reveal: room flood-fill, corridor multi-lane ray casting, wide-corridor detection | `shared/reveal.js` |
| **Piece system** | Catalogue (monsters/traps/furniture/markers), multi-cell footprints, rotation, image scaling | `shared/pieces.js`, `shared/pieceGeometry.js` |
| **Placement** | Immutable mutations of the `placed` map (markers, special monsters, chest/trap config) | `game/placementState.js` |
| **Game state** | All session + edit state; handlers; pure helpers; interception logic | `game/useGameState.js` |
| **Markers** | Search-note and secret-door marker lifecycle | `board/searchMarkers.js`, `board/secretDoorMarkers.js` |
| **Navigation guards** | Dirty-session detection, unsaved-changes snapshot comparison | `game/navigationGuards.js` |
| **Persistence** | Books/quests CRUD, migration, JSON import/export, calibration | `shared/questStorage.js` |
| **Calibration** | Map board-image pixels → logical grid via affine/homography | `calibration/MapCalibrator.jsx`, `useMapTransform` |
| **Library** | Quest book/quest management, cinematic showcase UI | `library/*` |

### Dependencies (direction of knowledge)
- `features/*` → `shared/*` (one-way; shared has no knowledge of features). **Good.**
- `useGameState` composes the pure logic modules and is consumed by `GameScreen`.
- **Leak:** `Sidebar.jsx` and `BoardGrid.jsx` read/write `localStorage` directly rather than through
  `questStorage.js`, so storage-key knowledge is not fully centralised.

### Data flow
1. **Load:** `QuestLibrary` reads books/quests via `questStorage`; selecting a quest mounts
   `GameScreen` with `key={quest.id}` (full remount → clean state).
2. **Edit:** clicks call `useGameState` handlers → pure functions in `placementState`/markers return
   new `placed`/`doors`/marker maps → `persistQuest` writes to `localStorage`.
3. **Play:** clicks call `computeReveal(r,c,placed)` → merged into the additive `fog: Set`. Trap/chest
   interception runs *before* reveal. Session-only sets (`revealedTraps`, `springedTraps`,
   `disarmedTraps`, `openedChests`, `revealedSecretDoors`, `searchedCounts`) drive interactive overlays
   and are **never persisted**; `resetFog` clears them all.
4. **Calibration:** writes `hq_calibration` keyed by tileset; `BoardGrid`/overlays read it via
   `useMapTransform` to position piece images over arbitrary board art.

---

## Architectural Strengths

1. **Pure logic is rigorously separated from rendering.** Reveal, geometry, placement, markers,
   navigation guards, and storage are plain modules with their own exhaustive unit tests. This is the
   backbone of the project's 567-test safety net and makes the hardest logic (corridor ray-casting,
   trap state machine) verifiable without a DOM.
2. **One well-contained state hook.** `useGameState` centralises game/session state and uses
   `useLatest`-style refs to keep handlers stable with empty dependency arrays — avoiding a sprawl of
   `useEffect` dependencies and stale-closure bugs.
3. **Deliberate, documented constraints.** Hardcoded board, no `null` wall cells, non-normalised
   rotation, `key={quest.id}` remount — each is intentional and recorded in CLAUDE.md, which keeps the
   reveal/geometry code simple.
4. **Feature-folder colocation.** Tests sit next to the code they cover; features are self-contained;
   `shared/` holds genuinely cross-cutting concerns. Matches the project's own
   `react-project-organization` skill.
5. **Clean persistence boundary (mostly).** `questStorage.js` wraps all reads in try/catch returning
   safe defaults; fog is intentionally non-persistent; import validates required fields.
6. **Modern, current toolchain** with no legacy baggage (React 19, Vite 7, Vitest 4, ESLint 9 flat).
7. **No dangerous patterns** — no `eval`, no `dangerouslySetInnerHTML`, no ad-hoc network calls.

---

## Architectural Weaknesses

1. **God-hook and God-components.** `useGameState` (625), `GameScreen` (616), `QuestLibrary` (698),
   `MapCalibrator` (817) concentrate many responsibilities. Every new play-mode interaction has been
   bolted onto `useGameState`, growing its surface (multiple session Sets, parallel handler families
   for traps/chests/secret-doors/search). Future growth raises merge-conflict and comprehension cost.
2. **Inline-styles-everywhere makes large components noisy and styles non-reusable.** Repeated style
   objects (e.g. `zoomBtnStyle`) are hand-hoisted; most are inline literals inside JSX, hurting
   readability and consistency. The constraint is deliberate, but the cost compounds with component
   size.
3. **Storage knowledge leaks** out of `questStorage.js` (`Sidebar`, `BoardGrid`). No single source of
   truth for every `localStorage` key.
4. **No error boundary.** A render-time exception in any overlay/dialog takes down the whole app with no
   recovery UI — notable for a tool used live mid-game.
5. **No quota / large-payload handling.** Cover images are stored as data URLs in `localStorage`;
   `saveQuests`/`setItem` are unguarded against `QuotaExceededError`.
6. **Test environment default is `node`** with 17 per-file jsdom opt-ins — easy to forget, fragile for
   new component tests.
7. **Session-state model is implicit.** Play-mode state is spread across ~6 separate `Set`s in
   `useGameState`; the relationships (e.g. "sprung + removeAfterSpring hides the token") are encoded in
   helpers but there is no single typed model — workable, but it is the area most likely to grow
   inconsistent.
8. **Single 317 KB JS bundle, no code splitting.** `MapCalibrator` (the largest module, used rarely)
   and the whole library/game tree ship together. Fine for a localhost/tablet tool; suboptimal if ever
   deployed for first-load on mobile data.

---

## Recommended Improvements

### Quick Wins (< 1 day)
- **Repair the QA/CI plumbing.** Point `package.json` `test:qa*` scripts and
  `.github/workflows/nightly-qa.yml` at the real files in `e2e/` (`e2e/test.mjs`, `e2e/calibration.cjs`,
  …). This restores the only automated end-to-end coverage. *(Highest value-to-effort in the repo.)*
- **Clear the lint wall** (52 errors): remove unused vars, fix `no-undef`, move exported pure helpers
  out of component files (or relax `react-refresh/only-export-components` for util modules), and
  address the 4 `exhaustive-deps` warnings deliberately. Then make `npm run lint` a gate.
- **Refresh architecture docs** to post-refactor paths (`src/shared/*`, `GameScreen.jsx`) and correct
  the test count in CLAUDE.md.
- **Centralise storage keys.** Route `Sidebar`/`BoardGrid` `localStorage` access through
  `questStorage.js`; export the key constants.
- **Untrack `qa_screenshots/`** and add it to `.gitignore` (mirror the existing `qa-screenshots/` rule).
- **Add an `ErrorBoundary`** around the screen router with a simple "something went wrong — reload"
  fallback.
- **Guard `localStorage.setItem`** with try/catch and a user-visible "storage full" message.

### Medium Effort (1–3 days)
- **Flip Vitest default to `jsdom`** (or use Vitest projects to split node-pure vs. component suites) so
  component tests don't depend on per-file annotations.
- **Extract play-mode session state from `useGameState`** into a focused `useSessionState` (traps,
  chests, secret doors, search) hook, leaving `useGameState` to compose them. Tests already isolate the
  pure helpers, so this is low-risk.
- **Decompose `QuestLibrary`** into `BookSidebar`, `QuestShowcase`, `ThumbnailStrip`, and the
  import/export controls.
- **Add push/PR CI** (lint + unit tests + build) so quality gates run on every change, not just nightly.
- **Document the full data model** (all Quest/Book fields, session sets, calibration shape, import/export)
  and add acceptance-criteria to the data-model doc.

### Significant Work (> 3 days)
- **Decompose `MapCalibrator`** (817 lines) into transform math (already partly pure) + a thin UI shell,
  with the math fully unit-tested independent of the canvas/DOM.
- **Introduce a single typed session-state model** (even as JSDoc typedefs) describing every interactive
  piece state and its derived render mode, replacing the parallel `Set`s — reduces the risk that a new
  interaction type drifts out of sync with `resetFog`/`isSessionDirty`.
- **Consider migrating to TypeScript** incrementally (start with `shared/` pure modules). The codebase
  is large enough and the data shapes intricate enough (PlacedPiece variants, session state) that types
  would catch a meaningful class of bugs the tests currently shoulder alone.
- **Code-split the calibration and (optionally) library routes** via dynamic `import()` if the app is
  ever deployed for cold first-load on mobile.

---

## Verdict
The architecture is **sound and worth continuing.** Its core idea — pure, tested logic modules behind a
single state hook and thin React views — is exactly right for this problem and is the reason the project
is in good shape after a month idle. The weaknesses are growth-related (large files) and operational
(broken CI, red lint, stale docs), not foundational. No re-architecture is warranted; targeted
decomposition and the quick-win cleanups will keep it healthy.
