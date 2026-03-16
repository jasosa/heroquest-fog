---
name: react-project-organization
description: Guidelines for organizing React + Vite projects for long-term maintainability. Apply when adding new files, refactoring large components, deciding where logic should live, or reviewing project structure.
---

# React Project Organization

Opinionated guide for structuring React + Vite applications. Focused on maintainability over cleverness.

## Core principle

**Files that change together, live together. Logic that can be tested alone, lives alone.**

## Rules

| Rule | When to apply |
|---|---|
| `structure-feature-colocation` | Adding a new feature or screen |
| `structure-component-size` | A file exceeds ~300 lines |
| `structure-pure-logic-separation` | Writing a helper function inside a `.jsx` file |
| `structure-hooks-extraction` | A component has 3+ `useState` or complex `useCallback` |
| `structure-data-config` | Defining a constant array/object inside a component |
| `structure-test-colocation` | Creating any test file |

## Recommended `src/` layout for this project

```
src/
  features/
    board/
      BoardGrid.jsx         ← grid container + fog SVG
      BoardCell.jsx         ← single cell (memo'd)
      TokenOverlay.jsx      ← piece image rendering
      DoorOverlay.jsx       ← door/secret-door rendering
    game/
      useGameState.js       ← all game state + handlers
    sidebar/
      EditPanel.jsx         ← tool selector in edit mode
      PlayPanel.jsx         ← controls in play mode
    library/
      QuestLibrary.jsx      ← already extracted ✓
  shared/
    theme.js                ← T colour palette ✓
    map.js                  ← board data (pure) ✓
    reveal.js               ← fog logic (pure, tested) ✓
    pieceGeometry.js        ← rotation utils (pure, tested) ✓
    questStorage.js         ← localStorage CRUD ✓
    pieces.js               ← PIECE_CATEGORIES + PIECES lookup
  App.jsx                   ← screen router only
  main.jsx
```

## Decision tree: where does this code go?

```
New code?
├── Pure function (no hooks, no JSX)?
│   └── → .js module, co-locate test next to it
├── React state + handlers for one feature?
│   └── → useFeatureState.js custom hook
├── JSX component?
│   ├── Used in one feature only?  → feature folder
│   └── Used in 2+ features?       → shared/ or components/
└── Static data / config?
    └── → module-level const in its own .js file
```

## File size budget

| File type | Soft limit | Hard limit |
|---|---|---|
| Component `.jsx` | 200 lines | 400 lines |
| Custom hook `.js` | 150 lines | 300 lines |
| Pure logic `.js` | 100 lines | 200 lines |
| Data/config `.js` | no limit | — |

Exceeding the soft limit is a signal to split. Exceeding the hard limit is a requirement to split.

## What NOT to do

- Do not create `components/`, `hooks/`, `utils/` type-based folders — they scatter related code
- Do not put pure logic inside `.jsx` files — it can't be imported by tests cleanly
- Do not inline large data arrays inside components — they create new references every render
- Do not nest features more than 2 levels deep — flat is better than deep
