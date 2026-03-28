import { describe, it, expect } from "vitest";
import { isSessionDirty, hasUnsavedChanges, stableStringify } from "./navigationGuards.js";

describe("isSessionDirty", () => {
  it("returns false for a clean session", () => {
    expect(
      isSessionDirty(new Set(), new Set(), new Set(), new Set(), {})
    ).toBe(false);
  });

  it("returns true when fog has revealed cells", () => {
    expect(
      isSessionDirty(new Set(["1,1"]), new Set(), new Set(), new Set(), {})
    ).toBe(true);
  });

  it("returns true when openedChests is not empty", () => {
    expect(
      isSessionDirty(new Set(), new Set(["2,2"]), new Set(), new Set(), {})
    ).toBe(true);
  });

  it("returns true when revealedTraps is not empty", () => {
    expect(
      isSessionDirty(new Set(), new Set(), new Set(["3,3"]), new Set(), {})
    ).toBe(true);
  });

  it("returns true when revealedSecretDoors is not empty", () => {
    expect(
      isSessionDirty(new Set(), new Set(), new Set(), new Set(["4,4"]), {})
    ).toBe(true);
  });

  it("returns true when searchedCounts has entries", () => {
    expect(
      isSessionDirty(new Set(), new Set(), new Set(), new Set(), { "R1": 1 })
    ).toBe(true);
  });
});

describe("hasUnsavedChanges", () => {
  it("returns false when snapshot matches current state", () => {
    const obj = {
      placed: { "1,1": { type: "goblin" } },
      doors: {},
      searchMarkers: {},
      searchNotes: {},
      secretDoorMarkers: {},
    };
    expect(hasUnsavedChanges(stableStringify(obj), obj)).toBe(false);
  });

  it("returns true when a piece is added to placed", () => {
    const original = {
      placed: { "1,1": { type: "goblin" } },
      doors: {},
      searchMarkers: {},
      searchNotes: {},
      secretDoorMarkers: {},
    };
    const snapshot = stableStringify(original);
    const mutated = {
      ...original,
      placed: { ...original.placed, "2,2": { type: "orc" } },
    };
    expect(hasUnsavedChanges(snapshot, mutated)).toBe(true);
  });

  it("returns true when a door rotation changes", () => {
    const original = {
      placed: {},
      doors: { "3,3": { rotation: 0 } },
      searchMarkers: {},
      searchNotes: {},
      secretDoorMarkers: {},
    };
    const snapshot = stableStringify(original);
    const mutated = {
      ...original,
      doors: { "3,3": { rotation: 2 } },
    };
    expect(hasUnsavedChanges(snapshot, mutated)).toBe(true);
  });

  it("returns true when searchNotes content changes", () => {
    const original = {
      placed: {},
      doors: {},
      searchMarkers: {},
      searchNotes: { "R1": ["Find the key"] },
      secretDoorMarkers: {},
    };
    const snapshot = stableStringify(original);
    const mutated = {
      ...original,
      searchNotes: { "R1": ["Find the key", "Check the barrel"] },
    };
    expect(hasUnsavedChanges(snapshot, mutated)).toBe(true);
  });

  it("returns true when secretDoorMarkers changes", () => {
    const original = {
      placed: {},
      doors: {},
      searchMarkers: {},
      searchNotes: {},
      secretDoorMarkers: {},
    };
    const snapshot = stableStringify(original);
    const mutated = {
      ...original,
      secretDoorMarkers: { "5,5": { linkedDoorKey: "6,6", message: "Shh" } },
    };
    expect(hasUnsavedChanges(snapshot, mutated)).toBe(true);
  });

  it("returns false when placed has same content but different key insertion order", () => {
    const original = {
      placed: { "1,1": { type: "goblin" }, "2,2": { type: "orc" } },
      doors: {},
      searchMarkers: {},
      searchNotes: {},
      secretDoorMarkers: {},
    };
    const snapshot = stableStringify(original);
    // Build same placed object but reverse key insertion order
    const reordered = {
      placed: { "2,2": { type: "orc" }, "1,1": { type: "goblin" } },
      doors: {},
      searchMarkers: {},
      searchNotes: {},
      secretDoorMarkers: {},
    };
    expect(hasUnsavedChanges(snapshot, reordered)).toBe(false);
  });
});
