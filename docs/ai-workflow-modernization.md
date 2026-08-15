# AI Workflow Modernization

_Assessment date: 2026-05-30. Evaluates the project's AI-assisted development setup against current
agentic best practices._

> **Status as of 2026-07-13:** the code/docs/QA findings from the companion reports were fixed (see
> `project-health-report.md`). The recommendations in this document (agent/skill dedup, CLAUDE.md
> workflow-block duplication) had not been addressed as of that date — still open.

## What exists today

- **`CLAUDE.md`** (~5 KB): commands, architecture pointers (`@docs/architecture/*`), a strict
  Red/Green/Refactor TDD rule, key constraints, a branch-/permission model, and **two near-duplicate
  "workflow" procedures** (one for "the next item", one for "a concrete item").
- **Four agents** (`.claude/agents/`): `architect`, `ux`, `planner`, `swe` — a linear pipeline.
- **Two commands** (`.claude/commands/`): `qa-agent`, `ux-agent` (also surfaced as skills).
- **Skills**: `react-best-practices` (~60 rule files), `react-project-organization` (~6 rules),
  `designing-beautiful-websites` (**duplicated** in `.claude/skills/` *and* `.agents/skills/`),
  `bootstrap` (`.agents/skills/`). A `skills-lock.json` pins two GitHub-sourced skills.
- **CI**: a single nightly Playwright QA workflow (currently broken — see below).

The setup is unusually mature for a hobby project and the TDD discipline clearly paid off (567 tests).
The opportunities below are about **trimming ceremony designed around older/weaker models** and
**adding the validation gates that are actually missing.**

---

## Recommendation 1 — Consolidate `CLAUDE.md` and remove duplicate workflows
- **Problem.** Two almost identical numbered workflows (12–13 steps each) differ only in the first step.
  Duplication invites drift; one was already partially out of sync (status `done` vs the journals'
  `committed`). The "117 tests across 5 suites" claim is wrong (now 567/30).
