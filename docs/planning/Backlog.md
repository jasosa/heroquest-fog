# Backlog

Single source of truth for all features and issues. **Active** items (`not_started` / `in_progress`)
are listed first, ordered by priority then ID. **Completed** items are kept in the collapsed *Done*
section at the bottom for reference (dependencies, history). An item's canonical state is its
`Status:` field; the section it sits in must match that field.

When an item is completed, change its `Status:` to `done` and move its block into the Done section —
it stays in this file (do not delete it, and there is no separate Done file).

---

## Active

### [FEAT-035] Larger board area — stretch image to fill
Priority: medium
Status: not_started
Complexity: low
Description: In both Edit and Play modes the board area does not use all available screen space. Increase the board container's dimensions to occupy more of the viewport and ensure the board image (`board2.png` / `board.png`) stretches to fill the enlarged area (`width: 100%; height: 100%` with `background-size: 100% 100%` or equivalent). Verify cell hit-testing and piece rendering remain accurate after the resize.

Verified 2026-08-15 via visual QA pass (running app, 1568×698 viewport): confirmed not implemented — roughly 280px of unused space sits between the board's right edge and the sidebar in Play mode.

### [FEAT-036] Pan board with mouse drag after zoom (remove scrollbars)
Priority: medium
Status: not_started
Complexity: medium
Description: After the user applies zoom in Edit or Play mode the board can only be navigated via scrollbars, which do not work on mobile. Remove the scrollbars entirely and implement pointer-based panning: when the board is zoomed in, the user can click-and-drag (or touch-and-drag) anywhere on the board container to scroll it. Use `pointer` events (`pointerdown`, `pointermove`, `pointerup`) so it works on both desktop and touch. The board container should use `overflow: hidden` and transform/scroll position should be updated programmatically. Cursor should change to `grab` / `grabbing` while panning. Panning must not interfere with cell clicks for reveal or piece placement — distinguish a pan gesture (pointer moved > threshold) from a tap/click (pointer released without significant movement).

### [FEAT-011] [Cleanup] Rename `pendingRoomReveal` to `pendingUnconfirmedReveal`
Priority: low
Status: not_started
Complexity: low
Description: After ISSUE-004, the state variable `pendingRoomReveal` in `useGameState.js` is also used for unconnected corridor cells, not just rooms. The name is now misleading. Rename it to `pendingUnconfirmedReveal` across all files: useGameState.js (state declaration, setters, return value), BoardGrid.jsx, heroquest-fog.jsx, and any tests that reference it by name. Pure mechanical rename — no behaviour change.

### [FEAT-014] Search for secret doors marker: remove after search / show exhausted state
Priority: low
Status: not_started
Complexity: low
Description: After a hero uses a search for secret doors marker in play mode, it should be removed or replaced with a visual exhausted state. Must be consistent with FEAT-016: if a search count badge is introduced on search for treasure markers, apply a similar exhausted treatment here (e.g. dim the marker and make it non-interactive) rather than removing it outright.

### [FEAT-016] Search count badge on search markers
Priority: low
Status: not_started
Complexity: low
Description: When a room has been searched at least once in play mode, show a small badge overlapping the search marker displaying the current count (e.g. "2/4"). At 4/4 searches the marker dims, becomes non-interactive, and the badge shows "4/4" — the marker is no longer removed but rendered as exhausted. This gives players a persistent visual record that the room has been fully searched. Must be consistent with FEAT-014 (secret door markers exhausted treatment).

### [FEAT-017] Hero Placement Popup re-appears on fog reset
Priority: low
Status: not_started
Complexity: low
Description: When the DM resets fog during a play session, reset `hasShownPlacementPopup` to false so the placement popup re-appears if the quest has a non-empty placement message. This ensures the popup is shown again when restarting with the same browser session.

### [FEAT-029] Tooltips on Play and Edit quest buttons in library cards
Priority: low
Status: not_started
Complexity: low
Description: The Play and Edit icon buttons on each quest card in the Quest Library have no accessible label or tooltip. Add a `title` attribute (or a small hover tooltip styled consistently with the app) to both buttons: "Play quest" and "Edit quest". This helps new users understand the buttons' purpose at a glance.

### [FEAT-034] "Back to Library" button style matches Calibration mode
Priority: low
Status: not_started
Complexity: low
Description: The "Back to Library" button in Edit and Play mode has a different visual style to the equivalent navigation button used in Calibration mode. Unify the style so both buttons use the same appearance (same padding, font, color, border, and hover state) for a consistent navigation affordance across modes.

Verified 2026-08-15 via visual QA pass (running app): confirmed not implemented — Game/Edit mode uses a dark background with gold border and gold small-caps "← LIBRARY"; Calibration mode uses a light parchment background with dark mixed-case "← Library". Still visibly different.

