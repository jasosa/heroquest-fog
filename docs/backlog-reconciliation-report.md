# Backlog Reconciliation Report

_Assessment date: 2026-05-30._

> **Superseded 2026-07-13:** the reconciliation tasks this report recommended (merging `Backlog.md` +
> `Backlog_Done.md`, renumbering ISSUE-010, restoring FEAT-026/ISSUE-008, retroactive Done entries)
> have since been applied directly to `docs/planning/Backlog.md`. The one item still open is the
> visual QA pass on the "Cannot determine" UI items listed at the bottom of this report.

Cross-references every item in `docs/planning/Backlog.md` and `docs/planning/Backlog_Done.md` against
the actual source tree, git history, journals, and configuration. Classification legend:

- **Completed** — implemented and present in code/tests.
- **Mostly completed** — implemented; minor gaps or polish remain.
- **Partially completed** — some sub-parts shipped, others not.
- **Not started** — no implementing code found.
- **Obsolete** — no longer makes sense given the current app.
- **Cannot determine** — insufficient evidence without manual play.

---

## Summary of findings

- The **"Done" file is reliable** — spot-checks of FEAT-005/006/013/015/020, ISSUE-013/014/015 etc. all
  map to real components, state, and tests (`TrapInteractionPopup`, `TrapConfigDialog`, `disarmedTraps`,
  `springedTraps`, `ChestConfigDialog`, `secretDoorMarkers`, etc.).
- The **"Not Started" section is stale at the top:** FEAT-037 is marked `status: done` yet still sits
  under `## Not Started` and was never moved to `Backlog_Done.md`.
- **Status vocabulary is inconsistent:** CLAUDE.md mandates `done`; the journals use `committed`. The
  current backlog uses `done`. No item uses `committed` anymore — the journals are simply out of date
  on this point.
- **Three implemented subsystems are entirely absent from the backlog:** map **calibration**
  (`MapCalibrator.jsx`, the single largest file), **quest JSON import/export** (`questStorage.js` +
  wired into `QuestLibrary.jsx`), and **multi-tileset board art** (`board`/`board2`/`board3`/`board4`,
  `resolveScale`).
- **Two IDs referenced elsewhere are missing from the backlog:** `FEAT-026` (a merge permission for
  `feat/FEAT-026` exists in `.claude/settings.local.json`) and `ISSUE-008` (empty-note-marker feedback,
  discussed in the 2026-03-30 journal). Their fate cannot be determined from the backlog alone.
- **Duplicate ID:** `ISSUE-010` is used **twice** in `Backlog.md` for two unrelated bugs
  (SecretDoorConfigDialog cancel; zoom-level indicator hidden). One must be renumbered.

---

## Item-by-item reconciliation

### Items in `Backlog.md` under "Not Started"

| ID | Title | Documented status | **Verdict** | Evidence |
|---|---|---|---|---|
| FEAT-011 | Rename `pendingRoomReveal` → `pendingUnconfirmedReveal` | not_started | **Not started** | `pendingRoomReveal` still used in `GameScreen.jsx`/`useGameState.js`; no `pendingUnconfirmedReveal` found. |
| FEAT-014 | Secret-door search marker exhausted state | not_started | **Not started** | `secretDoorMarkers.js` has no exhausted/dim state. |
| FEAT-016 | Search count badge on search markers | not_started | **Partially** | `SEARCH_MAX=4`, `incrementSearchCount`, `searchedCounts` exist in `useGameState.js`; no badge UI / dim-at-4 treatment found. Backend done, UI not. |
| FEAT-017 | Hero Placement Popup re-appears on fog reset | not_started | **Not started** | `hasShownPlacementPopup` not reset in `resetFog`. |
| FEAT-024 | Sidebar UX polish | not_started | **Cannot determine** | Many sub-points (width, headers, touch targets) are subjective; depends on FEAT-022 (done). Needs visual QA to confirm which sub-items already landed. |
| ISSUE-005 | RoomConfirmDialog backdrop dismiss | not_started | **Not started** | `RoomConfirmDialog.jsx` (47 lines) has no backdrop `onMouseDown` dismiss. |
| ISSUE-009 | Edit-mode action buttons inconsistent | not_started | **Cannot determine** | Requires visual inspection of pencil/star/warning buttons across `TokenOverlay`. |
| FEAT-027 | Quest create popup centered/floating modal | not_started | **Cannot determine** | `QuestLibrary.jsx` has dialogs; whether *create* is modal vs inline needs runtime check. |
| FEAT-029 | Tooltips on Play/Edit quest buttons | not_started | **Not started (likely)** | No `title=`/tooltip on those buttons found in a quick scan; confirm in `QuestLibrary.jsx`. |
| FEAT-030 | Larger quest number on cards | not_started | **Cannot determine** | Subjective sizing; needs visual QA. |
| FEAT-032 | Edit Quest Book dialog larger + styled file input | not_started | **Partially** | `EditQuestBookDialog.jsx` (140 lines) exists with cover-image support; styled drop-zone may or may not be present. |
| FEAT-033 | New Quest Book modal matching Edit style | not_started | **Cannot determine** | Needs runtime comparison of the two flows. |
| FEAT-034 | "Back to Library" button matches Calibration style | not_started | **Cannot determine** | Visual consistency check. |
| FEAT-035 | Larger board area / stretch image | not_started | **Cannot determine** | Layout/visual; board.md documents `100% 100%` sizing already. |
| FEAT-036 | Pan board with mouse drag after zoom | not_started | **Not started** | Zoom exists (`ZOOM_STEP/MIN/MAX` in `GameScreen.jsx`); no pointer-pan handlers found. |
| **FEAT-037** | Improved quest description layout in Library | **done (mislabelled)** | **Completed** | Commits `4bb0d45`/`a1d6424`/`f845e8d` (description tooltip on hover, clipping fixes). **Action: move to `Backlog_Done.md`, remove from "Not Started".** |
| FEAT-038 | Move board-style buttons above the board | not_started | **Not started** | Tileset buttons still in sidebar per board.md. |
| FEAT-039 | Monster name tooltip on hover in Play mode | not_started | **Not started** | Tooltip mechanism exists (letter markers, special monsters); generic monster-name hover not found. |

