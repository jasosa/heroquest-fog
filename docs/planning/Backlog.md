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

### [ISSUE-010] Zoom level indicator hidden by color palette in Edit mode
Priority: medium
Impact: medium — users cannot tell current zoom level while placing pieces
Status: not_started
Complexity: low
Description: In Edit mode the zoom level display is obscured by the color palette / sidebar controls. The zoom indicator needs to be repositioned or its contrast improved so it is clearly readable regardless of what sits behind it. Fix: move the zoom level badge to a position that does not overlap the palette, or apply a background/border treatment (e.g. dark pill with gold text) that ensures visibility against any background.

### [ISSUE-011] Play mode popups use unreadable text color
Priority: high
Impact: high — text in dialogs is invisible, blocking normal gameplay
Status: in_progress
Complexity: low
Description: Popups in Play mode (e.g. RoomConfirmDialog, letter-marker tooltips, special-monster notes) render text in a color that is not visible against their background. Apply the same dialog style used in the Quest Library (dark parchment background, `#f0e6c8` body text, gold headings with Cinzel font) to all Play-mode popups so the content is legible.

### [FEAT-027] Quest create popup centered and floating
Priority: medium
Status: not_started
Complexity: low
Description: When the user clicks to create a new quest inside the Quest Library, the creation form currently appears inline. Replace it with a modal overlay (fixed-position backdrop, centered dialog) that floats above all other library elements. Style it consistently with the Edit Quest Book dialog: dark parchment background, gold border, Cinzel headings. Dismiss on backdrop click or Escape key.

### [FEAT-028] Visual label for quest order number in quest book assignment
Priority: medium
Status: not_started
Complexity: low
Description: When assigning a quest to a quest book, an input shows a bare number whose meaning is unclear. Add a visible text label (e.g. "Quest # in book") adjacent to the number input so the user understands they are setting the quest's order within the book. Consider also adding a short helper line below the field (e.g. "Position of this quest in the book's sequence").

### [FEAT-029] Tooltips on Play and Edit quest buttons in library cards
Priority: low
Status: not_started
Complexity: low
Description: The Play and Edit icon buttons on each quest card in the Quest Library have no accessible label or tooltip. Add a `title` attribute (or a small hover tooltip styled consistently with the app) to both buttons: "Play quest" and "Edit quest". This helps new users understand the buttons' purpose at a glance.

### [FEAT-030] Larger quest number display on quest cards
Priority: medium
Status: not_started
Complexity: low
Description: The quest-order number shown on each quest card in the library is too small to read comfortably. Increase the font size and visual weight of the number badge (e.g. bold Cinzel, larger `fontSize`, stronger gold color, optional circular/pill background) so the quest number is immediately visible when scanning the card list.

### [FEAT-031] Quest book background image opacity
Priority: low
Status: not_started
Complexity: low
Description: The background image used for quest book cards or the quest book showcase area is rendered at full opacity, competing with text and UI elements. Reduce the opacity of the background image to approximately 70% (e.g. using `opacity: 0.7` on the `<img>` layer or `rgba` overlay) so the content above it remains legible while the artwork is still visible.

### [FEAT-032] Edit Quest Book dialog — larger layout and improved file input style
Priority: medium
Status: not_started
Complexity: low
Description: The Edit Quest Book popup is too compact and the "Choose file" input for the cover image uses the default browser file-picker style which clashes with the app's dark-fantasy aesthetic. Increase the dialog's `min-width`/`min-height` to give fields more breathing room. Replace the raw `<input type="file">` with a styled upload area (e.g. a dashed gold-border drop zone with an upload icon and label) that matches the parchment/dark-fantasy visual language used elsewhere in the app.

### [FEAT-033] New Quest Book popup — centered modal matching Edit style
Priority: medium
Status: not_started
Complexity: low
Description: The "New Quest Book" creation form should appear as a centered modal overlay, identical in position, size, and visual style to the Edit Quest Book dialog (FEAT-032). Currently the two flows have inconsistent presentation. Unify them: same fixed-position backdrop, same dialog dimensions, same internal layout and form element styles.

### [FEAT-034] "Back to Library" button style matches Calibration mode
Priority: low
Status: not_started
Complexity: low
Description: The "Back to Library" button in Edit and Play mode has a different visual style to the equivalent navigation button used in Calibration mode. Unify the style so both buttons use the same appearance (same padding, font, color, border, and hover state) for a consistent navigation affordance across modes.

### [FEAT-035] Larger board area — stretch image to fill
Priority: medium
Status: not_started
Complexity: low
Description: In both Edit and Play modes the board area does not use all available screen space. Increase the board container's dimensions to occupy more of the viewport and ensure the board image (`board2.png` / `board.png`) stretches to fill the enlarged area (`width: 100%; height: 100%` with `background-size: 100% 100%` or equivalent). Verify cell hit-testing and piece rendering remain accurate after the resize.

### [FEAT-036] Pan board with mouse drag after zoom (remove scrollbars)
Priority: medium
Status: not_started
Complexity: medium
Description: After the user applies zoom in Edit or Play mode the board can only be navigated via scrollbars, which do not work on mobile. Remove the scrollbars entirely and implement pointer-based panning: when the board is zoomed in, the user can click-and-drag (or touch-and-drag) anywhere on the board container to scroll it. Use `pointer` events (`pointerdown`, `pointermove`, `pointerup`) so it works on both desktop and touch. The board container should use `overflow: hidden` and transform/scroll position should be updated programmatically. Cursor should change to `grab` / `grabbing` while panning. Panning must not interfere with cell clicks for reveal or piece placement — distinguish a pan gesture (pointer moved > threshold) from a tap/click (pointer released without significant movement).

### [FEAT-037] Improved quest description layout in Library
Priority: medium
Status: not_started
Complexity: low
Description: In Library mode the quest introduction/description text area is too small and the text is barely readable. Redesign the quest information section to give the description more vertical space, increase the font size to at least 13px, and ensure sufficient contrast. Consider displaying the description in the showcase right panel (already used for artwork) with a two-column approach: artwork on top, description text below, or a tabbed/toggle layout between artwork and description.

### [FEAT-038] Move board style buttons above the board
Priority: low
Status: not_started
Complexity: low
Description: The board style (tileset) selector buttons are currently positioned in the sidebar, below other controls, where they are easy to miss. Move them to a toolbar strip placed directly above the board image in both Edit and Play modes so the user can switch board styles without leaving their view of the board. Style the strip consistently with other board-adjacent controls (e.g. zoom buttons if present).

### [FEAT-039] Monster name tooltip on hover in Play mode
Priority: medium
Status: not_started
Complexity: low
Description: In Play mode, hovering over a placed monster piece should display a small tooltip showing the monster's name (and `specialNote` if the monster is marked as special). Use the same tooltip mechanism already used for letter markers on desktop (hover show/hide). On mobile, a brief tap should toggle the tooltip. The tooltip should be styled consistently with other Play-mode overlays: dark background, gold/parchment text, slightly rounded corners.
