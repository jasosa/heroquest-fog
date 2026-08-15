# Project Health Report — HeroQuest Fog of War

_Assessment date: 2026-05-30. Branch: `main` (clean). Last commit: 2026-04-30 (~1 month inactive)._

> **Superseded 2026-07-13:** the P1–P3 findings below (broken QA script paths, stale architecture
> docs, red lint) were fixed in commits `80c8440`, `f2fe657`, and `60bdf86`. Lint is now clean (0
> errors) and QA scripts are repointed to `e2e/*`. Treat this report as a historical snapshot, not a
> current problem list — remaining open items are tracked in `restart-roadmap.md`.

This report is based on a full read of the repository: source, tests, docs, CLAUDE.md, agent
definitions, skills, backlog, CI, and build/lint/test runs. No code was modified.

---

## Executive Summary

**What this project is.** A browser-only companion app for the physical board game **HeroQuest**.
It renders the fixed 26×19 HeroQuest board, lets a user set up a quest in *edit mode* (place
monsters, traps, furniture, doors, markers) and then run it in *play mode*, manually revealing a
"fog of war" cell-by-cell as heroes explore. Quests are organised into "quest books" and persisted
to `localStorage`. There is no backend, no accounts, and no rule enforcement — it replaces the need
for a dedicated overlord/Zargon player in solo/co-op play. Reference UX is *Journeys in Middle-earth*,
deliberately simpler.

**Stack.** React 19 + Vite 7, JavaScript (no TypeScript), Vitest + Testing Library for unit tests,
Playwright scripts for end-to-end/QA, all-inline styling (no CSS files; Bootstrap is a dependency but
the app is theme-token driven via `T` in `src/shared/theme.js`).

**Current maturity:** **Mid-stage, feature-rich prototype.** ~11,000 lines of source across a clean
feature-folder structure, 567 passing unit tests across 30 files, a working production build, and a
substantial completed backlog (38 features + 16 issues, most done). This is well beyond a toy; it is a
genuinely usable app with deep gameplay logic (fog reveal across wide corridors, trap interaction
flows, secret doors, chests, calibration).

**Overall health: GOOD with notable rot at the edges (≈ 7/10).** The *core* is healthy — tests pass,
build is green, architecture is coherent. The *periphery* has decayed during inactivity and a folder
refactor: lint is red (52 errors), the documented QA scripts and the nightly CI workflow point at files
that no longer exist, and several docs/backlog entries describe a pre-refactor layout.

**Readiness for continued development: HIGH, after a short stabilization pass.** Nothing here is
structurally broken. A focused 1–2 day cleanup (fix lint, repair the QA script/CI paths, refresh the
architecture docs and CLAUDE.md counts, reconcile the backlog) restores a trustworthy baseline, after
which feature work can resume immediately. No rewrite is warranted.

---

## Project Overview

### Main purpose
A digital fog-of-war + quest-setup companion played *alongside* the physical HeroQuest board, on a
tablet/laptop, by a solo or co-op group with no dedicated dungeon master.

### Primary user workflows
1. **Library management** — create quest books, create/edit/delete quests, assign quest order,
   import/export a quest as JSON, browse a cinematic showcase card per quest.
2. **Edit mode** — place/remove/rotate pieces (monsters, traps, furniture, doors, markers, hero
   starts), author per-piece config (trap spring messages, chest traps, secret-door links, search
   notes, special-monster notes, hero placement message), pick a board tileset.
3. **Play mode** — click cells to reveal fog (flood-fill in rooms, multi-lane ray casting in
   corridors), interact with traps (Spring/Reveal/Disarm), open chests, search rooms and for secret
   doors, read markers. Fog is permanent per session and never saved.
4. **Calibration** — `MapCalibrator` maps board-image pixels to logical grid coordinates via
   affine/homography transforms so piece overlays line up with different board artwork.

### Key features
Fog of war with wide-corridor detection · trap interaction system (spring/reveal/disarm, per-type
configurable, session-only state) · chests with hidden traps · secret doors with search markers ·
room search notes with counts · special monsters · doors as edge overlays · hero start auto-reveal ·
quest books + ordering · JSON import/export · multi-tileset board art with calibration · collapsible
sidebar · zoom · dark-fantasy themed UI.

### Current architectural approach
- **Single-page React app, no router.** Root `App` → `GameScreen`, which switches between three
  screens (`library`, `game`, `calibration`) by local state, remounting on quest change via
  `key={quest.id}`.
