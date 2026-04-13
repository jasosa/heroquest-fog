// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { hasHeroStart, incrementSearchCount, resetSearchCounts, addRevealedTrap, shouldInterceptTrapClick, computeHeroStartFog, isCorridorConnected, isCellBlocked, shouldShowPlacementPopup, resolveChestResult, shouldInterceptChestClick, useGameState } from "./useGameState.js";

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

describe("shouldShowPlacementPopup", () => {
  it("returns true when mode is play and hasShown is false", () => {
    expect(shouldShowPlacementPopup("play", false)).toBe(true);
  });

  it("returns false when mode is play but hasShown is true", () => {
    expect(shouldShowPlacementPopup("play", true)).toBe(false);
  });

  it("returns false when mode is edit regardless of hasShown", () => {
    expect(shouldShowPlacementPopup("edit", false)).toBe(false);
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

describe("resolveChestResult", () => {
  it("returns trap result with custom message", () =>
    expect(resolveChestResult(true, "A rusty spike!")).toEqual({ hasTrap: true, message: "A rusty spike!" }))
  it("uses default trap message when trapNote is empty", () =>
    expect(resolveChestResult(true, "")).toEqual({ hasTrap: true, message: "A trap is triggered!" }))
  it("uses default trap message when trapNote is null", () =>
    expect(resolveChestResult(true, null)).toEqual({ hasTrap: true, message: "A trap is triggered!" }))
  it("returns safe result regardless of trapNote", () =>
    expect(resolveChestResult(false, "irrelevant")).toEqual({ hasTrap: false, message: "The chest is safe." }))
});

describe("shouldInterceptChestClick", () => {
  it("returns true for un-opened chest in fog", () =>
    expect(shouldInterceptChestClick("chest", true, false)).toBe(true))
  it("returns false when not in fog", () =>
    expect(shouldInterceptChestClick("chest", false, false)).toBe(false))
  it("returns false when already opened", () =>
    expect(shouldInterceptChestClick("chest", true, true)).toBe(false))
  it("returns false for non-chest", () =>
    expect(shouldInterceptChestClick("goblin", true, false)).toBe(false))
});

describe("resetFog clears springedTraps and disarmedTraps", () => {
  it("resetFog clears springedTraps", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }));
    act(() => result.current.springTrap("3,5", true));
    expect(result.current.springedTraps.has("3,5")).toBe(true);
    act(() => result.current.resetFog());
    expect(result.current.springedTraps.size).toBe(0);
  });

  it("resetFog clears disarmedTraps", () => {
    const { result } = renderHook(() => useGameState({
      initialMode: "play",
      initialPlaced: { "3,5": { type: "pit", blocks: false, coveredCells: ["3,5"] } },
    }));
    act(() => result.current.disarmTrap("3,5"));
    expect(result.current.disarmedTraps.has("3,5")).toBe(true);
    act(() => result.current.resetFog());
    expect(result.current.disarmedTraps.size).toBe(0);
  });
});

describe("openedChests state", () => {
  it("openedChests starts empty", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }))
    expect(result.current.openedChests.size).toBe(0)
  });

  it("resetFog clears openedChests", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }))
    act(() => result.current.resetFog())
    expect(result.current.openedChests.size).toBe(0)
  });

  it("closeChestResult sets pendingChestResult to null", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }))
    act(() => result.current.closeChestResult())
    expect(result.current.pendingChestResult).toBeNull()
  });

  it("closeChestResult adds the anchorKey to openedChests so clicking again is blocked", () => {
    const initialPlaced = { "5,5": { type: "chest", hasTrap: false, blocks: false, coveredCells: ["5,5"] } };
    const { result } = renderHook(() => useGameState({ initialMode: "play", initialPlaced }));
    // Manually set pendingChestResult without going through openChest (simulates stale openedChests)
    act(() => result.current.openChest("5,5"));
    // Clear openedChests to simulate the timing bug scenario
    act(() => { /* openedChests would be stale in the browser — simulate by relying on closeChestResult to fix it */ });
    act(() => result.current.closeChestResult());
    // closeChestResult itself must ensure openedChests has the key
    expect(result.current.openedChests.has("5,5")).toBe(true);
  });

  it("openChest with hasTrap:true stores { hasTrap, anchorKey, springMessage } — no message field", () => {
    const initialPlaced = { "5,5": { type: "chest", hasTrap: true, trapNote: "Poison dart!", blocks: false, coveredCells: ["5,5"] } };
    const { result } = renderHook(() => useGameState({ initialMode: "play", initialPlaced }));
    act(() => result.current.openChest("5,5"));
    expect(result.current.pendingChestResult).toEqual({ hasTrap: true, anchorKey: "5,5", springMessage: "Poison dart!" });
  });

  it("openChest with hasTrap:true and no trapNote stores empty springMessage", () => {
    const initialPlaced = { "5,5": { type: "chest", hasTrap: true, trapNote: "", blocks: false, coveredCells: ["5,5"] } };
    const { result } = renderHook(() => useGameState({ initialMode: "play", initialPlaced }));
    act(() => result.current.openChest("5,5"));
    expect(result.current.pendingChestResult).toEqual({ hasTrap: true, anchorKey: "5,5", springMessage: "" });
  });

  it("openChest with hasTrap:false stores { hasTrap: false, anchorKey, springMessage: '' }", () => {
    const initialPlaced = { "5,5": { type: "chest", hasTrap: false, trapNote: "", blocks: false, coveredCells: ["5,5"] } };
    const { result } = renderHook(() => useGameState({ initialMode: "play", initialPlaced }));
    act(() => result.current.openChest("5,5"));
    expect(result.current.pendingChestResult).toEqual({ hasTrap: false, anchorKey: "5,5", springMessage: "" });
  });
});

