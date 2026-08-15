# Restart Roadmap — HeroQuest Fog of War

_Assessment date: 2026-05-30. Project idle ~1 month (last commit 2026-04-30). Working tree clean,
both feature branches merged to `main`._

> **Superseded 2026-07-13:** Immediate Actions 1 (QA script paths), 2 (lint), 4 (stale docs), and 5
> (backlog reconciliation) below have been completed. Remaining open items: the visual QA pass, the
> Quick Wins list, and the Recommended Next Features ranking (still valid as of this update).

A practical plan to resume development from a trustworthy baseline. Effort estimates assume one
developer (or one developer + Claude Code).

---

## Immediate Actions (before any new feature work)

These restore a reliable, green baseline. Target: **~1–2 days total.**

1. **Repair the QA scripts & nightly CI** (P1). `package.json` `test:qa*` and
   `.github/workflows/nightly-qa.yml` point at root files (`qa-test.mjs`, `qa-calibration.cjs`, …) that
   now live in `e2e/` with different names. Repoint them (or add root shims). _≈1–2 h._ Verify one QA
   suite actually runs.
2. **Clear the lint wall** (P3). Fix the 52 errors (15 unused-vars, 6 `no-undef`, 5
   `react-refresh/only-export-components`, 4 `exhaustive-deps`) + 4 warnings. Treat `no-undef` and
   `exhaustive-deps` as potential real bugs, not just noise. _≈3–4 h._
3. **Add a push/PR CI gate**: `npm ci → lint → test → build`. Make lint blocking once green. _≈1 h._
4. **Refresh stale docs** so an agent can trust them: correct `architecture/board.md`, `reveal.md`,
   `pieces.md`, `data-model.md` paths (`src/shared/*`, `GameScreen.jsx`), fix CLAUDE.md's "117 tests"
   → "567 tests / 30 files", and expand `data-model.md` to the real Quest/Book schema (incl.
   `questNumber`, `placementMessage`, `searchMarkers`, `searchNotes`, `secretDoorMarkers`,
   `coverImage`, import/export). _≈3–4 h._
5. **Reconcile the backlog** (see `backlog-reconciliation-report.md`): move FEAT-037 to Done, renumber
   the duplicate ISSUE-010, de-dup FEAT-018/019 blocks, add retroactive Done entries for Calibration /
   JSON Import-Export / Multi-tileset, and resolve FEAT-026 + ISSUE-008. _≈1–2 h._
6. **Backfill the missing journal month** (2026-03-31 → 2026-04-30) from git history so no decisions
   are lost. _≈1 h._

**Exit criteria:** `npm run lint` clean, `npm test` green (567+), `npm run build` green, at least one
QA suite executing in CI, docs paths accurate, backlog internally consistent.

---

## High-Value Quick Wins (each < ½ day, high ROI)

- **Untrack `qa_screenshots/`** and add to `.gitignore` (removes 27 committed PNG artifacts). _15 min._
- **Add an `ErrorBoundary`** around the screen router with a reload fallback — cheap resilience for a
  live mid-game tool. _≈2 h._
- **Guard `localStorage.setItem`** against `QuotaExceededError` with a user-visible message (cover-image
  data URLs can fill the quota). _≈1–2 h._
- **Centralise storage keys** — route `Sidebar`/`BoardGrid` `localStorage` access through
  `questStorage.js`. _≈2 h._
- **Replace the stock-template `README.md`** with a real one (what the app is, how to run, where docs
  live). _≈1 h._
- **De-duplicate the on-disk skills** (`designing-beautiful-websites` exists in two trees) and prune the
  SSR-only half of `react-best-practices`. _≈2 h._ (See `ai-workflow-modernization.md`.)

---

## Recommended Next Features (ranked by value ÷ effort)

