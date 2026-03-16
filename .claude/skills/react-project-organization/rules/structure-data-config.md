# structure-data-config

Static data and configuration belong in their own files, not inlined inside components.

## Why

Inline data arrays and config objects bloat component files, make data hard to share, and cause needless re-renders (new array reference every render). Extracting them to module-level constants makes them stable references and easy to import elsewhere.

## Anti-pattern

```jsx
// Inside a component or inside the module but mixed with JSX
function EditPanel() {
  const PIECE_CATEGORIES = [        // recreated on every render
    { id: "monsters", pieces: […] },
    { id: "traps",    pieces: […] },
  ];
  …
}
```

## Correct pattern

```js
// pieceData.js — pure data, no React import needed
export const PIECE_CATEGORIES = [
  { id: "monsters", label: "Monsters", pieces: […] },
  { id: "traps",    label: "Traps",    pieces: […] },
];

// Derived lookup map — built once at module load time
export const PIECES = Object.fromEntries(
  PIECE_CATEGORIES.flatMap(c => c.pieces).map(p => [p.id, p])
);
```

```jsx
// EditPanel.jsx
import { PIECE_CATEGORIES, PIECES } from './pieceData';
```

## Also applies to

- Theme constants → `theme.js`
- Board layout data → `map.js`
- URL/API base paths → `config.js`
- Feature flags → `flags.js`

## Rule

If a value doesn't depend on props, state, or a hook, it should be a module-level `const`, not inside a function or component.