### [FEAT-038] Move board style buttons above the board
Priority: low
Status: not_started
Complexity: low
Description: The board style (tileset) selector buttons are currently positioned in the sidebar, below other controls, where they are easy to miss. Move them to a toolbar strip placed directly above the board image in both Edit and Play modes so the user can switch board styles without leaving their view of the board. Style the strip consistently with other board-adjacent controls (e.g. zoom buttons if present).

### [ISSUE-005] RoomConfirmDialog missing backdrop dismiss
Priority: low
Impact: low — UX friction on mobile
Status: not_started
Complexity: low
Description: Clicking outside the RoomConfirmDialog does nothing. All other dialogs in the app dismiss on backdrop click. Fix: add `onMouseDown` handler on the backdrop overlay that calls the cancel action, with `e.stopPropagation()` on the inner content div.

### [ISSUE-008] Empty note marker gives no feedback in play mode
Priority: low
Impact: low — minor UX confusion
Status: not_started
Complexity: low
Description: In play mode, hovering or clicking a note marker that has an empty note does nothing. In TokenOverlay.jsx the hover tooltip is gated on `!isEditMode && note` and the click branch is `else if (note) onShowTooltip(...)`, while `e.stopPropagation()` prevents fall-through to fog reveal — so an empty note marker silently does nothing. Fix: give feedback (e.g. a brief "No note" tooltip) or let the click fall through to reveal. Re-added during the 2026-05-30 reconciliation (previously only mentioned in the 2026-03-30 journal, never tracked).

### [ISSUE-009] Edit mode action buttons are structurally inconsistent
Priority: low
Impact: low — visual inconsistency
Status: not_started
Complexity: low
Description: The edit affordance buttons on placed pieces (pencil for note/search markers, star for monsters, warning for chests) use three different element types and sizes despite serving the same purpose. Fix: all use a `<button>` element, 16×16px circle, positioned top-right of the piece image. The chest warning button currently uses a `<div>` with `onMouseDown` — convert it to `<button>` (keep `onMouseDown` to prevent cell click propagation).

Verified 2026-08-15 via visual QA pass (running app): confirmed not implemented — the monster special-note button is a white circular ★ badge top-right of the piece; the chest button is a red/crimson triangular ⚠ badge in a different position and shape. Still structurally inconsistent.

---

## Done

<details>
<summary><strong>42 completed items</strong> — click to expand</summary>

### [FEAT-001] As a user I want to see quests sorted by Quest Book and Quest number
Priority: medium
Status: done
Complexity: low
Description: In the main window the quests should be sorted first by Quest Book and then by Quest number. In case a quest doesn't have a quest number the sorting order would be alphabetically.

### [FEAT-002] As a user I want to be able to edit the quest book after the book is created
Priority: high
Status: done
Complexity: low
Description: Once a quest book is created, name and description can't be edited. It should be possible to edit both (and other possible attributes in the future).

### [FEAT-003] As a user I want to add a quest to a quest book after it has been already created
Priority: medium
Status: done
Complexity: medium
Description: When a quest is created without adding it to any quest book, it should be possible later to add it to a quest book, or to move from one quest book to another.

### [FEAT-004] As a user I want to see all quest buttons aligned at the bottom in the quests screen
Priority: medium
Status: done
Complexity: low
Description: In the Quest Library the buttons on each quest are not aligned. Depending on the text length of the quest description, the buttons are higher or lower on the quest card. All buttons should be aligned independently of the text size.

### [FEAT-005] As a hero player I want to search for secret doors in play mode
Priority: high
Status: done
Complexity: high
Description: Secret doors added in edit mode should not be visible to hero players until they search for them. To search for a secret door, hero players use a similar icon to the search for treasure one. If a secret door search icon has an associated hidden secret door it will make it visible; otherwise it shows a message. In edit mode it is possible to add a search for secret door icon in a similar way to search for treasure. By default they won't be associated to any secret door and will have a default message shown in play mode. An already placed secret door icon can be associated to a secret door and the default message can be overridden. Only one search for secret door icon can be placed in a room but more than one can be placed in corridors.

### [FEAT-006] As a hero player I want trap types to be hidden in play mode
Priority: high
Status: done
Complexity: high
Description: Traps placed in edit mode are shown in play mode as a generic warning marker (Trap_Warning.png) instead of their real icon — the specific trap type is hidden until revealed. When a hero player clicks the warning marker, the real trap piece is revealed (the warning disappears and the actual trap icon takes its place), and it stays revealed for the rest of the session. A tooltip on the warning marker informs the player that clicking it will reveal the trap. In edit mode, all traps are always shown with their real icons. Revealed trap state is not persisted — it resets with the session. Switching between play and edit mode does not reset revealed traps; only a session reset (Reset Fog) clears them.

### [FEAT-007] As a hero player I don't want to see hero starter icons in Play mode
Priority: high
Status: done
Complexity: low
Description: Hero starter icons shouldn't be shown in play mode.

