import { describe, it, expect } from "vitest";
import {
  placeSecretDoorMarker,
  removeSecretDoorMarker,
  linkSecretDoor,
  setSecretDoorMessage,
  hasSecretDoorMarkerInRoom,
  resolveSecretDoorSearch,
} from "./secretDoorMarkers.js";

// Minimal board: R1 room, C corridor, null wall
const BOARD = [
  ["R1", "R1", "C",  null],
  ["R1", "R1", "C",  null],
  [null, null, "C",  null],
];

// ── placeSecretDoorMarker ─────────────────────────────────────────────────
describe("placeSecretDoorMarker", () => {
  it("places a marker in a corridor cell", () => {
    const result = placeSecretDoorMarker({}, BOARD, 0, 2);
    expect(result["0,2"]).toBeDefined();
    expect(result["0,2"].linkedDoorKey).toBeNull();
    expect(result["0,2"].message).toBe("");
  });

  it("places a marker in a room cell when no existing room marker", () => {
    const result = placeSecretDoorMarker({}, BOARD, 0, 0);
    expect(result["0,0"]).toBeDefined();
  });

  it("allows multiple markers in the same corridor", () => {
    let markers = placeSecretDoorMarker({}, BOARD, 0, 2);
    markers = placeSecretDoorMarker(markers, BOARD, 1, 2);
    expect(Object.keys(markers)).toHaveLength(2);
  });

  it("is a no-op when a room already has a marker (one-per-room constraint)", () => {
    const markers = { "0,0": { linkedDoorKey: null, message: "" } };
    const result = placeSecretDoorMarker(markers, BOARD, 1, 1); // also R1
    expect(Object.keys(result)).toHaveLength(1);
  });

  it("is a no-op for a null/wall cell", () => {
    const result = placeSecretDoorMarker({}, BOARD, 0, 3);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("returns a new object (immutable)", () => {
    const original = {};
    const result = placeSecretDoorMarker(original, BOARD, 0, 2);
    expect(result).not.toBe(original);
  });
});

// ── removeSecretDoorMarker ────────────────────────────────────────────────
describe("removeSecretDoorMarker", () => {
  it("removes the entry for the given key", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "" } };
    const result = removeSecretDoorMarker(markers, "0,2");
    expect(result["0,2"]).toBeUndefined();
  });

  it("is a no-op when the key is not present", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "" } };
    const result = removeSecretDoorMarker(markers, "9,9");
    expect(Object.keys(result)).toHaveLength(1);
  });

  it("returns a new object (immutable)", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "" } };
    const result = removeSecretDoorMarker(markers, "0,2");
    expect(result).not.toBe(markers);
  });
});

// ── linkSecretDoor ────────────────────────────────────────────────────────
describe("linkSecretDoor", () => {
  it("sets linkedDoorKey on an existing entry", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "" } };
    const result = linkSecretDoor(markers, "0,2", "3,4");
    expect(result["0,2"].linkedDoorKey).toBe("3,4");
  });

  it("can set linkedDoorKey to null (unlink)", () => {
    const markers = { "0,2": { linkedDoorKey: "3,4", message: "" } };
    const result = linkSecretDoor(markers, "0,2", null);
    expect(result["0,2"].linkedDoorKey).toBeNull();
  });

  it("is a no-op when the cell key is absent", () => {
    const markers = {};
    const result = linkSecretDoor(markers, "9,9", "3,4");
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("returns a new object (immutable)", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "" } };
    const result = linkSecretDoor(markers, "0,2", "3,4");
    expect(result).not.toBe(markers);
    expect(markers["0,2"].linkedDoorKey).toBeNull();
  });
});

// ── setSecretDoorMessage ──────────────────────────────────────────────────
describe("setSecretDoorMessage", () => {
  it("sets the message on an existing entry", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "" } };
    const result = setSecretDoorMessage(markers, "0,2", "Nothing here.");
    expect(result["0,2"].message).toBe("Nothing here.");
  });

  it("is a no-op when the cell key is absent", () => {
    const markers = {};
    const result = setSecretDoorMessage(markers, "9,9", "msg");
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("returns a new object (immutable)", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "" } };
    const result = setSecretDoorMessage(markers, "0,2", "msg");
    expect(result).not.toBe(markers);
    expect(markers["0,2"].message).toBe("");
  });
});

// ── hasSecretDoorMarkerInRoom ─────────────────────────────────────────────
describe("hasSecretDoorMarkerInRoom", () => {
  it("returns true when a marker exists in the given room", () => {
    const markers = { "0,0": { linkedDoorKey: null, message: "" } };
    expect(hasSecretDoorMarkerInRoom(markers, BOARD, "R1")).toBe(true);
  });

  it("returns false when no marker exists in the room", () => {
    const markers = {};
    expect(hasSecretDoorMarkerInRoom(markers, BOARD, "R1")).toBe(false);
  });

  it("does not count corridor markers toward the room limit", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "" } }; // corridor
    expect(hasSecretDoorMarkerInRoom(markers, BOARD, "R1")).toBe(false);
  });
});

// ── resolveSecretDoorSearch ───────────────────────────────────────────────
describe("resolveSecretDoorSearch", () => {
  const placed = { "5,5": { type: "secretdoor", blocks: false, rotation: 0, coveredCells: ["5,5"] } };
  const DEFAULT_MSG = "You find no secret doors here.";

  it("returns reveal action when door is linked, present in placed, and not yet revealed", () => {
    const markers = { "0,2": { linkedDoorKey: "5,5", message: "" } };
    const result = resolveSecretDoorSearch(markers, placed, new Set(), "0,2");
    expect(result.action).toBe("reveal");
    expect(result.doorKey).toBe("5,5");
  });

  it("returns message action when door has already been revealed", () => {
    const markers = { "0,2": { linkedDoorKey: "5,5", message: "" } };
    const result = resolveSecretDoorSearch(markers, placed, new Set(["5,5"]), "0,2");
    expect(result.action).toBe("message");
  });

  it("returns message action when no door is linked", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "Custom msg" } };
    const result = resolveSecretDoorSearch(markers, placed, new Set(), "0,2");
    expect(result.action).toBe("message");
    expect(result.text).toBe("Custom msg");
  });

  it("returns message action when linkedDoorKey is absent from placed", () => {
    const markers = { "0,2": { linkedDoorKey: "9,9", message: "" } };
    const result = resolveSecretDoorSearch(markers, placed, new Set(), "0,2");
    expect(result.action).toBe("message");
  });

  it("uses default message when marker message is empty", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "" } };
    const result = resolveSecretDoorSearch(markers, placed, new Set(), "0,2");
    expect(result.text).toBe(DEFAULT_MSG);
  });

  it("uses custom message over default when set", () => {
    const markers = { "0,2": { linkedDoorKey: null, message: "Rats!" } };
    const result = resolveSecretDoorSearch(markers, placed, new Set(), "0,2");
    expect(result.text).toBe("Rats!");
  });

  it("returns message action when cellKey not in markers", () => {
    const result = resolveSecretDoorSearch({}, placed, new Set(), "9,9");
    expect(result.action).toBe("message");
    expect(result.text).toBe(DEFAULT_MSG);
  });
});