| Rank | Item | Value | Effort | Notes |
|---|---|---|---|---|
| 1 | **FEAT-039** Monster name tooltip in Play mode | Medium | Low | Tooltip infra already exists (letter markers, special monsters) — mostly wiring. |
| 2 | **FEAT-016 + FEAT-014** Search/secret-door exhausted state + count badge | Medium | Low | `searchedCounts`/`SEARCH_MAX` backend already implemented; only UI remains. Plan together. |
| 3 | **FEAT-036** Pointer-based pan after zoom (remove scrollbars) | Medium | Medium | Real mobile/tablet pain point — primary use case is touch. Zoom already exists. |
| 4 | **FEAT-017** Hero Placement Popup re-appears on fog reset | Low | Low | One-line-ish reset in `resetFog`. |
| 5 | **ISSUE-005** RoomConfirmDialog backdrop dismiss | Low | Low | Consistency with every other dialog. |
| 6 | **UI consistency batch** FEAT-027/030/032/033/034/035/038 | Medium | Medium | First run a visual QA pass to confirm which are already done; then knock out the rest together. |
| 7 | **Undo for fog reveal** (not in backlog) | High | Medium | The single most-criticised gap across competitor apps per the `ux-agent` brief — strong product value. Consider adding. |

---

## Technical Debt Priorities (ranked by urgency)

1. **Broken CI/QA plumbing** — urgent; you currently have *no working automation*. (Immediate Action 1.)
2. **Red lint / no quality gate** — urgent; blocks trustworthy automation. (Immediate Action 2–3.)
3. **Stale docs & backlog** — high; actively mislead humans and agents. (Immediate Actions 4–5.)
4. **No error boundary / no quota handling** — medium; affects live reliability. (Quick Wins.)
5. **God-hook / God-components** (`useGameState`, `GameScreen`, `QuestLibrary`, `MapCalibrator`) —
   medium; address opportunistically when next touching them (extract `useSessionState`, split
   `QuestLibrary`).
6. **Test env default `node` + per-file jsdom annotations** — low; flip default when convenient.
7. **Storage-key leakage / inline-style sprawl / single bundle** — low; nice-to-have.

---

## Suggested Development Order (phased)

### Phase 1 — Stabilization (~1–2 days)
All **Immediate Actions**. Result: green lint, green tests, working CI, accurate docs and backlog.
Nothing new is built until this baseline holds.

### Phase 2 — Modernization (~2–3 days)
- AI-workflow cleanup: consolidate `CLAUDE.md`, prune/ de-dup skills, collapse triple-UX/double-QA
  surfaces, drop mandatory worktree isolation, adopt project memory + acceptance-criteria template
  (see `ai-workflow-modernization.md`).
- Codebase resilience quick wins: `ErrorBoundary`, quota guard, centralised storage keys, real README.
- Flip Vitest default to `jsdom`.

### Phase 3 — Feature Development (ongoing)
Work the ranked feature list (FEAT-039 → FEAT-016/014 → FEAT-036 → …), each with acceptance criteria
and TDD. Run the visual-QA pass early to settle the "cannot determine" UI items. Strongly consider
**fog-reveal undo** as a high-value product addition.

### Phase 4 — Long-Term Improvements (as the app grows)
- Extract `useSessionState` from `useGameState`; decompose `QuestLibrary` and `MapCalibrator`.
- Introduce a single typed session-state model (JSDoc typedefs or incremental **TypeScript**, starting
  with `shared/`).
- Consider code-splitting calibration/library if the app is ever deployed for cold mobile first-load.
- Audit whether Bootstrap is actually needed (large CSS payload for an inline-styled app).

---

# Questions for the Original Author

### Undocumented decisions
1. **What was FEAT-026?** A `git merge feat/FEAT-026` permission exists in
   `.claude/settings.local.json`, but the item appears in no backlog file or journal. What did it do,
   and did it land?
2. **What happened to ISSUE-008** ("empty note marker gives no feedback in play mode")? It's discussed
   in the 2026-03-30 journal as a remaining item but never made it into `Backlog.md`. Done, dropped, or
   forgotten?
3. **Why did the worktree-isolation `swe` flow get adopted, and is it still wanted?** It caused a
   three-way `Backlog.md` merge conflict (per the 2026-03-28 journal). Keep, or simplify?
4. **What was done in April (2026-03-31 → 04-30)?** ~30 commits (calibration, tilesets, library
   redesign, chest/trap simplification) have no journal entry. Anything load-bearing or risky there?