- **Custom state hook** `useGameState` centralises all game/session state and exposes a large set of
  pure helpers + handlers; uses `useLatest`-style refs to avoid stale closures with empty dependency
  arrays.
- **Pure logic separated from components** — reveal, piece geometry, placement mutations, search/secret
  markers, navigation guards, and storage are plain modules, each independently unit-tested.
- **Feature-folder layout** under `src/features/{board,calibration,game,library,sidebar}` plus
  `src/shared/` for cross-cutting modules (`map`, `theme`, `pieces`, `reveal`, `pieceGeometry`,
  `questStorage`, `questSort`).
- **Persistence** is `localStorage`-only via `questStorage.js`; fog/session state is intentionally
  never persisted.

### Major components & responsibilities
| Component / module | Lines | Responsibility |
|---|---|---|
| `MapCalibrator.jsx` | 817 | Pixel↔grid calibration UI + transform math |
| `QuestLibrary.jsx` | 698 | Library screen: books, quest cards/showcase, import/export |
| `useGameState.js` | 625 | All game + session state, handlers, pure helpers |
| `GameScreen.jsx` | 616 | Screen routing, board area, modal orchestration |
| `TokenOverlay.jsx` | 375 | Renders placed pieces & their play-mode interactive states |
| `BoardGrid.jsx` | 193 | Grid cells, fog rendering, calibration read |
| `reveal.js` | 112 | Fog reveal algorithm (room flood-fill, corridor ray casting) |
| `questStorage.js` | 154 | localStorage CRUD, migration, JSON import/export |
| `pieces.js` / `placementState.js` | 82 / 185 | Piece catalogue / immutable placement mutations |

---

## Codebase Assessment

### Architecture quality — **Good**
Clear separation of pure logic from rendering, feature-folder colocation, a single well-contained
state hook, and a hardcoded-board constraint that keeps reveal logic tractable. The decision to keep
reveal/geometry/placement as pure, separately-tested modules is the strongest architectural choice in
the project and is the main reason the test suite is meaningful.

> **Issue — God-hook / God-component size.** `useGameState.js` (625), `GameScreen.jsx` (616),
> `QuestLibrary.jsx` (698) and `MapCalibrator.jsx` (817) are large and accrete responsibilities.
> **Severity:** Low–Medium. **Impact:** Harder onboarding and merge conflicts; the project's own
> `react-project-organization` skill flags `structure-component-size`. **Action:** Opportunistically
> extract (e.g. trap-session logic, chest logic, and library showcase into sub-hooks/components) when
> next touching them — not an urgent rewrite.

> **Issue — `localStorage` access leaks out of the storage layer.** `Sidebar.jsx` (sidebar-collapsed
> flag) and `BoardGrid.jsx` (calibration read) touch `localStorage`/storage keys directly instead of
> going through `questStorage.js`. **Severity:** Low. **Impact:** Storage schema knowledge is
> scattered. **Action:** Route all persistence through `questStorage.js`.

### Maintainability — **Good**
Consistent naming, theme tokens centralised in `T`, no `dangerouslySetInnerHTML`/`eval`, zero
`TODO/FIXME/HACK` markers, and no stray `console.*` in non-test source. Inline-styles-everywhere is a
deliberate constraint but makes large components visually noisy and styles non-reusable.

### Testability — **Excellent**
567 unit tests across 30 files, all green. Pure modules are exhaustively covered (`useGameState` alone
has 97 tests; reveal, placement, markers, calibration, storage all have dedicated suites). TDD is
enforced by CLAUDE.md and visibly practiced. This is the project's standout strength.

> **Issue — Test environment is fragile.** `vite.config.js` sets `test.environment: 'node'`, and 17
> component test files opt into jsdom via per-file `@vitest-environment jsdom` annotations. **Severity:**
> Low. **Impact:** A new component test that forgets the annotation fails confusingly. **Action:**
> Consider flipping the default to `jsdom` (or split projects) so the common case "just works".

### Complexity — **Moderate, well-contained**
The genuinely complex logic (corridor ray-casting with wide-corridor detection, calibration transforms,
the trap state machine) is isolated and tested. Complexity is concentrated where it belongs.

