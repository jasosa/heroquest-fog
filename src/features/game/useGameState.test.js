import { describe, it, expect } from "vitest";
import { hasHeroStart, incrementSearchCount, resetSearchCounts, addRevealedTrap } from "./useGameState.js";

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
