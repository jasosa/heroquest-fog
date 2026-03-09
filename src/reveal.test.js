import { describe, it, expect } from "vitest";
import { makeComputeReveal } from "./reveal.js";

// ─── Test board (8 rows × 9 cols) ───────────────────────────────────────────
//
//    0    1    2    3    4    5    6    7    8
// 0: W    W    W    W    W    W    W    W    W
// 1: W    R1   R1   C    R2   R2   W    W    W
// 2: W    R1   R1   C    R2   R2   W    W    W
// 3: W    R1   R1   C    R2   R2   W    W    W
// 4: W    W    W    C    C    W    W    W    W   ← double corridor starts
// 5: W    W    W    C    C    W    W    W    W
// 6: W    W    W    C    C    W    W    W    W
// 7: W    W    W    W    W    W    W    W    W
//
// R1 = 2×3 room  (rows 1-3, cols 1-2)
// R2 = 2×3 room  (rows 1-3, cols 4-5)
// Single-wide corridor: rows 1-3, col 3  (connects R1 and R2)
// Double-wide corridor: rows 4-6, cols 3-4

const W = null, C = "C", R1 = "R1", R2 = "R2";

const BOARD = [
  [W,  W,  W,  W,  W,  W,  W,  W,  W],
  [W, R1, R1,  C, R2, R2,  W,  W,  W],
  [W, R1, R1,  C, R2, R2,  W,  W,  W],
  [W, R1, R1,  C, R2, R2,  W,  W,  W],
  [W,  W,  W,  C,  C,  W,  W,  W,  W],
  [W,  W,  W,  C,  C,  W,  W,  W,  W],
  [W,  W,  W,  C,  C,  W,  W,  W,  W],
  [W,  W,  W,  W,  W,  W,  W,  W,  W],
];
const ROWS = 8, COLS = 9;

const reveal = makeComputeReveal(BOARD, ROWS, COLS);

// Helper: build a placed-piece map from an array of cell keys (all blocking).
const blockerAt = (...keys) =>
  Object.fromEntries(keys.map(k => [k, { type: "blocker", blocks: true }]));

// Helper: assert a Set contains exactly the given keys (no more, no less).
function expectExactly(set, ...keys) {
  expect([...set].sort()).toEqual(keys.sort());
}

// ─── Null / wall cells ───────────────────────────────────────────────────────

describe("wall cells", () => {
  it("returns empty set for a wall cell", () => {
    expect(reveal(0, 0, {}).size).toBe(0);
  });

  it("returns empty set for any border wall", () => {
    expect(reveal(7, 3, {}).size).toBe(0);
    expect(reveal(0, 4, {}).size).toBe(0);
  });
});

// ─── Room flood fill ─────────────────────────────────────────────────────────

describe("room reveal (flood fill)", () => {
  it("reveals the entire R1 room from any cell in it", () => {
    const expected = ["1,1","1,2","2,1","2,2","3,1","3,2"];
    expectExactly(reveal(1, 1, {}), ...expected);
    expectExactly(reveal(2, 2, {}), ...expected);
    expectExactly(reveal(3, 1, {}), ...expected);
  });

  it("reveals the entire R2 room from any cell in it", () => {
    const expected = ["1,4","1,5","2,4","2,5","3,4","3,5"];
    expectExactly(reveal(1, 4, {}), ...expected);
    expectExactly(reveal(2, 5, {}), ...expected);
  });

  it("does not cross room boundaries into corridors", () => {
    const vis = reveal(2, 1, {});
    expect(vis.has("2,3")).toBe(false); // col 3 is corridor, not R1
  });

  it("blocker in room is itself invisible and blocks flood fill through it", () => {
    // (2,2) is blocked — it is NOT revealed, cells reachable only through it are cut off
    const vis = reveal(2, 1, blockerAt("2,2"));
    expect(vis.has("2,2")).toBe(false);
    // cells reachable via other paths still visible
    expect(vis.has("1,1")).toBe(true);
    expect(vis.has("3,2")).toBe(true);
  });
});

// ─── Single-wide corridor ────────────────────────────────────────────────────

describe("single-wide corridor reveal (ray cast)", () => {
  it("casts rays up and down from a mid-corridor cell", () => {
    // (2,3) is the single-wide corridor between the two rooms
    const vis = reveal(2, 3, {});
    expect(vis.has("2,3")).toBe(true);
    expect(vis.has("1,3")).toBe(true); // up
    expect(vis.has("3,3")).toBe(true); // down
    // continues into the double corridor below
    expect(vis.has("4,3")).toBe(true);
    expect(vis.has("5,3")).toBe(true);
    expect(vis.has("6,3")).toBe(true);
  });

  it("stops at room boundaries — does not reveal room cells", () => {
    const vis = reveal(2, 3, {});
    // rooms are adjacent but are not corridors, so not in corridor vis
    expect(vis.has("2,1")).toBe(false); // R1
    expect(vis.has("2,4")).toBe(false); // R2
  });

  it("stops at wall (null) cells", () => {
    const vis = reveal(1, 3, {});
    expect(vis.has("0,3")).toBe(false); // row 0 is wall
  });

  it("blocker in corridor is visible but stops the ray", () => {
    const vis = reveal(6, 3, blockerAt("4,3"));
    expect(vis.has("4,3")).toBe(true);  // blocker itself is visible
    expect(vis.has("3,3")).toBe(false); // beyond blocker — not visible
    expect(vis.has("2,3")).toBe(false);
  });
});

// ─── Double-wide corridor ────────────────────────────────────────────────────

