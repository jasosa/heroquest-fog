# Features

## Backlog

### [FEAT-001] As a user I want to see quests sorted by Quest Book and Quest number
Priority: medium
Status: done
Description: In the main window the quests should be sorted firts by Quest Book and then by Quest number. In case a quest doesn´t have a quest number the sorting order would be alphabetically

### [FEAT-002] As a user I want to be able to edit the quest book after the book is created
Priority: high
Status: done
Description: Once a quest book is created, name and description can't be edited. It should be possible to edit both (and other possible attributes in the future)

### [FEAT-003] As a user I want to add a quest to a quest book after it has been already created
Priority: medium
Status: done
Description: When a quest is created without adding it to any quest book, should be possible later to add it to a quest book. Or to move from one quest book to another

### [FEAT-004] As a user I want to see all quests buttons aligned to the boom in the quests screen
Priority: medium
Status: done
Description: In the Quest Library the buttons on each quest are not aligned. Depending on the text lenght of description of the quest the buttons are higher or lower on the quest card. I want all the buttons aligned independently of the text size;

### [FEAT-005] As a hero player I want to search for secret doors in play mode
Priority: high
Status: done
Description: Secret doors added in edit mode should be not visible to the hero players in edit mode until they search for them. To search for a secret door hero players will use a similar icon to the search for treasure one. If a secret door search icon has associated a hidden secret door in the board it will make it visible, otherwise it will show a message showing a message. In Edit mode should be possible to add a search for secret door icon in a similar way to the search for treasure icon. By default they won´t be associated to any secret door and it will have a default message to be shown in play mode. An already placed secret door icon can be associated to the search secret door icon and the default message can be overriden. Only one search for secret door icon can be placed on a room but more than one can be placed in corridors.

### [FEAT-006] As a hero player I want trap types to be hidden in play mode
Priority: high
Status: done
Description: Traps placed in edit mode are shown in play mode as a generic warning marker
(Trap_Warning.png) instead of their real icon — the specific trap type is hidden until
triggered. When a hero player clicks the warning marker, the real trap piece is revealed
(the warning disappears and the actual trap icon takes its place), and it stays revealed
for the rest of the session. A tooltip on the warning marker should inform the player that
clicking it will reveal the trap. In edit mode, all traps are always shown with their real
icons as normal. Revealed trap state is not persisted — it resets with the session.
Switching between play and edit mode does not reset revealed traps; only a session reset
(Reset Fog) clears them.

### [FEAT-007] As a hero player I don´t want to see hero starter icons in Play mode
Priority: high
Status: done
Description: Starter hero icons shouldn't be shown on play mode

### [FEAT-008] Edit mode panel should include same images for markers instead of the default icons
Priority: low
Status: not_started
Description: Edit mode panel should include same images for markers instead of the default icons. Make as wide as needed to make sure that the images are displayer properly

### [FEAT-009] Edit mode panel should be collapsable
Priority: low
Status: not_started
Description: Edit mode panel should be collapsable. By default it should be expanded. Should be closed by an icon and opened again with the same icon

### [FEAT-010] As I hero player I want to know where to place my hero when a quest starts
Priority: medium
Status: not_started
Description: At the beggining of each quest a popup should indicate to the players where to put their hero figurines. The default message should say something like "Place your heroes in the stairway". The message should be editable in Edit mode as well.


