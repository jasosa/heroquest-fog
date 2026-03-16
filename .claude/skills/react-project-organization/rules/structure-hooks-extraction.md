# structure-hooks-extraction

Extract complex state logic into a custom hook when a component manages more than 2–3 related state variables or has non-trivial event handlers.

## Why

Custom hooks make component files shorter, make logic reusable, and make the state machine testable without rendering. A component's job is layout and interaction — not state arithmetic.

## Anti-pattern

```jsx
// GameScreen.jsx — 200 lines of useState + useCallback before any JSX
export function GameScreen() {
  const [fog, setFog] = useState(new Set());
  const [placed, setPlaced] = useState({});
  const [doors, setDoors] = useState({});
  const [mode, setMode] = useState("play");
  const [tool, setTool] = useState("goblin");
  const [rotation, setRotation] = useState(0);
  const [lastClick, setLastClick] = useState(null);

  const handleCell = useCallback((r, c) => { … }, []);
  const handleCellRotate = useCallback((r, c) => { … }, []);
  // … 150 more lines before return (
```

## Correct pattern

```js
// useGameState.js
export function useGameState({ initialPlaced, initialDoors, initialMode }) {
  const [fog, setFog] = useState(…);
  // … all state and handlers
  return { fog, placed, doors, mode, tool, rotation, handleCell, … };
}
```

```jsx
// GameScreen.jsx
export function GameScreen({ quest }) {
  const gameState = useGameState({ initialPlaced: quest.placed, … });
  return <BoardGrid {...gameState} />;  // component is now ~50 lines
}
```

## Naming convention

- `use<Feature>State` — owns the state machine for a feature
- `use<Feature>` — encapsulates a side-effect or external resource
- Never prefix with `get` or `fetch` — those are plain functions, not hooks