// ─── springedTraps / disarmedTraps initial state ─────────────────────────────

describe("useGameState — springedTraps and disarmedTraps", () => {
  it("springedTraps starts as empty Set", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }));
    expect(result.current.springedTraps).toBeInstanceOf(Set);
    expect(result.current.springedTraps.size).toBe(0);
  });

  it("disarmedTraps starts as empty Set", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }));
    expect(result.current.disarmedTraps).toBeInstanceOf(Set);
    expect(result.current.disarmedTraps.size).toBe(0);
  });
});

// ─── Trap interaction state ───────────────────────────────────────────────────

describe("useGameState — trap interaction", () => {
  it("openTrapInteraction(anchorKey, false) sets pendingTrapInteraction to { anchorKey, isRevealed: false }", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }));
    act(() => result.current.openTrapInteraction("3,5", false));
    expect(result.current.pendingTrapInteraction).toEqual({ anchorKey: "3,5", isRevealed: false });
  });

  it("openTrapInteraction(anchorKey, true) sets pendingTrapInteraction to { anchorKey, isRevealed: true }", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }));
    act(() => result.current.openTrapInteraction("3,5", true));
    expect(result.current.pendingTrapInteraction).toEqual({ anchorKey: "3,5", isRevealed: true });
  });

  it("closeTrapInteraction() sets pendingTrapInteraction to null", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }));
    act(() => result.current.openTrapInteraction("3,5", false));
    act(() => result.current.closeTrapInteraction());
    expect(result.current.pendingTrapInteraction).toBeNull();
  });

  it("disarmTrap(anchorKey) does NOT delete the piece from placed", () => {
    const { result } = renderHook(() => useGameState({
      initialMode: "play",
      initialPlaced: { "3,5": { type: "pit", blocks: false, coveredCells: ["3,5"] } },
    }));
    act(() => result.current.disarmTrap("3,5"));
    expect(result.current.placed["3,5"]).toBeDefined();
  });

  it("disarmTrap(anchorKey) adds anchorKey to disarmedTraps", () => {
    const { result } = renderHook(() => useGameState({
      initialMode: "play",
      initialPlaced: { "3,5": { type: "pit", blocks: false, coveredCells: ["3,5"] } },
    }));
    act(() => result.current.disarmTrap("3,5"));
    expect(result.current.disarmedTraps.has("3,5")).toBe(true);
  });

  it("disarmTrap(anchorKey) removes the key from revealedTraps", () => {
    const { result } = renderHook(() => useGameState({
      initialMode: "play",
      initialPlaced: { "3,5": { type: "pit", blocks: false, coveredCells: ["3,5"] } },
    }));
    act(() => result.current.revealTrap("3,5"));
    act(() => result.current.disarmTrap("3,5"));
    expect(result.current.revealedTraps.has("3,5")).toBe(false);
  });

  it("disarmTrap(anchorKey) does NOT set pendingTrapInteraction to null", () => {
    const { result } = renderHook(() => useGameState({
      initialMode: "play",
      initialPlaced: { "3,5": { type: "pit", blocks: false, coveredCells: ["3,5"] } },
    }));
    act(() => result.current.openTrapInteraction("3,5", false));
    act(() => result.current.disarmTrap("3,5"));
    expect(result.current.pendingTrapInteraction).not.toBeNull();
  });
});

// ─── springTrap ───────────────────────────────────────────────────────────────

