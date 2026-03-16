# structure-test-colocation

Place test files next to the file they test, not in a separate `__tests__` folder.

## Why

Co-located tests are discovered instantly, deleted automatically when the source is deleted, and make the coverage of a module immediately visible. A separate test folder creates maintenance overhead and obscures which modules lack tests.

## Anti-pattern

```
src/
  reveal.js
  pieceGeometry.js
__tests__/
  reveal.test.js
  pieceGeometry.test.js
```

## Correct pattern

```
src/
  reveal.js
  reveal.test.js          ← right next to the source ✓
  pieceGeometry.js
  pieceGeometry.test.js   ← right next to the source ✓
```

## What to test (and what not to)

| Test here | Skip |
|---|---|
| Pure logic modules (`.js`) | Component rendering details |
| State machines / reducers | Inline styles or pixel values |
| Data transformations | Third-party library behaviour |
| Storage serialisation | Implementation internals |

## Naming

- `<module>.test.js` for unit tests (Vitest / Jest)
- `<module>.test.jsx` if JSX is needed (component integration tests)
- Never suffix with `.spec` unless the project already uses that convention