### [FEAT-008] Edit mode panel should include same images for markers instead of the default icons
Priority: low
Status: done
Complexity: medium
Description: Edit mode panel should include same images for markers instead of the default icons. Make as wide as needed to make sure that the images are displayed properly.

### [FEAT-009] Edit mode panel should be collapsable
Priority: low
Status: done
Complexity: low
Description: Edit mode panel should be collapsable. By default it should be expanded. Should be closed with an icon and opened again with the same icon.

### [FEAT-010] Hero Placement Popup at Quest Start
Priority: medium
Status: done
Complexity: medium
Description: At the beginning of each quest a popup should indicate to the players where to put their hero figurines. The default message should say something like "Place your heroes in the stairway". The message should be editable in edit mode as well.

### [FEAT-012] Adding search for secret door marker does not show popup immediately
Priority: medium
Status: done
Complexity: low
Description: In edit mode, adding a search for secret door marker shouldn't immediately show the popup. It should place the marker with default values. Clicking the edit button should open the popup to configure the marker (same as search for treasure).

### [FEAT-013] Manage traps in Chests
Priority: medium
Status: done
Complexity: medium
Description: In play mode, chests should behave similarly to traps but without a tile hiding them. They should show a golden glow border to indicate they can be interacted with. On hover a tooltip says "Chests can have traps. Click to reveal." After clicking, a popup shows whether there is a trap or not. In edit mode a note can be added to a chest to indicate if there is a trap and the message to show. By default no message and no trap. Works similarly to other markers.

### [FEAT-015] Trap interaction overhaul
Priority: high
Status: done
Complexity: high
Description: In play mode, clicking a trap warning marker opens an interaction popup instead of immediately revealing the trap.

The popup explains the two available actions:
- **Jump over the trap**: Roll a die — a black shield result fails the jump, triggers the trap with no possibility of disarming it afterwards.
- **Move adjacent to disarm**: Disarm rules are the same for all trap types (standard HeroQuest disarm roll). Failure triggers the trap. The effect of springing a trap varies per trap type but is **not** shown to heroes until after it is triggered (the DM narrates it).

The popup offers two action buttons:
1. **Reveal trap** (with a confirmation step) — reveals the trap type and shows the DM-configured note for that trap (e.g. the effect of springing it). The trap warning is replaced with the actual trap image. The reveal state persists for the session.
2. **Disarm trap** (available for both revealed and unrevealed traps, with a confirmation step) — removes the trap piece from the board entirely.