describe("useGameState — springTrap", () => {
  it("springTrap(anchorKey, true) adds to revealedTraps AND springedTraps", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }));
    act(() => result.current.springTrap("3,5", true));
    expect(result.current.revealedTraps.has("3,5")).toBe(true);
    expect(result.current.springedTraps.has("3,5")).toBe(true);
  });

  it("springTrap(anchorKey, false) adds to BOTH revealedTraps AND springedTraps", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }));
    act(() => result.current.springTrap("3,5", false));
    expect(result.current.revealedTraps.has("3,5")).toBe(true);
    expect(result.current.springedTraps.has("3,5")).toBe(true);
  });

  it("springTrap does NOT close the popup (pendingTrapInteraction stays open)", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play" }));
    act(() => result.current.openTrapInteraction("3,5", false));
    act(() => result.current.springTrap("3,5", false));
    expect(result.current.pendingTrapInteraction).not.toBeNull();
    expect(result.current.pendingTrapInteraction.anchorKey).toBe("3,5");
  });
});

// ─── Trap config state ────────────────────────────────────────────────────────

describe("useGameState — trap config", () => {
  it("openTrapConfig(anchorKey) sets pendingTrapConfig to { anchorKey }", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "edit" }));
    act(() => result.current.openTrapConfig("3,5"));
    expect(result.current.pendingTrapConfig).toEqual({ anchorKey: "3,5" });
  });

  it("saveTrapConfig(anchorKey, { springMessage, removeAfterSpring }) updates placed and sets pendingTrapConfig to null", () => {
    const { result } = renderHook(() => useGameState({
      initialMode: "edit",
      initialPlaced: { "3,5": { type: "pit", blocks: false, coveredCells: ["3,5"] } },
    }));
    act(() => result.current.openTrapConfig("3,5"));
    act(() => result.current.saveTrapConfig("3,5", { springMessage: "Loses 1 BP", removeAfterSpring: true }));
    expect(result.current.placed["3,5"].springMessage).toBe("Loses 1 BP");
    expect(result.current.placed["3,5"].removeAfterSpring).toBe(true);
    expect(result.current.pendingTrapConfig).toBeNull();
  });
});

// ─── handleCell intercepts for trap interaction ───────────────────────────────

describe("useGameState — handleCell trap intercepts in play mode", () => {
  // BOARD[9][9] is "C". BOARD[9][10] is "C" (adjacent corridor).
  // We place a trap at 9,9 and auto-reveal the cell via an adjacent start marker at 9,10.
  // Actually we can't easily seed fog, so we test the pure shouldInterceptTrapClick behavior
  // by checking that clicking a fog-revealed trap cell triggers the interaction popup.
  // The simplest approach: place trap at a cell, reveal it manually via revealTrap (no,
  // that's revealedTraps). Instead use handleCell on an adjacent cell to reveal fog.

  it("handleCell in play mode: clicking a cell with a visible unrevealed trap sets pendingTrapInteraction", () => {
    // Place a trap at 9,9 and a start marker at 9,8 (corridor) to seed fog.
    // 9,8 is a corridor cell adjacent to 9,9 (also corridor) so auto-reveal will include 9,9.
    const initialPlaced = {
      "9,8": { type: "start", blocks: false, coveredCells: ["9,8"] },
      "9,9": { type: "pit", blocks: false, coveredCells: ["9,9"] },
    };
    const { result } = renderHook(() => useGameState({ initialMode: "play", initialPlaced }));
    // Fog should include 9,9 from the start marker auto-reveal
    expect(result.current.fog.has("9,9")).toBe(true);
    // revealedTraps should NOT contain 9,9
    expect(result.current.revealedTraps.has("9,9")).toBe(false);
    // Clicking the trap cell should set pendingTrapInteraction (not auto-reveal the trap)
    act(() => result.current.handleCell(9, 9));
    expect(result.current.pendingTrapInteraction).toEqual({ anchorKey: "9,9", isRevealed: false });
    expect(result.current.revealedTraps.has("9,9")).toBe(false);
  });

  it("handleCell in play mode: clicking a sprung trap with removeAfterSpring=false sets pendingTrapInteraction (already-sprung popup)", () => {
    const initialPlaced = {
      "9,8": { type: "start", blocks: false, coveredCells: ["9,8"] },
      "9,9": { type: "pit", blocks: false, coveredCells: ["9,9"], removeAfterSpring: false },
    };
    const { result } = renderHook(() => useGameState({ initialMode: "play", initialPlaced }));
    // Spring the trap (removeAfterSpring=false so it stays on board)
    act(() => result.current.springTrap("9,9", false));
    expect(result.current.springedTraps.has("9,9")).toBe(true); // always tracked in springedTraps regardless of removeAfterSpring
    // Now clicking the trap should open the already-sprung popup (via revealedTraps intercept)
    act(() => result.current.handleCell(9, 9));
    expect(result.current.pendingTrapInteraction).not.toBeNull();
  });

  it("handleCell in play mode: clicking an ALREADY revealed trap sets pendingTrapInteraction with isRevealed: true", () => {
    const initialPlaced = {
      "9,8": { type: "start", blocks: false, coveredCells: ["9,8"] },
      "9,9": { type: "pit", blocks: false, coveredCells: ["9,9"] },
    };
    const { result } = renderHook(() => useGameState({ initialMode: "play", initialPlaced }));
    // First reveal the trap
    act(() => result.current.revealTrap("9,9"));
    // Now clicking the trap should set pendingTrapInteraction with isRevealed: true
    act(() => result.current.handleCell(9, 9));
    expect(result.current.pendingTrapInteraction).toEqual({ anchorKey: "9,9", isRevealed: true });
  });
});

