# Backlog

Items are grouped by status, then by ID within each group.

---

## Committed

### [FEAT-018] Navigation and mode-switch warnings
Priority: medium
Status: committed
Complexity: low
Description: Two safeguard warnings:
1. **Play → Edit mode switch mid-session**: Show a notice that opened chests, revealed traps, and search counts will carry over to the next play session (they are not reset).
2. **Back to Library with unsaved changes**: When the DM navigates back to the quest library while the current quest has unsaved edits, prompt a confirmation ("Unsaved changes will be lost — go back anyway?").

### [FEAT-019] Trap warning visual indicator (glow)
Priority: medium
Status: committed
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

### [FEAT-022] Dark theme overhaul — JIME-inspired high-contrast palette
Priority: high
Status: not_started
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
Status: not_started
Complexity: medium
Description: Redesign the quest card layout in `QuestLibrary.jsx` to match the JIME dark-stone card pattern and fix the accessibility and usability issues identified in the UX review.

Key changes:
- Card background: `#1e1a12` (dark stone) with a `3px solid #f0c040` left accent border and `box-shadow: 0 2px 12px #00000066`
- Typography hierarchy inside card: Cinzel 15px/600 gold title → IM Fell English 11px italic muted meta (book + quest number) → IM Fell English 12px body text (2-line clamp) → Cinzel 10px faint date
- Button row: replace icon-only buttons with labelled buttons; "Play" (crimson fill, gold border) and "Edit" (dark fill, muted border) as primary actions; keep icon buttons for assign-book (☰), export (⬇), delete (×) but with `aria-label` and minimum 44px touch target height
- All interactive elements minimum 44px tall
- Page background in library uses the new dark `pageBg` from FEAT-022; the right content panel gets a subtle lighter dark container (`#1a1710`) to frame the card grid
- Depends on FEAT-022 for the colour tokens

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

### [FEAT-025] Remove legend from play mode sidebar
Priority: low
Status: committed
Complexity: low
Description: The play mode sidebar shows a long room-colour legend that takes up most of the vertical space and is not useful during play. Remove it entirely.

### [ISSUE-005] RoomConfirmDialog missing backdrop dismiss
Priority: low
Impact: low — UX friction on mobile
Status: not_started
Complexity: low
Description: Clicking outside the RoomConfirmDialog does nothing. All other dialogs in the app dismiss on backdrop click. Fix: add `onMouseDown` handler on the backdrop overlay that calls the cancel action, with `e.stopPropagation()` on the inner content div.

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
