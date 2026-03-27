import { describe, it, expect } from "vitest";
import { hasHeroStart, incrementSearchCount, resetSearchCounts, addRevealedTrap, shouldInterceptTrapClick, computeHeroStartFog, isCorridorConnected, isCellBlocked } from "./useGameState.js";

describe("hasHeroStart", () => {
  it("returns false for empty placed", () => {
    expect(hasHeroStart({})).toBe(false);
  });

  it("returns false when no start piece is placed", () => {
    expect(hasHeroStart({ "1,1": { type: "goblin" } })).toBe(false);
  });

  it("returns true when a start piece is placed", () => {
    expect(hasHeroStart({ "3,3": { type: "start" } })).toBe(true);
  });

  it("returns true when start piece is among other pieces", () => {
    expect(hasHeroStart({ "1,1": { type: "goblin" }, "2,2": { type: "start" } })).toBe(true);
  });

  it("returns true when start is an overlayMarker on furniture", () => {
    expect(hasHeroStart({ "3,3": { type: "stairs", overlayMarker: "start" } })).toBe(true);
  });
});

describe("incrementSearchCount", () => {
  it("increments count from 0 to 1 for a new region", () => {
    expect(incrementSearchCount({}, "R1")).toEqual({ R1: 1 });
  });

  it("increments an existing count", () => {
    expect(incrementSearchCount({ R1: 2 }, "R1")).toEqual({ R1: 3 });
  });

  it("does not increment beyond 4", () => {
    expect(incrementSearchCount({ R1: 4 }, "R1")).toEqual({ R1: 4 });
  });

  it("does not affect other regions", () => {
    const result = incrementSearchCount({ R1: 1, R2: 2 }, "R1");
    expect(result["R2"]).toBe(2);
  });

  it("returns a new object (immutable)", () => {
    const counts = { R1: 1 };
    expect(incrementSearchCount(counts, "R1")).not.toBe(counts);
  });
});

describe("incrementSearchCount idempotency under double-call", () => {
  it("calling twice on the same counts object increments by 2 (documents the problem)", () => {
    const counts = {};
    const once  = incrementSearchCount(counts, "R1");
    const twice = incrementSearchCount(once,   "R1");
    expect(twice["R1"]).toBe(2); // two calls = two increments
  });

  it("applying increment to the ORIGINAL counts twice still gives 1 (pure-function safe pattern)", () => {
    // The safe pattern: read regionId from a ref, call setState(null) and
    // setSearchedCounts(prev => increment(prev)) as two separate calls.
    // Each updater only sees the latest state, so double-invocation is safe.
    const counts = {};
    // Simulate React calling the updater twice with the same input
    const result1 = incrementSearchCount(counts, "R1");
    const result2 = incrementSearchCount(counts, "R1"); // same input → same output
    expect(result1).toEqual(result2);                   // idempotent on same input
    expect(result1["R1"]).toBe(1);                      // only 1 increment
  });
});

describe("addRevealedTrap", () => {
  it("adds a new key to an empty Set", () => {
    const result = addRevealedTrap(new Set(), "3,5");
    expect(result.has("3,5")).toBe(true);
  });

  it("adds a key to a non-empty Set", () => {
    const prev = new Set(["1,2"]);
    const result = addRevealedTrap(prev, "3,5");
    expect(result.has("1,2")).toBe(true);
    expect(result.has("3,5")).toBe(true);
  });

  it("returns a new Set (immutable)", () => {
    const prev = new Set(["1,2"]);
    const result = addRevealedTrap(prev, "3,5");
    expect(result).not.toBe(prev);
  });

  it("adding a key already present does not duplicate", () => {
    const prev = new Set(["3,5"]);
    const result = addRevealedTrap(prev, "3,5");
    expect(result.size).toBe(1);
  });
});

describe("resetSearchCounts", () => {
  it("returns an empty object", () => {
    expect(resetSearchCounts({ R1: 3, R2: 1 })).toEqual({});
  });

  it("returns a new object (immutable)", () => {
    const counts = { R1: 1 };
    expect(resetSearchCounts(counts)).not.toBe(counts);
  });
});

describe("shouldInterceptTrapClick", () => {
  const trapPiece = { type: "pit" };
  const nonTrapPiece = { type: "goblin" };

  it("returns false when cell is fogged (not yet revealed)", () => {
    expect(shouldInterceptTrapClick(trapPiece, false, false)).toBe(false);
  });

  it("returns true when cell is revealed and trap not yet revealed", () => {
    expect(shouldInterceptTrapClick(trapPiece, true, false)).toBe(true);
  });

  it("returns false when trap has already been revealed", () => {
    expect(shouldInterceptTrapClick(trapPiece, true, true)).toBe(false);
  });

  it("returns false when there is no piece at the cell", () => {
    expect(shouldInterceptTrapClick(null, true, false)).toBe(false);
  });

  it("returns false when the piece is not a trap", () => {
    expect(shouldInterceptTrapClick(nonTrapPiece, true, false)).toBe(false);
  });
});

