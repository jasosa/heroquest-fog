# Backlog

Items are grouped by status, then by ID within each group.

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

### [FEAT-026] Quest book cover image
Priority: high
Status: committed
Complexity: low
Description: Allow a cover image to be assigned to a quest book. The image is displayed as the artwork in the showcase right panel (FEAT-023) when a quest from that book is selected.

Key changes:
- **Data model**: add an optional `coverImage` field to quest book objects in `hq_quest_books` (localStorage). Store the image as a base64 data URL (result of `FileReader.readAsDataURL`). `createQuestBook` and `updateQuestBook` in `questStorage.js` must accept and persist this field.
- **Create Book form** (sidebar in `QuestLibrary.jsx`): add a file input (`accept="image/*"`) below the description field. Label: "Cover image (optional)". On selection, read the file with `FileReader` and store the base64 string in component state; pass it to `createQuestBook`.
- **Edit Book dialog** (`EditQuestBookDialog.jsx`): add the same file input. Show a small preview (`40×40px`, `objectFit: cover`) of the current image if one exists. Allow clearing the image with a "× Remove" link next to the preview.
- **Showcase panel** (`QuestLibrary.jsx`): in the right artwork column, if the selected quest's book has a `coverImage`, render it as `<img src={coverImage} style={{ width:"100%", height:"100%", objectFit:"cover" }} />` replacing the ⚔ placeholder. The vignette overlay remains on top regardless.
- **No upload size limit enforced in UI** — images are stored as-is in localStorage; a note in the UI copy ("large images may slow the app") is sufficient.
- Depends on FEAT-023 for the showcase artwork slot.

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