### Technical debt — **Moderate, mostly cosmetic/process debt, not logic debt**
- **Lint is red: 52 errors + 4 warnings** (15 `no-unused-vars`, 6 `no-undef`, 5
  `react-refresh/only-export-components`, 4 `react-hooks/exhaustive-deps`, plus `react-hooks/purity`
  warnings on `Date.now()` calls in render). **Severity:** Medium. **Impact:** No enforceable quality
  gate; real bugs (`no-undef`, exhaustive-deps) can hide among the noise. **Action:** Triage and fix;
  then make lint blocking.
- **Mixing of exported pure helpers with React components** in the same files trips
  `react-refresh/only-export-components` (e.g. helpers exported from `useGameState.js`/component files).
  Low severity but contributes to the lint wall.
- **27 QA screenshot PNGs are committed** under `qa_screenshots/` (underscore). `.gitignore` only
  ignores `qa-screenshots/` (hyphen), so the underscore variant is tracked. **Severity:** Low.
  **Impact:** Repo bloat, noisy diffs. **Action:** Add `qa_screenshots/` to `.gitignore` and untrack.

### Dependency health — **Very good**
Modern and current: React 19.2, Vite 7.3, Vitest 4, ESLint 9 (flat config), Playwright 1.58. No
deprecated or abandoned packages; dependency surface is small (runtime deps: react, react-dom,
bootstrap). **No `package-lock` red flags observed.** Bootstrap is a heavyweight dependency that
inflates the CSS bundle (232 KB raw / 31 KB gzip) for what is largely an inline-styled app — worth
auditing whether it's actually used.

### Security concerns — **Low surface**
Browser-only, no backend, no auth, no secrets, no network calls except Google Fonts CDN. No
`dangerouslySetInnerHTML`, `eval`, or dynamic `fetch`. The one input-trust boundary is
`importQuestFromJson`, which validates required fields and is wrapped in try/catch at call sites.
- **Minor:** Imported quest JSON and base64 `coverImage` data URLs are stored verbatim in
  `localStorage`; a large cover image could approach the ~5 MB quota and there is no quota-exceeded
  handling. **Severity:** Low. **Action:** Cap/encode cover images and guard `setItem` with try/catch.

### Documentation quality — **Good intent, materially stale**
The architecture docs (`docs/architecture/*`), two development journals, and a detailed backlog are
genuinely valuable and above-average for a hobby project. But several documents describe a
**pre-refactor world** and are now misleading (see Risk Assessment and the backlog reconciliation
report). **Severity:** Medium — stale docs actively mislead a returning developer or AI agent.

---

## Development Workflow Assessment (AI-assisted)

The project is built around a Claude Code multi-agent pipeline documented in `CLAUDE.md`:
`architect (if high complexity) → ux → planner → swe`, with a strict Red/Green/Refactor TDD rule, a
branch-per-item convention, and "never merge to main — the user merges manually."

### What remains valuable
- **Strict TDD rule** — demonstrably produced the 567-test safety net. Keep.
- **Branch-per-item + manual-merge discipline** — clean history, both feature branches were merged
  without leaving cruft. Keep.
- **Backlog-driven "pick highest-priority not_started" loop** — gives agents an unambiguous next action.
  Keep (after reconciliation).
- **The four agent roles** (architect/ux/planner/swe) are well-scoped and their prompts are crisp.