describe("double-wide corridor reveal (independent lanes)", () => {
  it("reveals both lanes when standing in the double corridor", () => {
    const vis = reveal(5, 3, {});
    // both col 3 and col 4 should be visible
    expect(vis.has("5,3")).toBe(true);
    expect(vis.has("5,4")).toBe(true);
    expect(vis.has("4,3")).toBe(true);
    expect(vis.has("4,4")).toBe(true);
    expect(vis.has("6,3")).toBe(true);
    expect(vis.has("6,4")).toBe(true);
  });

  it("both lanes visible from col 4 as well", () => {
    const vis = reveal(5, 4, {});
    expect(vis.has("5,3")).toBe(true);
    expect(vis.has("5,4")).toBe(true);
    expect(vis.has("4,4")).toBe(true);
    expect(vis.has("6,4")).toBe(true);
  });

  it("a blocker in lane col-3 stops only that lane — col-4 continues", () => {
    // blocker at (4,3): ray from col-3 stops there, ray from col-4 continues up
    const vis = reveal(6, 3, blockerAt("4,3"));
    expect(vis.has("4,3")).toBe(true);  // blocker visible
    expect(vis.has("3,3")).toBe(false); // beyond blocker in col-3
    // col-4 lane is independent — continues past row 4
    expect(vis.has("4,4")).toBe(true);
  });

  it("a blocker in lane col-4 stops only that lane — col-3 continues", () => {
    const vis = reveal(6, 3, blockerAt("4,4"));
    expect(vis.has("4,4")).toBe(true);  // blocker visible
    // col-3 lane is unaffected
    expect(vis.has("3,3")).toBe(true);
    expect(vis.has("2,3")).toBe(true);
    expect(vis.has("1,3")).toBe(true);
  });

  it("blockers in both lanes each stop independently at different rows", () => {
    // col-3 blocked at row 5, col-4 blocked at row 4
    const vis = reveal(6, 3, blockerAt("5,3", "4,4"));

    // col-3: stops at row 5
    expect(vis.has("5,3")).toBe(true);  // blocker visible
    expect(vis.has("4,3")).toBe(false); // beyond col-3 blocker

    // col-4: hero at (6,3) going UP: (5,4) revealed, then (4,4) blocker → add, break
    expect(vis.has("5,4")).toBe(true);  // visible (before the blocker)
    expect(vis.has("4,4")).toBe(true);  // blocker itself visible
    expect(vis.has("3,4")).toBe(false); // beyond the blocker — not visible
  });

  it("double corridor does not reveal around T-junction corners", () => {
    // (3,3) is the bottom of the single-wide section, bordering the double corridor.
    // Standing at (3,3), looking left/right should NOT reveal cells in adjacent rows
    // that are around corners.
    const vis = reveal(3, 3, {});
    // The room cells are not revealed through the corridor
    expect(vis.has("3,1")).toBe(false); // R1 cell — room, not corridor
    expect(vis.has("3,4")).toBe(false); // R2 cell — room, not corridor
  });
});

// ─── Multi-cell blockers (coveredCells) ──────────────────────────────────────

describe("multi-cell blocker (coveredCells)", () => {
  // Helper: a 2-cell blocking piece whose coveredCells are explicitly stored.
  const multiBlocker = (anchorKey, ...extraCells) => ({
    [anchorKey]: { type: "blocker", blocks: true, coveredCells: [anchorKey, ...extraCells] },
  });

  it("blocks the ray at every covered cell, not just the anchor", () => {
    // 2-cell horizontal blocker at (4,3)-(4,4) in the double corridor.
    // Hero at (6,3) looking up: ray in col-3 should stop at (4,3) and ray in
    // col-4 should stop at (4,4) — both covered cells are visible.
    const vis = reveal(6, 3, multiBlocker("4,3", "4,4"));

    // Both covered cells are visible (the blocker is shown)
    expect(vis.has("4,3")).toBe(true);
    expect(vis.has("4,4")).toBe(true);

    // Nothing beyond either covered cell is visible
    expect(vis.has("3,3")).toBe(false);
    expect(vis.has("3,4")).toBe(false);
  });

  it("legacy single-cell blocker (no coveredCells) still works via fallback", () => {
    // Placed entry without coveredCells — falls back to [anchorKey]
    const vis = reveal(6, 3, { "4,3": { type: "blocker", blocks: true } });
    expect(vis.has("4,3")).toBe(true);
    expect(vis.has("3,3")).toBe(false);
    // col-4 is unaffected — no coveredCells means only anchor blocks
    expect(vis.has("4,4")).toBe(true);
    expect(vis.has("3,4")).toBe(false); // col-4 stops at R2 boundary
  });

  it("non-blocking piece with coveredCells does not block visibility", () => {
    const chest = (anchorKey, ...extra) => ({
      [anchorKey]: { type: "chest", blocks: false, coveredCells: [anchorKey, ...extra] },
    });
    const vis = reveal(6, 3, chest("4,3", "4,4"));
    // Chest doesn't block — ray continues past it
    expect(vis.has("4,3")).toBe(true);
    expect(vis.has("3,3")).toBe(true);
    expect(vis.has("2,3")).toBe(true);
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("no pieces placed — placed={} works identically to placed with non-blockers", () => {
    const withEmpty   = reveal(5, 3, {});
    const withMonster = reveal(5, 3, { "5,3": { type: "goblin", blocks: false } });
    expect([...withEmpty].sort()).toEqual([...withMonster].sort());
  });

  it("multiple non-blocking pieces do not affect visibility", () => {
    const vis = reveal(2, 1, {
      "1,1": { type: "goblin",   blocks: false },
      "3,2": { type: "skeleton", blocks: false },
    });
    // Full R1 room still visible
    expectExactly(vis, "1,1","1,2","2,1","2,2","3,1","3,2");
  });
});
