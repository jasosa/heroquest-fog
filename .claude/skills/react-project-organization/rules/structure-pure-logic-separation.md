# structure-pure-logic-separation

Pure logic (no JSX, no hooks, no side effects) belongs in its own `.js` file, not inside a component file.

## Why

Pure functions are easy to unit-test, easy to reuse, and have zero React dependency. Keeping them inside `.jsx` files couples them to the component lifecycle unnecessarily and makes them invisible to tests unless the whole component tree is mounted.

## Anti-pattern

```jsx
// BoardGrid.jsx
function computeFogPolygons(fog, board, getTokenPos) { … } // pure, but buried in JSX file
function getCoveredCellKeys(anchorR, anchorC, cells, rotation) { … } // pure
function rotateCells90(cells) { … } // pure

export function BoardGrid() {
  const polygons = computeFogPolygons(…);
  …
}
```

## Correct pattern

```
src/
  reveal.js          ← fog-of-war logic (pure) + reveal.test.js ✓
  pieceGeometry.js   ← rotation/coverage (pure) + pieceGeometry.test.js ✓
  map.js             ← board data (pure data) ✓
  questStorage.js    ← localStorage CRUD (pure) ✓
```

Components import from these files. Tests import from these files directly, no component mounting needed.

## Rule

If a function takes only plain data and returns plain data, it does not belong in a `.jsx` file. Extract it to a `.js` module and export it.