- **Expected benefit.** One source of truth; less context per agent turn; no contradictory guidance.
- **Effort.** ~1 hour.
- **Approach.** Collapse to a single parameterised workflow ("given an item — picked or named — do
  X…Y"). Fix the test-count line. Make the status vocabulary one word (`done`). Move the long workflow
  prose into a short checklist and link the detail.

## Recommendation 2 — Fix the (silently broken) validation pipeline
- **Problem.** `package.json` `test:qa*` scripts and `nightly-qa.yml` invoke root files
  (`qa-test.mjs`, `qa-calibration.cjs`, …) that **no longer exist** — they were moved to `e2e/` under
  new names. So the only CI runs `node qa-test.mjs` → file-not-found every night. There is **no
  push/PR CI at all**, and **lint is not a gate** (and currently fails with 52 errors).
- **Expected benefit.** Restores real automated coverage and creates the missing quality gates — the
  single biggest reliability win available.
- **Effort.** 0.5–1 day.
- **Approach.**
  1. Repoint the scripts/workflow to `e2e/*` files (or add thin root re-export shims).
  2. Add a **PR/push CI workflow**: `npm ci` → `npm run lint` → `npm test` → `npm run build`.
  3. Clear the lint errors first, then set lint to blocking.
  4. Keep the nightly Playwright job, but only after its paths are fixed.

## Recommendation 3 — Restructure agents (reduce the triple UX surface)
- **Problem.** UX guidance exists in **three** places — the `ux` agent, the `ux-agent` command, and the
  `ux-agent` skill — and QA in two (`qa-agent` command + skill). Overlap forces a choice each time and
  risks divergent advice. `architect` and `planner` also overlap on "read the codebase and recommend"
  (acceptable, since outputs differ).
- **Expected benefit.** One canonical agent per role; clearer routing; less duplicated maintenance.
- **Effort.** ~half a day.
- **Approach.** Keep the four core agents (architect/ux/planner/swe). Demote the `ux-agent`/`qa-agent`
  *commands* to thin entry points that just invoke the corresponding agent, or delete them in favour of
  the agents. Keep exactly one UX surface and one QA surface.

## Recommendation 4 — Prune the `react-best-practices` skill to what applies
- **Problem.** ~60 micro-rule files, of which a large fraction are **Next.js/server/SSR-specific**
  (`async-api-routes`, `server-cache-lru`, `server-parallel-fetching`, `server-serialization`,
  `server-after-nonblocking`, `rendering-hydration-no-flicker`, `client-swr-dedup`). This is a
  **client-only Vite SPA with no server and no SSR** — those rules are inapplicable and dilute the
  signal an agent must read.
- **Expected benefit.** Lower context cost, higher signal, fewer irrelevant suggestions.
- **Effort.** ~half a day.
- **Approach.** Keep the JS-perf and client-render rules that apply (`js-*`, `rerender-*`,
  `rendering-*` minus hydration, `bundle-*`); drop or archive the `server-*`/`async-api-*`/SSR rules.
  This is partly a relic of a general skill pack rather than something tuned to this project.

## Recommendation 5 — De-duplicate skills on disk
- **Problem.** `designing-beautiful-websites` is fully duplicated under both `.claude/skills/` and
  `.agents/skills/`; `bootstrap` lives only in `.agents/`. Two trees drift.
- **Expected benefit.** One source of truth, smaller repo, no divergence.
- **Effort.** ~1 hour.
- **Approach.** Pick one location (`.claude/skills/`), delete the other copy, and let `skills-lock.json`
  track provenance. Confirm whether `bootstrap` is even used (Bootstrap is a dependency but the app is
  inline-styled) — if not, drop the skill.

## Recommendation 6 — Add project memory / decision log
- **Problem.** Institutional knowledge lives in two journals that **stop at 2026-03-30**, while ~30
  commits landed through 2026-04-30 (calibration polish, tilesets, library redesign, chest/trap
  simplification) undocumented. The harness memory directory for this project is empty. A returning
  agent has no record of the last month's decisions.
- **Expected benefit.** Faster, safer resumption; agents stop re-deriving settled decisions.
- **Effort.** ~half a day to seed, then per-session.
- **Approach.** (a) Backfill a single `docs/journal/2026-04.md` summarising the undocumented month.
  (b) Adopt the harness memory files for durable, cross-session facts (constraints, "do not revisit"
  decisions, the data model). (c) Make "append a journal entry" the final step of the workflow.

## Recommendation 7 — Add acceptance-criteria templates to the backlog
- **Problem.** Only a few items (e.g. FEAT-022) carry explicit acceptance criteria; most are prose.
  This forced the reconciliation to mark 8 UI items "cannot determine." Without testable criteria,
  "done" is subjective and the `not_started`-picking loop operates on fuzzy state.
- **Expected benefit.** Objective done-ness; agents can self-verify; less back-and-forth.
- **Effort.** ~2 hours for a template + apply to new items.
- **Approach.** Add a backlog item template: `Description / Acceptance Criteria (checklist) / Out of
  scope / Test notes`. Require the `swe` agent to map each criterion to a test.

## Recommendation 8 — Task-based workflow & better context management
- **Problem.** The current loop is backlog-file-centric and heavy on prose. The worktree-isolation
  `swe` flow (documented 2026-03-28) caused real friction (uncommitted worktrees, a three-way
  `Backlog.md` merge conflict) — ceremony built around limitations that modern agents handle natively.
- **Expected benefit.** Less coordination overhead; fewer self-inflicted merge conflicts.
- **Effort.** ~half a day to revise the workflow text.
- **Approach.** Drop mandatory worktree isolation for single-item work; use a plain feature branch.
  Reserve isolation for genuinely parallel agent runs. Lean on the harness's task tracking for
  multi-step items instead of restating procedure in `CLAUDE.md`.I 

## Recommendation 9 — Better documentation organization
- **Problem.** Architecture docs describe a pre-refactor layout; the data model is under-documented;
  there is no index/README tying docs together (the repo `README.md` is still the **stock Vite
  template**).
- **Expected benefit.** Trustworthy docs an agent can follow without re-deriving paths.
- **Effort.** ~1 day (overlaps Rec. 1).
- **Approach.** Update `architecture/*` paths, expand `data-model.md` to the real schema, replace the
  template `README.md` with a real project README, and add a `docs/README.md` index.

---

## Things that appear designed around older-model limitations (candidates to retire)

| Artifact | Why it looks legacy | Recommended action |
|---|---|---|
| **Duplicate "next item" vs "concrete item" workflows** | Spelling out every step twice was a hedge against weak instruction-following. | Merge into one parameterised workflow. |
| **Mandatory worktree-isolation for the `swe` agent** | Heavy isolation ceremony to prevent an agent clobbering the tree; caused merge conflicts. | Use plain branches; reserve worktrees for true parallelism. |
| **60-file react-best-practices pack with SSR rules** | Bulk general skill rather than project-tuned; padding context. | Prune to applicable client rules. |
| **Triple UX / double QA surfaces** | Redundant scaffolding so "some" entry point always matched. | One agent per role. |
| **Long prose constraints in `CLAUDE.md`** repeating what tests/docs encode | Belt-and-suspenders for weaker recall. | Trim; link to canonical docs. |

## What to keep unchanged (it works)
- **Strict Red/Green/Refactor TDD** — the most valuable rule in the repo; it produced the test net.
- **Branch-per-item + manual-merge-to-main** — kept history clean across the project's life.
- **The four-role agent pipeline** (architect → ux → planner → swe) — well-scoped prompts; just
  de-duplicate the surrounding commands/skills.
- **`skills-lock.json` provenance pinning** — good supply-chain hygiene for external skills.
