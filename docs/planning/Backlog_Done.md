# Backlog — Done

Completed items moved from Backlog.md. Ordered by ID within each type.

---

## Features

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

### [FEAT-025] Remove legend from play mode sidebar
Priority: low
Status: done
Complexity: low
Description: The play mode sidebar shows a long room-colour legend that takes up most of the vertical space and is not useful during play. Remove it entirely.

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

### [FEAT-028] Visual label for quest order number in quest book assignment
Priority: medium
Status: done
Complexity: low
Description: When assigning a quest to a quest book, an input shows a bare number whose meaning is unclear. Add a visible text label (e.g. "Quest # in book") adjacent to the number input so the user understands they are setting the quest's order within the book. Consider also adding a short helper line below the field (e.g. "Position of this quest in the book's sequence").

### [FEAT-031] Quest book background image opacity
Priority: low
Status: done
Complexity: low
Description: The background image used for quest book cards or the quest book showcase area is rendered at full opacity, competing with text and UI elements. Reduce the opacity of the background image to approximately 70% (e.g. using `opacity: 0.7` on the `<img>` layer or `rgba` overlay) so the content above it remains legible while the artwork is still visible.

---

## Issues

### [ISSUE-016] Quest description text not visible in Edit Quest Book dialog
Priority: low
Impact: low — UX friction when editing quest books
Status: done
Complexity: low
Description: The description input in the Edit Quest Book dialog had no visible label, making its purpose unclear. Added a visible label ("Description") above the field and a helper line below it ("Shown in the quest book showcase"), following the same pattern as FEAT-028.

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

### [ISSUE-010] Zoom level indicator hidden by color palette in Edit mode
Priority: medium
Impact: medium — users cannot tell current zoom level while placing pieces
Status: done
Complexity: low
Description: In Edit mode the zoom level display is obscured by the color palette / sidebar controls. The zoom indicator needs to be repositioned or its contrast improved so it is clearly readable regardless of what sits behind it. Fix: move the zoom level badge to a position that does not overlap the palette, or apply a background/border treatment (e.g. dark pill with gold text) that ensures visibility against any background.

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