### What is redundant
- **CLAUDE.md contains two near-identical workflow blocks** ("work on the next item" and "work on a
  concrete item") differing by one step. This is duplication that will drift. Collapse to one
  parameterised list.
- **Overlapping UX surfaces:** a `ux` *agent* (`.claude/agents/ux.md`), a `ux-agent` *command*
  (`.claude/commands/ux-agent.md`), and a `ux-agent` *skill* all cover UX review. Same for QA
  (`qa-agent` command + skill). Consolidate.
- **Skill duplication on disk:** `designing-beautiful-websites` exists in **both** `.claude/skills/`
  and `.agents/skills/` (full copies incl. references/scripts). One should be the source of truth.

### What reflects outdated practices / is over-built for this project
- **`react-best-practices` skill ships ~60 micro-rule files**, many of which are
  Next.js/server-specific (`async-api-routes`, `server-cache-lru`, `server-parallel-fetching`,
  `server-serialization`, `rendering-hydration-no-flicker`). This app is a **client-only Vite SPA with
  no server and no SSR** — those rules are inapplicable and dilute the signal. Prune to the client/JS
  subset.
- **Worktree-isolation `swe` flow** (documented in the 2026-03-28 journal) added real friction
  (uncommitted worktrees, a three-way `Backlog.md` merge conflict). With modern agents this ceremony
  is largely unnecessary for a single-developer repo.

### Specifically identified
- **Overlapping agents:** `planner` and `architect` overlap on "read the codebase and recommend";
  acceptable because outputs differ (options vs. step plan), but the boundary is thin. The bigger
  overlap is the **triple UX surface** above.
- **Unused / low-value skills:** the server/Next.js half of `react-best-practices`; `bootstrap` skill
  vs. minimal actual Bootstrap usage; duplicated `designing-beautiful-websites`.
- **Excessively large instructions:** CLAUDE.md's duplicated workflow; the 60-file rule skill.
- **Missing validation workflows:** **lint is not a gate** (and currently fails); there is **no
  push/PR CI** — the only automation is a nightly QA workflow that is **itself broken** (it runs
  `node qa-test.mjs` and five sibling scripts that **do not exist at the repo root** — they live in
  `e2e/` under different names). So in practice there is *no working CI at all.*
- **Missing project memory:** no persisted decision log beyond two journals (which stop at 2026-03-30,
  while work continued to 2026-04-30). The harness memory directory is empty for this project.
- **Missing acceptance criteria:** only a few backlog items (e.g. FEAT-022) carry explicit acceptance
  criteria; most are prose. No template.
- **Missing automated quality gates:** no enforced lint, no coverage threshold, no
  build-on-PR, no test-on-PR.

---

## Risk Assessment

Ranked by priority (P1 = address first).

| # | Risk | Type | Severity | Why it matters |
|---|---|---|---|---|
| **P1** | **CI/QA is silently broken** — `package.json` `test:qa*` scripts and `.github/workflows/nightly-qa.yml` invoke `qa-test.mjs`, `qa-calibration.cjs`, etc. at repo root; those files were moved/renamed into `e2e/`. Every nightly run fails at "file not found." | AI workflow / Maintenance | High | The team *believes* it has nightly E2E coverage; it has none. False confidence. |
| **P2** | **Stale architecture docs & CLAUDE.md** — docs point to `src/map.js`, `src/reveal.js`, `src/pieces.js`, `src/questStorage.js`, and `heroquest-fog.jsx`, none of which exist post-refactor (now under `src/shared/` and `GameScreen.jsx`). CLAUDE.md claims "117 tests across 5 suites"; reality is 567 across 30. | Maintenance / AI workflow | High | A returning dev or agent will follow wrong paths and wrong assumptions, eroding trust in all docs. |
| **P3** | **Lint red (52 errors)** with no gate. Includes real `no-undef` and `exhaustive-deps` findings buried in noise. | Maintenance | Medium | Genuine bugs can hide; quality gate is unenforceable until clean. |
| **P4** | **Backlog drift** — FEAT-037 marked `done` but left under "Not Started" and never moved to `Backlog_Done.md`; `done` vs `committed` vocabulary inconsistent between CLAUDE.md and journals; FEAT-026 and ISSUE-008 referenced elsewhere but absent from the backlog; calibration & JSON import/export implemented but never tracked. | Product / Process | Medium | The "pick highest-priority not_started" loop operates on an inaccurate map. |
| **P5** | **Knowledge gap from inactivity** — journals end 2026-03-30 but 30+ commits landed through 2026-04-30 (calibration polish, tilesets, library redesign, chest/trap simplification) with no journal entries. | Maintenance | Medium | The most recent month of decisions is undocumented. |
| **P6** | **Over-built AI tooling** — 60-file rule skill (half irrelevant), duplicated skills, triple UX surface. | AI workflow | Low | Slows agents, dilutes guidance, increases context cost. |
| **P7** | **God-hook/God-components** growth. | Architectural | Low | Future merge friction; flagged by the project's own org skill. |
| **P8** | **No undo for fog reveal / no localStorage quota handling.** | Product | Low | Known product gaps; undo is the #1 criticised feature across competitor apps (per the ux-agent brief). |

---

## Bottom line
Continue the codebase. It is healthy at the core, exceptionally well-tested, and built on a current
stack. The work needed is **stabilization and bookkeeping**, not redesign: repair the broken CI/QA
plumbing, clear the lint wall, refresh the docs to the post-refactor reality, and reconcile the
backlog. See `restart-roadmap.md` for the phased plan.