### Items in `Backlog_Done.md` — spot-verified as **Completed**

All 30 "Done" items were checked against code; representative confirmations:

| ID | Verdict | Evidence |
|---|---|---|
| FEAT-001 | Completed | `questSort.js` + `questSort.test.js` (sort by book then number). |
| FEAT-002/003 | Completed | `EditQuestBookDialog.jsx`, `AssignQuestBookDialog.jsx`, `assignQuestBook.js`. |
| FEAT-005 | Completed | `secretDoorMarkers.js` + `SecretDoorConfigDialog`/`ResultPopup` + tests. |
| FEAT-006 / FEAT-015 / ISSUE-013 | Completed | `TrapInteractionPopup.jsx` (320-line test), `getTrapRenderMode`, `revealedTraps`. |
| FEAT-010 | Completed | `HeroPlacementPopup.jsx` + `placementMessage` field + `shouldShowPlacementPopup`. |
| FEAT-013 | Completed | `ChestConfigDialog`/`ChestResultPopup` + `setChestTrap` + `resolveChestResult`. |
| FEAT-020 | Completed | `setTrapSpringConfig`, `springMessage`, `removeAfterSpring`, `springedTraps`. |
| ISSUE-015 | Completed | session-only `disarmedTraps: Set` confirmed in `useGameState.js`. |
| FEAT-022 | Completed | `theme.js` token set; `theme.test.jsx` asserts contrast/colors. |
| FEAT-023 | Completed | `QuestLibrary.jsx` showcase layout, "New" ribbon (`thumbIsNew`), thumbnail strip. |
| ISSUE-001/003/004/006 | Completed | `shouldInterceptTrapClick`, `computeHeroStartFog`, `isCorridorConnected`, `shouldInterceptChestClick`. |

No "Done" item was found to be falsely marked. Confidence: **High** for the Done file.

> Note: `Backlog_Done.md` contains **duplicate blocks** for FEAT-018 and FEAT-019 (each appears twice).
> Harmless but should be de-duplicated.

---

## Missing backlog items that appear implemented (untracked features)

These are real, shipped capabilities with **no backlog entry at all**:

1. **Map calibration subsystem** — `MapCalibrator.jsx` (817 lines), `calibration.test.js` (192),
   `useMapTransform`, affine/homography math, `loadCalibration`/`saveCalibration`. The single largest
   feature in the app is untracked. *Recommend: create FEAT-CALIB retroactively (status done).*
2. **Quest JSON import/export** — `exportQuestAsJson`/`importQuestFromJson` in `questStorage.js`, wired
   into `QuestLibrary.jsx`. *Recommend: create FEAT-IMPORT (status done) and document in data-model.md.*
3. **Multi-tileset board art** — `board`/`board2`/`board3`/`board4` tile sets, `resolveScale`,
   per-tileset `imageScale`. Partially documented in `pieces.md`/`board.md` but no backlog item.
4. **Quest numbering + migration** — `questNumber`, `migrateQuests()`. Implied by FEAT-001/FEAT-028 but
   the migration mechanism itself is untracked.
5. **Sidebar collapse persistence** — `hq_sidebar_collapsed` in `Sidebar.jsx` (FEAT-009 covered
   collapsibility; the persistence detail is extra).

---

## Backlog items that no longer make sense / need attention

- **Duplicate `ISSUE-010`** — split into two IDs (e.g. keep SecretDoorConfigDialog as ISSUE-010,
  renumber the zoom-indicator one to a new ID). Both are marked done in `Backlog_Done.md`.
