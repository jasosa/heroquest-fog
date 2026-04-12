# Backlog

Items are grouped by status, then by ID within each group.

---

## Committed

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

---

## Not Started

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

### [FEAT-023] Quest Library card grid redesign
Priority: high
Status: committed
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
Status: not_started
Complexity: medium
Description: Polish the game sidebar (`Sidebar.jsx`) and edit panel (`EditPanel.jsx`) to fix the usability and readability issues identified in the UX review.

Key changes:
- **Input fields**: increase to `fontSize: 13`, `padding: 9px 10px`; input border to `1.5px solid #9a7a30`; add `onFocus`/`onBlur` handlers that highlight the border to `#f0c040` when active (since CSS pseudo-classes can't be used in inline styles)
- **Section headers**: replace invisible `borderTop` dividers with a gold fade-rule pattern — two `linear-gradient` lines flanking a centred Cinzel uppercase label — for every major section (Quest Info, Mode, Pieces, Board Style)
- **Mode toggle (Play / Edit)**: increase to `padding: 12px 0`, `fontSize: 12`, `letterSpacing: 3`; active state adds `textShadow: "0 0 8px #f0c04088"` glow
- **Category tabs** (Monsters / Traps / Furniture / Markers): minimum `fontSize: 11`, `padding: 7px 10px`, `minHeight: 36px`
- **Piece list items**: minimum `minHeight: 48px`, icon size `36×36px`, `fontSize: 13`, `gap: 12px`
- **Sidebar width**: increase from 270px to 300px (collapsed state stays 44px)
- **Remove developer footer**: remove the "v0.2 — Real HeroQuest board / 22 rooms" text from the bottom of the sidebar
- Depends on FEAT-022 for colour tokens

### [ISSUE-005] RoomConfirmDialog missing backdrop dismiss
Priority: low
Impact: low — UX friction on mobile
Status: not_started
Complexity: low
Description: Clicking outside the RoomConfirmDialog does nothing. All other dialogs in the app dismiss on backdrop click. Fix: add `onMouseDown` handler on the backdrop overlay that calls the cancel action, with `e.stopPropagation()` on the inner content div.

### [ISSUE-009] Edit mode action buttons are structurally inconsistent
Priority: low
Impact: low — visual inconsistency
Status: not_started
Complexity: low
Description: The edit affordance buttons on placed pieces (pencil for note/search markers, star for monsters, warning for chests) use three different element types and sizes despite serving the same purpose. Fix: all use a `<button>` element, 16×16px circle, positioned top-right of the piece image. The chest warning button currently uses a `<div>` with `onMouseDown` — convert it to `<button>` (keep `onMouseDown` to prevent cell click propagation).