Each trap type in `pieces.js` has a pre-defined `trapRules` field describing its specific disarm and spring effects. The DM can override this text per placed trap via a custom note field on the `PlacedPiece` shape (same pattern as `ChestConfigDialog`'s `trapNote`). The custom note is only shown after reveal, not before.

In edit mode, traps always show their real icon and DM-authored notes are editable via a config dialog (same pattern as chests and search markers).

### [FEAT-018] Navigation and mode-switch warnings
Priority: medium
Status: done
Complexity: low
Description: Two safeguard warnings:
1. **Play → Edit mode switch mid-session**: Show a notice that opened chests, revealed traps, and search counts will carry over to the next play session (they are not reset).
2. **Back to Library with unsaved changes**: When the DM navigates back to the quest library while the current quest has unsaved edits, prompt a confirmation ("Unsaved changes will be lost — go back anyway?").

### [FEAT-019] Trap warning visual indicator (glow)
Priority: medium
Status: done
Complexity: low
Description: Spotted-but-unrevealed trap warnings should have a red/orange glow to signal interactivity, distinct from the amber/gold glow used on chests. Amber = treasure opportunity; red = physical danger — players must distinguish them instantly on a small screen without reading tooltips.

UX recommendation: apply a two-layer `drop-shadow` matching the chest glow structure but in crimson/red:
`drop-shadow(0 0 4px #c0392b) drop-shadow(0 0 8px #e74c3caa)`

This mirrors the chest's inner/outer layering so both elements feel like the same visual language while remaining distinguishable by color. Red also aligns with the existing theme danger colors (`T.accent` / `T.title` are already deep crimson). Implementation is a one-line change in the trap warning block of `TokenOverlay.jsx`.

### [FEAT-020] Spring trap: configure behavior per trap type in edit mode
Priority: high
Status: done
Complexity: medium
Description: In edit mode, each placed trap should have two additional configurable fields (in `TrapConfigDialog`):

1. **Spring effect message** — The text shown to players when the trap is sprung (e.g. "You fall into a pit and lose 1 Body Point."). Pre-filled with a sensible default per trap type. The DM can edit it. This replaces the current `trapNote` which was used as the reveal message.
2. **Remove from board after spring** — A checkbox/toggle. If checked, the trap piece is removed from the play session after being sprung (hidden, like a disarmed trap). If unchecked, the trap stays visible on the board (e.g. a pit trap that remains dangerous). Default: checked for most traps.

When a player clicks "Spring" in the trap popup (ISSUE-013), the spring effect message is shown and the remove/keep decision is applied based on this config. Stored on `PlacedPiece` as `springMessage: string` and `removeOnSpring: boolean`.

### [FEAT-021] Default trap rules text should be editable per trap type in edit mode
Priority: medium
Status: done
Complexity: low
Description: The DM should be able to edit the default rules text per trap type globally (not per placed instance). This could be a global settings panel or per-piece default in `pieces.js` that is surfaced as editable in a trap-type settings area. Alternatively, if the per-placed `trapNote` field (from FEAT-020) is pre-filled with the default text, the DM editing the placed piece effectively customises the default. Clarify the exact UX before planning.

### [FEAT-022] Dark theme overhaul — JIME-inspired high-contrast palette
Priority: high
Status: done
Complexity: low
Description: Replace the current colour tokens in `theme.js` with a JIME-inspired dark palette that passes WCAG AA contrast (4.5:1 minimum) everywhere. The core rule is: dark background → bright text, never same-tone combinations.

Key changes:
- `pageBg` → `#12100e` (near-black) for the board surround and game screen; the library right panel may keep a slightly warmer dark background
- Quest card backgrounds switch from near-black dark brown to `#1e1a12` with a 3px bright-gold (`#f0c040`) left border accent
- Card title colour → `#f0d080` (bright warm gold, ~8:1 on card bg); body text → `#e8dfc8` (~7:1); meta/date → `#b8a87a` (~4.7:1)
- Sidebar input text → `#e8dfc8`; input border → `#9a7a30` 1.5px (clearly visible against dark bg)
- Button text on dark → `#d8c888`; active button retains crimson fill with bright gold border `#f0c040`
- All sidebar section headings → `#f0d080`

No layout or component structure changes in this feature — pure colour token replacements in `theme.js`. All components inherit the new values automatically via `T.*` imports.

Acceptance criteria: every text/background pair in the app meets 4.5:1 contrast ratio.

### [FEAT-023] Quest Library card grid redesign
Priority: high
Status: done
Complexity: medium
Description: Redesign the Quest Library screen to use a cinematic, full-bleed card layout inspired by the Journeys in Middle-earth app. Instead of a compact card grid, the selected quest is presented as a large showcase panel: a wide illustration area on the right, descriptive text on the left, and a horizontal thumbnail strip along the bottom for browsing other quests.

Reference: the "Poison Promise" campaign screen from JTME — dark atmospheric background, large hero artwork, title centred above the art, description text panel on the left, small scene thumbnails at the bottom, navigation arrows on the sides, and a "New" ribbon badge on fresh quests.

Key changes:
- Replace the card grid with a single large showcase card (~80% of the content area). Left panel: quest title (Cinzel, gold, ~22px), meta line (book name + quest number, IM Fell English italic, muted), full description text (IM Fell English 13px, no line-clamp). Right panel: large quest artwork placeholder (`#0d0b07` with a faint parchment-texture overlay and a centered icon if no image is set); if a cover image is stored on the quest object, render it here.
- "New" ribbon badge (gold diagonal banner, top-right corner of the card) shown on quests created within the last 7 days.
- Bottom thumbnail strip: horizontally scrollable row of quest mini-cards (~120×80px each), one per quest in the selected book. Active quest is highlighted with a gold border. Clicking a thumbnail selects it and updates the showcase panel without navigating away.
- Action buttons ("Play", "Edit", "Delete") sit below the left panel description, not inside the thumbnail. "Play" is a crimson fill button (gold border); "Edit" and "Delete" are secondary dark buttons. All minimum 44px tall.
- Left/right arrow controls (or keyboard ←/→) to cycle through quests within the current book, mirroring the JTME navigation pattern.
- Sidebar quest book list remains on the left; selecting a different book resets the showcase to the first quest in that book.
- Dark atmospheric page background (`pageBg` from FEAT-022); showcase card uses `#1a1408` with a subtle warm vignette shadow.
- Depends on FEAT-022 for colour tokens.

### [FEAT-024] Sidebar UX polish — inputs, section headers, piece list, touch targets
Priority: medium
Status: done
Complexity: medium
Description: Polish the game sidebar (`Sidebar.jsx`) and edit panel (`EditPanel.jsx`) to fix the usability and readability issues identified in the UX review.

Key changes:
- **Input fields**: `fontSize: 13`, `padding: 9px 10px`, `border: 1.5px solid #9a7a30` via the existing `.hq-input-dark` CSS class (extended, not inline `onFocus`/`onBlur` — the existing `.hq-input-dark:focus` rule already provided the gold glow-on-focus behavior; the UX review found duplicating it via inline handlers risked a style-specificity regression)
- **Section headers**: new shared `SectionHeader` component (gold fade-rule: two `linear-gradient` lines flanking a centred Cinzel uppercase label) — "Quest Info" (new), "Mode" (replaces the old "Quest Master" label, per user decision), "Pieces" (new), "Board Style" (restyled)
- **Mode toggle (Play/Edit)**: `padding: 12px 0`, `fontSize: 12`, `letterSpacing: 3`, explicit `minHeight: 44` (UX review: the literal backlog padding/fontSize alone didn't clear the 44px tap-target guideline), active-state gold `textShadow` glow
- **Category tabs**: `fontSize: 11`, `padding: 7px 10px`, `minHeight: 36` — kept below the 44px guideline as a deliberate, low-cost exception (mis-tap just switches the visible list)
- **Piece list items**: `minHeight: 48px`, icon/swatch `36×36px`, `fontSize: 13`, `gap: 12` (via inline style — required removing Bootstrap's `gap-2` class, which is `!important` and would otherwise win)
- **Piece list scroll region**: `maxHeight: 340` + `overflowY: "auto"` + `flexShrink: 0` so a long category (Furniture has 11 pieces) scrolls internally instead of pushing the Save button/category tabs out of view. The `flexShrink: 0` was added after visual QA caught a real flexbox bug — a flex item with `overflow: auto` gets an automatic minimum size of 0, so without it the piece list collapsed to ~27px under space pressure from sibling flex items instead of respecting its `maxHeight`.
- **Sidebar width**: 270px → 300px (collapsed stays 44px)
- **"← Library" button**: bumped modestly (`fontSize: 11`, `minHeight: 34`) — not to the full 44px bar, since it's low-frequency and already guarded by the existing "Unsaved Changes" confirm dialog in Edit mode
- **Removed developer footer** ("v0.2 — Real HeroQuest board / 22 rooms")
- Depends on FEAT-022 for colour tokens (done)

Implemented 2026-08-15 via the architect-free (medium complexity) ux → planner → swe pipeline. 586/586 tests passing (19 new), lint clean. Visual QA after implementation caught and fixed the piece-list flexbox collapse bug described above — a case the plan explicitly flagged as unverifiable by jsdom tests alone.

### [FEAT-025] Remove legend from play mode sidebar
Priority: low
Status: done
Complexity: low
Description: The play mode sidebar shows a long room-colour legend that takes up most of the vertical space and is not useful during play. Remove it entirely.

### [FEAT-027] Quest create popup centered and floating
Priority: medium
Status: done
Complexity: low
Description: When the user clicks to create a new quest inside the Quest Library, the creation form now appears as a centered modal overlay (`NewQuestDialog.jsx`), a structural sibling of `EditQuestBookDialog.jsx`/`AssignQuestBookDialog.jsx`: fixed backdrop, dark `T.sidebarBg` dialog with `T.accentGold` border, Cinzel/`FONT_HEADING` uppercase title, ~420px wide (wider than the 320px precedent to fit the larger field set). Dismisses on backdrop click (`onMouseDown` + target check), the header × button, Cancel, or Escape (new — no other dialog in the app supports Escape yet, intentionally not retrofitted onto the other two). All dismiss paths are silent/immediate discard, no confirmation — matches the sibling "New Book" inline form's existing behavior. "Create & Edit" is disabled while the title is empty, matching `EditQuestBookDialog`'s Save-button pattern.

Implemented 2026-08-15 via the ux → planner → swe → reviewer pipeline (first use of the new `reviewer` review-cycle gate — approved on first pass, no revision iterations needed). 612/612 tests passing (20 new), lint clean.

### [FEAT-026] Quest book cover image
Priority: high
Status: done
Complexity: low
Description: Allow a cover image to be assigned to a quest book. The image is displayed as the artwork in the showcase right panel (FEAT-023) when a quest from that book is selected. Implemented and merged 2026-04-12 (commit 0764abc); coverImage in questStorage.js, upload/preview in EditQuestBookDialog.jsx, rendered in QuestLibrary showcase. The backlog entry was lost in an earlier Backlog.md merge conflict and restored during the 2026-05-30 reconciliation.

### [FEAT-028] Visual label for quest order number in quest book assignment
Priority: medium
Status: done
Complexity: low
Description: When assigning a quest to a quest book, an input shows a bare number whose meaning is unclear. Add a visible text label (e.g. "Quest # in book") adjacent to the number input so the user understands they are setting the quest's order within the book. Consider also adding a short helper line below the field (e.g. "Position of this quest in the book's sequence").

### [FEAT-030] Larger quest number display on quest cards
Priority: medium
Status: done
Complexity: low
Description: The quest-order number badge on each quest card is now large, bold (`fontSize: 16`, `fontWeight: "bold"`), and pill-shaped (`borderRadius: 999`, `minWidth`-based so 1–3 digit numbers never clip), immediately readable when scanning the card list. The adjacent "New" ribbon badge was deliberately left at its original small size so the two read as distinct visual tiers rather than competing — a permanent ordinal identifier vs. a transient recency flag. The badge container now stacks vertically (number above "New") with a reserved `minHeight` so card height doesn't jitter as the "New" badge appears/disappears during arrow-key quest navigation.

Implemented 2026-08-15 via the ux → planner → swe → reviewer pipeline. 620/620 tests passing (8 new), lint clean. Approved on first review pass.

### [FEAT-032] Edit Quest Book dialog — larger layout and improved file input style
Priority: medium
Status: done
Complexity: low
Description: The Edit Quest Book dialog is now 420px wide (matching `NewQuestDialog`) with a scrollable body (`overflowY: auto`, `maxHeight: 60vh`) and Escape-to-cancel. The raw `<input type="file">` cover-image control is replaced with a styled dropzone (`.hq-upload-dropzone` — dashed gold border, 📤 icon, "Click to upload cover image" + helper text in the empty state; thumbnail preview + "Replace image" in the filled state). The upload trigger is a native `<label for="edit-book-cover-input">` wrapping a visually-hidden-but-focusable (sr-only clip-rect, not `display:none`) file input — click-to-browse and keyboard (Tab+Enter/Space) both work via native semantics, no drag-and-drop implemented (backlog's "drop zone" wording was visual/illustrative, confirmed with UX review). The "× Remove" button stays a sibling of the label (not nested inside it) so removing doesn't also reopen the file picker. Existing `coverImage`/`sizeWarning`/`announcement` state and logic were not touched — only the surrounding markup.

Scope explicitly excluded (pre-existing gaps, not part of this ticket): file-type validation, `FileReader.onerror` handling, and a rapid select-then-remove race condition in the async `FileReader` callback.

Implemented 2026-08-15 via the ux → planner → swe → reviewer pipeline. 627/627 tests passing (7 new), lint clean. Approved on first review pass; visually confirmed in-browser.

### [FEAT-033] New Quest Book popup — centered modal matching Edit style
Priority: medium
Status: done
Complexity: low
Description: "New Quest Book" is now a centered modal (`NewQuestBookDialog.jsx`), a sibling of `EditQuestBookDialog.jsx`/`NewQuestDialog.jsx`: 420px wide, gold-bordered, scrollable body, Escape-to-cancel, backdrop-dismiss — identical presentation to the Edit dialog. Description field adopted Edit's labeled-input + helper-caption pattern (was previously a bare placeholder input). Cover image reuses the `.hq-upload-dropzone` control from FEAT-032 verbatim. The primary action button keeps the label "Create" (not relabeled to "Save") and uses the modal-style `btn-hq-light` treatment rather than the old sidebar-dark button style. Creating a book does not auto-select it as the active sidebar filter and does not navigate anywhere — preserved exactly as before, since this was a pure presentation-consistency ticket, not a behavior change.

Note: `e2e/ux.cjs` (local-only QA script, not part of `npm test`/CI) references the old `input[placeholder="Description (optional)"]` selector for this flow, which no longer exists (now a labeled input with placeholder "Optional"). Will need updating before that script is next run locally — not a blocker for this ticket.

Implemented 2026-08-15 via the ux → planner → swe → reviewer pipeline. 656/656 tests passing (28 new), lint clean. Approved on first review pass; visually confirmed in-browser.

### [FEAT-031] Quest book background image opacity
Priority: low
Status: done
Complexity: low
Description: The background image used for quest book cards or the quest book showcase area is rendered at full opacity, competing with text and UI elements. Reduce the opacity of the background image to approximately 70% (e.g. using `opacity: 0.7` on the `<img>` layer or `rgba` overlay) so the content above it remains legible while the artwork is still visible.

### [FEAT-037] Improved quest description layout in Library
Priority: medium
Status: done
Complexity: low
Description: In Library mode the quest introduction/description text area is too small and the text is barely readable. Redesign the quest information section to give the description more vertical space, increase the font size to at least 13px, and ensure sufficient contrast. Consider displaying the description in the showcase right panel (already used for artwork) with a two-column approach: artwork on top, description text below, or a tabbed/toggle layout between artwork and description.

### [FEAT-039] Monster name tooltip on hover in Play mode
Priority: medium
Status: done
Complexity: low
Description: In Play mode, hovering over a placed monster piece displays a small tooltip showing the monster's name, plus `specialNote` on its own line beneath the name when the monster is marked special. Reuses the shared tooltip mechanism already used for notemarkers/special monsters — no new component. On mobile, tapping toggles the tooltip open/closed; tapping a different monster replaces the content; tapping any other unclaimed element (e.g. a plain board cell) dismisses the tooltip without swallowing that click's own effect (e.g. fog reveal still happens).

Implementation note: the existing special-monster-only tooltip gate was generalized to fire for all monsters in Play mode (`isMonster && !isEditMode`, dropping the old `isSpecial` requirement) rather than adding a second, competing hover/click handler. The shared `hoverTooltip` state (`GameScreen.jsx`) was extended with an `anchorKey` so a second tap on the same anchor toggles off, and a dismiss handler on the outermost wrapper closes any open tooltip on unclaimed clicks (relies on all tooltip-aware handlers already calling `e.stopPropagation()`). This also incidentally gives the existing notemarker tooltip real toggle/dismiss behavior it lacked before (previously only closed via `onMouseLeave`, unreliable on touch).

Known accepted limitation: clicking a chest (or any other element whose handler calls `stopPropagation()` without touching tooltip state) does not dismiss an open monster/notemarker tooltip — scoped out to avoid touching every such handler; can be revisited if it proves annoying in practice.

Implemented 2026-08-15 via the ux → planner → swe pipeline. 592/592 tests passing (6 new), lint clean. Manually verified in-browser: hover show/swap on desktop, click toggle-open/toggle-off/replace, and dismiss-on-other-click all behave correctly without swallowing the underlying click.

### [ISSUE-001] Click on an unrevealed cell that contains a trap shouldn't reveal the trap
Priority: high
Impact: high — affects gameplay
Status: done
Complexity: medium
Description: In play mode, when a user clicks on an unrevealed cell (still under fog of war) that contains a trap warning marker, the real trap is revealed. The trap should stay hidden (warning marker shown) until the user can decide if they want to click on it.

### [ISSUE-002] On play mode when clicking on a cell the cell is selected showing a red border
Priority: medium
Impact: low — visual
Status: done
Complexity: low
Description: In play mode, when a user clicks on a cell, the cell is selected showing a red border. It shouldn't show a red border.

### [ISSUE-003] When resetting the board on play mode, the place where the heroes start should be visible
Priority: medium
Impact: medium
Status: done
Complexity: low
Description: When a user resets the fog in play mode, the hero start positions should be auto-revealed (same as when first entering play mode), not left under fog.

### [ISSUE-004] Clicking on an unexplorable or not connected corridor reveals it
Priority: medium
Impact: high
Status: done
Complexity: medium
Description: When a user clicks on a room that is not connected to any door, a popup is shown to ask if they want to reveal it, but this is not the same for corridors. If a cell in a corridor is not currently connected to a revealed zone it should ask as well.

### [ISSUE-006] Chest click that misses image falls through to fog reveal
Priority: medium
Impact: medium — affects gameplay
Status: done
Complexity: low
Description: If a tap lands on a chest cell but misses the image area (the image is smaller than the cell at imageScale 0.85), `handleCell` runs the fog reveal path instead of opening the chest. Fix: add a chest intercept check in `handleCell` in `useGameState.js`, same pattern as the existing trap intercept (`shouldInterceptTrapClick`).

### [ISSUE-007] Special monster notes inaccessible on mobile
Priority: medium
Impact: medium — affects gameplay on touch devices
Status: done
Complexity: low
Description: In play mode, special monster notes are only accessible via hover. On mobile/tablet they are completely inaccessible. Fix: in play mode, tapping a special monster (one with `isSpecial: true`) shows the note using the shared tooltip mechanism. A second tap or a tap elsewhere dismisses it — same pattern as note markers.

### [ISSUE-010] SecretDoorConfigDialog cancel saves instead of discarding changes
Priority: low
Impact: low — unexpected behavior
Status: done
Complexity: low
Description: The cancel action in `SecretDoorConfigDialog` re-saves the existing values rather than discarding unsaved changes. This is opaque to the DM and inconsistent with every other cancel in the app. Fix: cancel should discard uncommitted state without writing to the placed piece.

### [ISSUE-011] Wrong black shield rule text in trap popup
Priority: high
Impact: high — wrong game rules shown to players
Status: done
Complexity: low
Description: The jump-over rule text in `TrapInteractionPopup` is inverted. The correct rule is: rolling a black shield **fails** the jump and springs the trap. The current text may say the opposite. Fix: correct the rule text so it reads "Roll a combat die — a black shield result fails the jump and springs the trap."

### [ISSUE-012] Trap interaction popup should be centered on the board image
Priority: medium
Impact: medium — visual UX
Status: done
Complexity: low
Description: The trap interaction popup is currently centered on the full viewport (`position: fixed, inset: 0`). It should be centered relative to the board image area, not the entire screen (which includes the sidebar). Fix: change the overlay to be `position: absolute` on the board scroll container, or use a different centering approach that keeps the popup over the board.

### [ISSUE-013] Trap popup flow redesign: Spring / Reveal / Disarm / Dismiss
Priority: high
Impact: high — affects core play mode gameplay
Status: done
Complexity: medium
Description: The current trap popup flow (Reveal Trap → confirmed reveal → Disarm) does not match the intended game flow. The redesigned popup must have four actions:

1. **Spring** — The player triggers the trap intentionally (or it was triggered after a failed jump/disarm). Shows a message with the trap effect (configured in edit mode via FEAT-020). Whether the trap is then removed from the board or kept depends on edit-mode configuration. Does NOT close automatically — shows result then Close.
2. **Reveal** — Informational only. Shows the trap type and its effect text. **Does not change any state** — the warning marker remains visible on the board. Players can still disarm or spring it after revealing. Just a peek.
3. **Disarm** — Removes the trap from the play session (see ISSUE-015 — must not mutate edit-mode data). Requires the confirmation step before executing.
4. **Dismiss** — Closes the popup without any action.

Each button must also show a brief one-line explanation of what it does (e.g. "Reveal: See the trap type without changing anything.") so players understand the consequences before tapping. Depends on FEAT-020 for Spring configuration and ISSUE-015 for correct disarm behavior.

### [ISSUE-014] Reset Fog of War should reset all trap session state
Priority: high
Impact: high — session state inconsistency after fog reset
Status: done
Complexity: low
Description: When the DM resets the Fog of War in play mode, all trap session state should also be reset: `revealedTraps`, `springedTraps` (once added in FEAT-020), and `disarmedTraps` (once added in ISSUE-015). Currently `resetFog` may not clear all of these, leaving traps in a stale revealed/disarmed state after the fog is reset. All trap warning markers should reappear as fresh after a fog reset.

### [ISSUE-015] Traps disarmed in play mode must not modify edit-mode placed data
Priority: high
Impact: high — data corruption between play and edit modes
Status: done
Complexity: medium
Description: The current `disarmTrap` implementation deletes the trap from `placed`, which is the shared edit-mode data structure. This means disarming a trap in play mode permanently removes it from the quest in edit mode too — the DM loses their placed trap data. Fix: introduce a session-only `disarmedTraps: Set<string>` state (alongside the existing `revealedTraps`). In play mode, `disarmTrap` adds to `disarmedTraps` instead of mutating `placed`. `TokenOverlay` hides any piece whose anchor key is in `disarmedTraps`. On fog reset, `disarmedTraps` is cleared. Edit mode always ignores `disarmedTraps` and shows the real `placed` data.

### [ISSUE-016] Quest description text not visible in Edit Quest Book dialog
Priority: low
Impact: low — UX friction when editing quest books
Status: done
Complexity: low
Description: The description input in the Edit Quest Book dialog had no visible label, making its purpose unclear. Added a visible label ("Description") above the field and a helper line below it ("Shown in the quest book showcase"), following the same pattern as FEAT-028.

### [ISSUE-017] Zoom level indicator hidden by color palette in Edit mode
Priority: medium
Impact: medium — users cannot tell current zoom level while placing pieces
Status: done
Complexity: low
Description: In Edit mode the zoom level display is obscured by the color palette / sidebar controls. The zoom indicator needs to be repositioned or its contrast improved so it is clearly readable regardless of what sits behind it. Fix: move the zoom level badge to a position that does not overlap the palette, or apply a background/border treatment (e.g. dark pill with gold text) that ensures visibility against any background.

### [FEAT-CALIB] Map calibration subsystem
Priority: medium
Status: done
Complexity: high
Description: Retroactively tracked during the 2026-05-30 reconciliation — implemented and shipped earlier with no backlog entry. A calibration mode (`MapCalibrator.jsx`, the largest component in the app) lets a developer/setup user map board-image pixel coordinates to logical grid coordinates by placing anchor points. `useMapTransform` applies an affine transform (3 anchors) or homography (4+ anchors) to convert `(col, row) → [px, py]`. Anchors persist per tileset in `localStorage` via `loadCalibration`/`saveCalibration` (`hq_calibration`). Covered by `calibration.test.js`.

### [FEAT-IMPORT] Quest JSON import / export
Priority: medium
Status: done
Complexity: medium
Description: Retroactively tracked during the 2026-05-30 reconciliation — implemented and shipped earlier with no backlog entry. Quests can be exported to and imported from JSON. `exportQuestAsJson` / `importQuestFromJson` live in `questStorage.js` and are wired into `QuestLibrary.jsx` (download on export; file-read + parse on import, assigned to the currently selected quest book). Should be documented in `data-model.md`.

### [FEAT-TILESET] Multi-tileset board art
Priority: medium
Status: done
Complexity: medium
Description: Retroactively tracked during the 2026-05-30 reconciliation — implemented and shipped earlier with no dedicated backlog entry. The app supports multiple board tilesets (`board` / `board2` / `board3` / `board4`). Piece `imageScale` can be a plain number or an object keyed by tileset id; `resolveScale(imageScale, tileSet)` resolves the correct per-tileset scale at render time (used in `TokenOverlay.jsx`, `DoorOverlay.jsx`). Partially documented in `pieces.md` / `board.md`.

### [FEAT-MIGRATE] Quest numbering and migration
Priority: low
Status: done
Complexity: low
Description: Retroactively tracked during the 2026-05-30 reconciliation — implemented and shipped earlier with no backlog entry. Quests carry a `questNumber` field (order within a quest book; see FEAT-001 / FEAT-028). `migrateQuests()` in `questStorage.js` backfills `questNumber: null` on any stored quest that predates the field, keeping older localStorage data compatible.

</details>
