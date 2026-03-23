# Reveal Logic (`src/reveal.js`)

`makeComputeReveal(board, rows, cols)` returns a `computeReveal(r, c, placed)` function.

- **Room cell** → flood fill within cells sharing the same room ID, blocked by `blocks: true` pieces.
- **Corridor cell** → for each of the 4 cardinal directions, collect parallel-lane starting cells (wide corridor detection), then cast an independent ray per lane.

## Wide Corridor Detection

A neighboring cell qualifies as a parallel start only if *both* the hero cell and the neighbor extend in the ray direction. This prevents T-junctions from incorrectly triggering multi-lane behavior (e.g. standing at col 16 looking right must not reveal the row-9 perpendicular corridor).