### Assumptions embedded in the code
5. **Board is hardcoded 26×19 with two double-wide corridor sections.** Is supporting *other* HeroQuest
   maps / expansions a future goal, or is single-board permanent? (Calibration + multi-tileset hint at
   ambitions here.)
6. **Fog is never persisted (resets every load).** Intentional forever, or a candidate for opt-in
   save/resume of a session?
7. **Session state is spread across ~6 separate `Set`s** in `useGameState`. Was a unified model
   considered and rejected, or just not reached yet?
8. **Calibration stores anchors per tileset in `localStorage`.** Are end users expected to calibrate, or
   is this a developer/setup-only tool? It's the largest file but has no user-facing backlog item.

### Areas where intent is unclear
9. **Bootstrap is a dependency but the app is inline-styled** — is Bootstrap actually used anywhere, or
   leftover scaffolding?
10. **JSON import/export exists but is undocumented** — is this a shipped user feature or an internal
    convenience? Should it be in the UX/backlog?
11. **`done` vs `committed` status** — the journals say "never mark done, use committed"; CLAUDE.md and
    the current backlog say `done`. Which is the intended final state?

### Product decisions that appear incomplete
12. **No undo for fog reveal** — known gap and the top competitor criticism. Deliberate omission or
    just not built yet?
13. **FEAT-016/014 "exhausted" UI** — the search-count backend is built but unused in the UI. Was the
    visual treatment deferred intentionally?
14. **Multiple board tilesets (board/board2/board3/board4)** — which is the canonical default, and is
    user-selectable tileset a shipped feature or experimental?

---

# Final Assessment

**Is continuing the current codebase advisable?** **Yes, clearly.** The core is healthy: 567 passing
tests, a green production build, a coherent pure-logic-behind-a-state-hook architecture, and a modern,
current toolchain. The problems are operational and cosmetic (broken CI plumbing, red lint, stale
docs/backlog), not structural. A 1–2 day stabilization pass restores full confidence.

**Is significant refactoring advisable?** **No — only targeted decomposition.** Four files are oversized
(`useGameState`, `GameScreen`, `QuestLibrary`, `MapCalibrator`) and should be split opportunistically,
but there is no architectural flaw forcing a broad refactor. The pure-module/test-first design is a
genuine asset to preserve.

**Is a partial rewrite advisable?** **No.** Nothing in the repo justifies discarding working,
well-tested code. The most "rewrite-like" move worth considering is an *incremental* TypeScript adoption
starting with `shared/` — additive, not a rewrite.

**Confidence level:** **High** for the code/tests/build/architecture conclusions (directly verified:
tests run, build runs, lint run, files read). **Medium** for the 8 "cannot determine" UI backlog items
(need a visual QA pass) and for the April decisions (undocumented). The Questions for the Original
Author target exactly these gaps.

## Top 10 Recommended Next Actions
1. **Repair the QA scripts + nightly CI paths** (point to `e2e/*`) — restores all automation. _(P1)_
2. **Fix the 52 lint errors**, then make `npm run lint` a blocking gate.
3. **Add push/PR CI**: `npm ci → lint → test → build`.
4. **Update architecture docs + CLAUDE.md** to post-refactor paths and the real test count (567/30).
5. **Reconcile the backlog** (move FEAT-037 to Done, fix duplicate ISSUE-010, add untracked
   Calibration / Import-Export / Multi-tileset, resolve FEAT-026 & ISSUE-008).
6. **Backfill the April journal** from git history.
7. **Untrack `qa_screenshots/`; add `ErrorBoundary` and a `localStorage` quota guard.**
8. **Slim the AI tooling**: de-dup skills, prune SSR-only react rules, collapse the triple-UX/double-QA
   surfaces, merge the two `CLAUDE.md` workflows.
9. **Run a visual QA pass** to classify the 8 "cannot determine" UI backlog items, then ship the
   cheap-and-ready features (FEAT-039, FEAT-016/014).
10. **Get answers to the Questions for the Original Author** (esp. FEAT-026, ISSUE-008, the April work,
    and the undo decision) before committing to a feature direction.