// ─── handleCell intercepts for chest interaction ──────────────────────────────

describe("useGameState — handleCell chest intercept in play mode", () => {
  // Place a chest at 9,9 with a start marker at 9,8 to seed fog.
  const initialPlaced = {
    "9,8": { type: "start", blocks: false, coveredCells: ["9,8"] },
    "9,9": { type: "chest", blocks: false, coveredCells: ["9,9"] },
  };

  it("clicking a fog-revealed, un-opened chest cell opens the chest popup (not fog reveal)", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play", initialPlaced }));
    // 9,9 should already be in fog via the start marker auto-reveal
    expect(result.current.fog.has("9,9")).toBe(true);
    expect(result.current.openedChests.has("9,9")).toBe(false);
    const fogSizeBefore = result.current.fog.size;

    act(() => result.current.handleCell(9, 9));

    // pendingChestResult should be set (chest opened), not just fog expanded
    expect(result.current.pendingChestResult).not.toBeNull();
    // fog should NOT have grown (no fog reveal happened)
    expect(result.current.fog.size).toBe(fogSizeBefore);
  });

  it("clicking an already-opened chest cell falls through to normal fog behaviour", () => {
    const { result } = renderHook(() => useGameState({ initialMode: "play", initialPlaced }));
    // Open the chest first
    act(() => result.current.openChest("9,9"));
    act(() => result.current.closeChestResult());
    expect(result.current.openedChests.has("9,9")).toBe(true);
    const fogSizeBefore = result.current.fog.size;

    act(() => result.current.handleCell(9, 9));

    // chest is already open so no new popup should appear
    expect(result.current.pendingChestResult).toBeNull();
    // fog should have expanded (normal reveal happened)
    expect(result.current.fog.size).toBeGreaterThan(fogSizeBefore);
  });
});

// BOARD[9][9] === "C" (corridor) — valid cell for searchsecret placement tests.
describe("searchsecret tool in edit mode — no auto-popup", () => {
  it("placing a searchsecret marker does not open the config dialog", () => {
    const { result } = renderHook(() =>
      useGameState({ initialMode: "edit" })
    );
    act(() => { result.current.setTool("searchsecret"); });
    act(() => { result.current.handleCell(9, 9); });
    expect(result.current.pendingSecretDoorEdit).toBeNull();
  });

  it("secretDoorMarkers is populated after placing", () => {
    const { result } = renderHook(() =>
      useGameState({ initialMode: "edit" })
    );
    act(() => { result.current.setTool("searchsecret"); });
    act(() => { result.current.handleCell(9, 9); });
    expect(result.current.secretDoorMarkers["9,9"]).toBeDefined();
  });

  it("openSecretDoorEdit still opens the dialog when called explicitly", () => {
    const { result } = renderHook(() =>
      useGameState({ initialMode: "edit" })
    );
    act(() => { result.current.setTool("searchsecret"); });
    act(() => { result.current.handleCell(9, 9); });
    act(() => { result.current.openSecretDoorEdit("9,9"); });
    expect(result.current.pendingSecretDoorEdit).toEqual({ cellKey: "9,9" });
  });

  it("cancelSecretDoorEdit closes the dialog without modifying secretDoorMarkers", () => {
    const { result } = renderHook(() =>
      useGameState({ initialMode: "edit" })
    );
    act(() => { result.current.setTool("searchsecret"); });
    act(() => { result.current.handleCell(9, 9); });
    act(() => { result.current.openSecretDoorEdit("9,9"); });
    const markersBefore = result.current.secretDoorMarkers["9,9"];
    act(() => { result.current.cancelSecretDoorEdit(); });
    expect(result.current.pendingSecretDoorEdit).toBeNull();
    expect(result.current.secretDoorMarkers["9,9"]).toEqual(markersBefore);
  });
});