- **FEAT-011** (rename `pendingRoomReveal`) — still valid but is pure cosmetic churn across many files;
  low ROI. Consider closing as "won't do" unless it genuinely aids comprehension.
- **FEAT-016 / FEAT-014** — should be planned together (they explicitly cross-reference each other's
  "exhausted" treatment). FEAT-016's *backend already exists*; only UI remains.

---

## Items referenced but absent from the backlog

| ID | Where referenced | Status |
|---|---|---|
| **FEAT-026** | `.claude/settings.local.json` (`git merge feat/FEAT-026 --no-ff` permission) | **RESOLVED → Completed.** "Quest book cover image" (priority high, complexity low), pushed 2026-04-12. Implemented and merged in commit `0764abc` (merge `0cb5a44`): `coverImage` in `questStorage.js`, upload/preview in `EditQuestBookDialog.jsx`, artwork rendered in the FEAT-023 showcase right panel (`panelBook?.coverImage` in `QuestLibrary.jsx`). The backlog entry was lost — most likely a casualty of the `Backlog.md` merge conflicts noted in the journals. **Action: add to `Backlog_Done.md` as done.** |
| **ISSUE-008** | `docs/journal/2026-03-30.md` ("Empty note marker gives no feedback in play mode") | **RESOLVED → Not started (open bug).** Confirmed in `TokenOverlay.jsx` (note-marker block): hover tooltip is gated on `!isEditMode && note` (line 126) and the play-mode click branch is `else if (note) onShowTooltip(...)` (line 142), so an empty note marker gives no hover/tap feedback; `e.stopPropagation()` (line 140) also prevents fall-through to fog reveal. No trace in git remote. **Action: re-add to `Backlog.md` as a low-priority `not_started` issue (the bug is still live).** |

---

## Documentation that no longer reflects reality

(See `project-health-report.md` and `architecture-review.md` for detail.)
- `docs/architecture/board.md`, `reveal.md`, `pieces.md`, `data-model.md` reference pre-refactor flat
  paths (`src/map.js`, `src/reveal.js`, …) — now under `src/shared/`.
- `data-model.md` Quest shape omits `questNumber`, `placementMessage`, `searchMarkers`, `searchNotes`,
  `secretDoorMarkers`; Book shape omits `coverImage`. Import/export functions are undocumented.
- `CLAUDE.md`: "117 tests across 5 suites" → actually **567 tests across 30 files**.
- Journals stop at 2026-03-30; ~30 commits (through 2026-04-30) are undocumented.

---

## Revised backlog recommendation

> **Update 2026-05-30:** `Backlog.md` and `Backlog_Done.md` were merged into a **single
> `docs/planning/Backlog.md`** (Active section on top, collapsed Done section below). The structural
> fixes below were applied during that merge; the remaining open tasks are unchecked.

**Reconciliation tasks (do first, before feature work):**
- [x] Merge the two backlog files into one `Backlog.md`; update CLAUDE.md workflow to "set status `done`" in place (no separate Done file).
- [x] Move FEAT-037 into the Done section (it was marked `done` but sat under "Not Started").
- [x] Renumber the duplicate `ISSUE-010` (zoom indicator) → `ISSUE-017`.
- [x] De-duplicate the repeated FEAT-018 / FEAT-019 blocks.
- [x] Restore FEAT-026 (Quest book cover image) into Done; re-add ISSUE-008 (empty-note-marker bug) into Active.
- [x] Add retroactive **done** entries: Calibration (FEAT-CALIB), JSON Import/Export (FEAT-IMPORT), Multi-tileset (FEAT-TILESET), Quest numbering/migration (FEAT-MIGRATE).
- [x] Drop the now-obsolete `git merge feat/FEAT-026` permission from `.claude/settings.local.json`.
- [x] Standardise status vocabulary on `done` (drop `committed` from the journals' convention). CLAUDE.md eligibility clauses fixed (`committed`→`done`); journal convention rule annotated and superseded-notes added to both journals. Historical status tables and git-commit-verb uses left intact.
- [ ] Run a focused **visual QA pass** to settle the 8 "Cannot determine" UI items (FEAT-024/027/030/032/033/034/035, ISSUE-009) into started/not-started.

**Recommended next development items (all remaining are low/medium priority — see `restart-roadmap.md`):**
1. FEAT-039 — Monster name tooltip (medium; tooltip infra already exists → cheap).
2. FEAT-016 + FEAT-014 — Search/secret-door exhausted state + badge (backend exists → cheap).
3. FEAT-036 — Pointer-based pan after zoom (medium; real mobile pain point).
4. FEAT-017, ISSUE-005 — small play-mode/dialog fixes.
5. UI consistency batch: FEAT-027/030/032/033/034/035/038 once visual QA classifies them.