describe("isCorridorConnected", () => {
  it("returns true when revealSet and fog share a key", () => {
    const revealSet = new Set(["3,5", "3,6"]);
    const fog = new Set(["3,6", "4,6"]);
    expect(isCorridorConnected(0, 0, revealSet, fog, {}, {})).toBe(true);
  });

  it("returns false when revealSet and fog share no keys", () => {
    const revealSet = new Set(["3,5", "3,6"]);
    const fog = new Set(["1,1", "1,2"]);
    expect(isCorridorConnected(0, 0, revealSet, fog, {}, {})).toBe(false);
  });

  it("returns false when revealSet is empty and fog is non-empty", () => {
    const revealSet = new Set();
    const fog = new Set(["1,1", "2,2"]);
    expect(isCorridorConnected(0, 0, revealSet, fog, {}, {})).toBe(false);
  });

  it("returns false when revealSet is non-empty and fog is empty", () => {
    const revealSet = new Set(["3,5"]);
    const fog = new Set();
    expect(isCorridorConnected(0, 0, revealSet, fog, {}, {})).toBe(false);
  });

  it("returns true when the clicked cell itself is in both revealSet and fog (already-revealed corridor re-click)", () => {
    const revealSet = new Set(["5,10", "5,11"]);
    const fog = new Set(["5,10"]);
    expect(isCorridorConnected(0, 0, revealSet, fog, {}, {})).toBe(true);
  });
});

describe("isCorridorConnected — Bug A: blocking pieces excluded", () => {
  it("only fog overlap is a blocking piece → false", () => {
    const revealSet = new Set(["3,5"]);
    const fog = new Set(["3,5"]);
    const placed = { "3,5": { type: "boulder", blocks: true, coveredCells: ["3,5"] } };
    const doors = {};
    expect(isCorridorConnected(3, 4, revealSet, fog, placed, doors)).toBe(false);
  });

  it("non-blocking fog overlap present alongside blocker → true", () => {
    const revealSet = new Set(["3,5", "3,6"]);
    const fog = new Set(["3,5", "3,6"]);
    const placed = { "3,5": { type: "boulder", blocks: true, coveredCells: ["3,5"] } };
    const doors = {};
    expect(isCorridorConnected(3, 4, revealSet, fog, placed, doors)).toBe(true);
  });

  it("multi-cell blocker — overlap is a coveredCell, not the anchor → false", () => {
    const revealSet = new Set(["3,5"]);
    const fog = new Set(["3,5"]);
    const placed = { "3,4": { type: "boulder", blocks: true, coveredCells: ["3,4", "3,5"] } };
    const doors = {};
    expect(isCorridorConnected(3, 3, revealSet, fog, placed, doors)).toBe(false);
  });

  it("blocker with no coveredCells — falls back to anchor → false", () => {
    const revealSet = new Set(["3,5"]);
    const fog = new Set(["3,5"]);
    const placed = { "3,5": { type: "boulder", blocks: true } };
    const doors = {};
    expect(isCorridorConnected(3, 4, revealSet, fog, placed, doors)).toBe(false);
  });
});

describe("isCorridorConnected — Bug B: door connection", () => {
  it("corridor is sideA of door, sideB in fog → true", () => {
    // door anchor "5,10" rotation 0 (sideB = "5,11"), corridor at sideA "5,10"
    const doors = { "5,10": { rotation: 0 } };
    const fog = new Set(["5,11"]);
    const revealSet = new Set(["5,10"]);
    expect(isCorridorConnected(5, 10, revealSet, fog, {}, doors)).toBe(true);
  });

  it("corridor is sideB of door, sideA in fog → true", () => {
    // door anchor "5,10" rotation 0 (sideB = "5,11"), corridor at sideB "5,11"
    const doors = { "5,10": { rotation: 0 } };
    const fog = new Set(["5,10"]);
    const revealSet = new Set(["5,11"]);
    expect(isCorridorConnected(5, 11, revealSet, fog, {}, doors)).toBe(true);
  });

  it("door exists but neither side in fog → false", () => {
    const doors = { "5,10": { rotation: 0 } };
    const fog = new Set();
    const revealSet = new Set(["5,10"]);
    expect(isCorridorConnected(5, 10, revealSet, fog, {}, doors)).toBe(false);
  });

  it("rotation 1 (bottom edge, sideB='6,10'), corridor at sideB, sideA in fog → true", () => {
    const doors = { "5,10": { rotation: 1 } };
    const fog = new Set(["5,10"]);
    const revealSet = new Set(["6,10"]);
    expect(isCorridorConnected(6, 10, revealSet, fog, {}, doors)).toBe(true);
  });

  it("unrelated door (far away), corridor not adjacent → false", () => {
    const doors = { "0,0": { rotation: 0 } };
    const fog = new Set(["0,1"]);
    const revealSet = new Set();
    expect(isCorridorConnected(5, 10, revealSet, fog, {}, doors)).toBe(false);
  });

  it("no doors → false", () => {
    const doors = {};
    const fog = new Set();
    const revealSet = new Set();
    expect(isCorridorConnected(5, 10, revealSet, fog, {}, doors, new Set())).toBe(false);
  });
});

