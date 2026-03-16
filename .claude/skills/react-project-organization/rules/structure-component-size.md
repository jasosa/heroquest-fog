# structure-component-size

Split a file when it exceeds ~300 lines or contains more than one independently reusable concept.

## Why

Large single files become hard to navigate, review and test. The signal to split is not line count alone — it's whether a chunk can be named, reasoned about, and tested in isolation.

## Anti-pattern

```jsx
// heroquest-fog.jsx — 900 lines
// Contains: game state hook, board grid, token overlay,
// door overlay, sidebar, library screen, quest form…
```

## Correct pattern

Split along natural seams:

```
src/
  GameScreen.jsx          ← top-level screen router (~80 lines)
  features/
    board/
      BoardGrid.jsx       ← grid + fog SVG layer
      BoardCell.jsx       ← single cell (already memo'd)
      TokenOverlay.jsx    ← piece image rendering
      DoorOverlay.jsx     ← door image rendering
    game/
      useGameState.js     ← all game state + handlers
    sidebar/
      EditPanel.jsx       ← tool selector + category list
      PlayPanel.jsx       ← mode info + save button
    library/
      QuestLibrary.jsx    ← already extracted ✓
```

## Signals it's time to split

- You scroll past 300 lines looking for a component
- A component has its own internal state unrelated to siblings
- A helper function is longer than the component that calls it
- You want to unit-test one piece but the file has no exports
