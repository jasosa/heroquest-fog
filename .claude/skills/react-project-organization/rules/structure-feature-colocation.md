# structure-feature-colocation

Group files by feature, not by type. Files that change together should live together.

## Why

Type-based folders (`/components`, `/hooks`, `/utils`) force you to jump between directories for every change. Feature folders keep the component, its hook, its helpers and its tests in one place — deleting a feature means deleting one folder.

## Anti-pattern

```
src/
  components/
    BoardCell.jsx
    TokenOverlay.jsx
    Sidebar.jsx
  hooks/
    useBoardState.js
    useSidebarState.js
  utils/
    boardGeometry.js
    sidebarHelpers.js
```

## Correct pattern

```
src/
  features/
    board/
      BoardCell.jsx
      TokenOverlay.jsx
      useBoardState.js
      boardGeometry.js
      board.test.js
    sidebar/
      Sidebar.jsx
      useSidebarState.js
      sidebarHelpers.js
  shared/
    theme.js
    storage.js
  App.jsx
```

## Rule of thumb

If two files are always edited together, they belong in the same folder. If a file is used by 3+ features, move it to `shared/`.