describe("isCorridorConnected — secret door connection", () => {
  it("returns true when adjacent cell has a revealed secret door (above)", () => {
    // corridor at 5,10 — secret door revealed at 4,10 (above)
    expect(isCorridorConnected(5, 10, new Set(), new Set(), {}, {}, new Set(["4,10"]))).toBe(true);
  });

  it("returns true when adjacent cell has a revealed secret door (right)", () => {
    expect(isCorridorConnected(5, 10, new Set(), new Set(), {}, {}, new Set(["5,11"]))).toBe(true);
  });

  it("returns false when secret door exists but is not adjacent", () => {
    expect(isCorridorConnected(5, 10, new Set(), new Set(), {}, {}, new Set(["0,0"]))).toBe(false);
  });

  it("returns false when revealedSecretDoors is empty", () => {
    expect(isCorridorConnected(5, 10, new Set(), new Set(), {}, {}, new Set())).toBe(false);
  });
});

describe("isCellBlocked", () => {
  it("returns false for empty placed", () => {
    expect(isCellBlocked("3,5", {})).toBe(false);
  });

  it("returns true when a blocking piece's anchor matches the cell", () => {
    expect(isCellBlocked("3,5", { "3,5": { type: "boulder", blocks: true, coveredCells: ["3,5"] } })).toBe(true);
  });

  it("returns true when the cell is a coveredCell of a blocking piece", () => {
    expect(isCellBlocked("3,5", { "3,4": { type: "boulder", blocks: true, coveredCells: ["3,4", "3,5"] } })).toBe(true);
  });

  it("returns false when piece at cell is not blocking", () => {
    expect(isCellBlocked("3,5", { "3,5": { type: "chest", blocks: false, coveredCells: ["3,5"] } })).toBe(false);
  });

  it("returns false when blocking piece does not cover the cell", () => {
    expect(isCellBlocked("3,5", { "3,4": { type: "boulder", blocks: true, coveredCells: ["3,4"] } })).toBe(false);
  });

  it("falls back to anchor when coveredCells is absent", () => {
    expect(isCellBlocked("3,5", { "3,5": { type: "boulder", blocks: true } })).toBe(true);
  });
});

describe("computeHeroStartFog", () => {
  const stubReveal = (r, c, _placed) => new Set([`${r},${c}`, `${r},${c + 1}`]);

  it("returns empty Set for empty placed", () => {
    const result = computeHeroStartFog({}, stubReveal);
    expect(result.size).toBe(0);
  });

  it("reveals cells from a start piece", () => {
    const placed = { "5,3": { type: "start" } };
    const result = computeHeroStartFog(placed, stubReveal);
    expect(result.has("5,3")).toBe(true);
    expect(result.has("5,4")).toBe(true);
  });

  it("reveals cells from a start overlayMarker on furniture", () => {
    const placed = { "5,3": { type: "chest", overlayMarker: "start" } };
    const result = computeHeroStartFog(placed, stubReveal);
    expect(result.has("5,3")).toBe(true);
    expect(result.has("5,4")).toBe(true);
  });

  it("returns empty Set for non-start pieces", () => {
    const placed = { "5,3": { type: "goblin" } };
    const result = computeHeroStartFog(placed, stubReveal);
    expect(result.size).toBe(0);
  });

  it("returns union of reveal sets for multiple start pieces", () => {
    const placed = {
      "5,3": { type: "start" },
      "9,7": { type: "start" },
    };
    const result = computeHeroStartFog(placed, stubReveal);
    expect(result.has("5,3")).toBe(true);
    expect(result.has("5,4")).toBe(true);
    expect(result.has("9,7")).toBe(true);
    expect(result.has("9,8")).toBe(true);
  });
});
