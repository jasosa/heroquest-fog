# Backlog

Items are grouped by status, then by ID within each group.

---

## Done

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

---

## Not Started

### [FEAT-009] Edit mode panel should be collapsable
Priority: low
Status: not_started
Complexity: low
Description: Edit mode panel should be collapsable. By default it should be expanded. Should be closed with an icon and opened again with the same icon.

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

### [FEAT-015] Trap interaction overhaul
Priority: high
Status: committed
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

### [FEAT-018] Navigation and mode-switch warnings
Priority: medium
Status: not_started
Complexity: low
Description: Two safeguard warnings:
1. **Play → Edit mode switch mid-session**: Show a notice that opened chests, revealed traps, and search counts will carry over to the next play session (they are not reset).
2. **Back to Library with unsaved changes**: When the DM navigates back to the quest library while the current quest has unsaved edits, prompt a confirmation ("Unsaved changes will be lost — go back anyway?").

### [FEAT-019] Trap warning visual indicator (glow)
Priority: medium
Status: not_started
Complexity: low
Description: Spotted-but-unrevealed trap warnings should have a red/orange glow to signal interactivity, distinct from the amber/gold glow used on chests. Amber = treasure opportunity; red = physical danger — players must distinguish them instantly on a small screen without reading tooltips.

UX recommendation: apply a two-layer `drop-shadow` matching the chest glow structure but in crimson/red:
`drop-shadow(0 0 4px #c0392b) drop-shadow(0 0 8px #e74c3caa)`

This mirrors the chest's inner/outer layering so both elements feel like the same visual language while remaining distinguishable by color. Red also aligns with the existing theme danger colors (`T.accent` / `T.title` are already deep crimson). Implementation is a one-line change in the trap warning block of `TokenOverlay.jsx`.

### [ISSUE-005] RoomConfirmDialog missing backdrop dismiss
Priority: low
Impact: low — UX friction on mobile
Status: not_started
Complexity: low
Description: Clicking outside the RoomConfirmDialog does nothing. All other dialogs in the app dismiss on backdrop click. Fix: add `onMouseDown` handler on the backdrop overlay that calls the cancel action, with `e.stopPropagation()` on the inner content div.

### [ISSUE-006] Chest click that misses image falls through to fog reveal
Priority: medium
Impact: medium — affects gameplay
Status: not_started
Complexity: low
Description: If a tap lands on a chest cell but misses the image area (the image is smaller than the cell at imageScale 0.85), `handleCell` runs the fog reveal path instead of opening the chest. Fix: add a chest intercept check in `handleCell` in `useGameState.js`, same pattern as the existing trap intercept (`shouldInterceptTrapClick`).

### [ISSUE-007] Special monster notes inaccessible on mobile
Priority: medium
Impact: medium — affects gameplay on touch devices
Status: not_started
Complexity: low
Description: In play mode, special monster notes are only accessible via hover. On mobile/tablet they are completely inaccessible. Fix: in play mode, tapping a special monster (one with `isSpecial: true`) shows the note using the shared tooltip mechanism. A second tap or a tap elsewhere dismisses it — same pattern as note markers.

### [ISSUE-008] Empty note marker gives no feedback in play mode
Priority: low
Impact: low — confusing UX
Status: not_started
Complexity: low
Description: Clicking a note marker with an empty note field in play mode does nothing silently. Players assume it is broken. Fix: show a fallback message (e.g. "No note.") so players know the click registered.

### [ISSUE-009] Edit mode action buttons are structurally inconsistent
Priority: low
Impact: low — visual inconsistency
Status: not_started
Complexity: low
Description: The edit affordance buttons on placed pieces (pencil for note/search markers, star for monsters, warning for chests) use three different element types and sizes despite serving the same purpose. Fix: all use a `<button>` element, 16×16px circle, positioned top-right of the piece image. The chest warning button currently uses a `<div>` with `onMouseDown` — convert it to `<button>` (keep `onMouseDown` to prevent cell click propagation).

### [ISSUE-010] SecretDoorConfigDialog cancel saves instead of discarding changes
Priority: low
Impact: low — unexpected behavior
Status: not_started
Complexity: low
Description: The cancel action in `SecretDoorConfigDialog` re-saves the existing values rather than discarding unsaved changes. This is opaque to the DM and inconsistent with every other cancel in the app. Fix: cancel should discard uncommitted state without writing to the placed piece.
