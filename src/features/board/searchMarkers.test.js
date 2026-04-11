import { describe, it, expect } from "vitest";
import { computeDefaultSearchMarkers, moveSearchMarker, setSearchNote, setSearchNoteAt, normalizeSearchNotes, removeSearchMarker } from "./searchMarkers.js";

// ─── Test board (same layout as reveal.test.js) ──────────────────────────────
//
//    0    1    2    3    4    5    6    7    8
// 0: W    W    W    W    W    W    W    W    W
// 1: W    R1   R1   C    R2   R2   W    W    W
// 2: W    R1   R1   C    R2   R2   W    W    W
// 3: W    R1   R1   C    R2   R2   W    W    W
// 4: W    W    W    C    C    W    W    W    W
// 5: W    W    W    C    C    W    W    W    W
// 6: W    W    W    C    C    W    W    W    W
// 7: W    W    W    W    W    W    W    W    W

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

// ─── computeDefaultSearchMarkers ─────────────────────────────────────────────

describe("computeDefaultSearchMarkers", () => {
  it("returns one entry per room region (R1, R2) — corridors excluded", () => {
    const markers = computeDefaultSearchMarkers(BOARD, ROWS, COLS);
    expect(Object.keys(markers).sort()).toEqual(["R1", "R2"]);
  });

  it("each marker position is within its region", () => {
    const markers = computeDefaultSearchMarkers(BOARD, ROWS, COLS);
    for (const [region, [r, c]] of Object.entries(markers)) {
      expect(BOARD[r][c]).toBe(region);
    }
  });

  it("R1 marker is the middle cell of R1 (row-major order)", () => {
    // R1 cells row-major: (1,1),(1,2),(2,1),(2,2),(3,1),(3,2) — 6 cells, middle index 3 → (2,2)
    const markers = computeDefaultSearchMarkers(BOARD, ROWS, COLS);
    expect(markers["R1"]).toEqual([2, 2]);
  });

  it("does not include a corridor marker", () => {
    const markers = computeDefaultSearchMarkers(BOARD, ROWS, COLS);
    expect(markers["C"]).toBeUndefined();
  });

  it("skips null/wall cells", () => {
    const markers = computeDefaultSearchMarkers(BOARD, ROWS, COLS);
    // null is not a region id
    expect(markers[null]).toBeUndefined();
    expect(markers["null"]).toBeUndefined();
  });
});

// ─── moveSearchMarker ─────────────────────────────────────────────────────────

describe("moveSearchMarker", () => {
  const initial = computeDefaultSearchMarkers(BOARD, ROWS, COLS);

  it("updates the marker for the region of the clicked cell", () => {
    const updated = moveSearchMarker(initial, BOARD, 1, 1);
    expect(updated["R1"]).toEqual([1, 1]);
  });

  it("does not affect other regions", () => {
    const updated = moveSearchMarker(initial, BOARD, 1, 1);
    expect(updated["R2"]).toEqual(initial["R2"]);
    expect(updated["C"]).toEqual(initial["C"]);
  });

  it("is a no-op for corridor cells", () => {
    const updated = moveSearchMarker(initial, BOARD, 6, 4); // corridor cell
    expect(updated).toEqual(initial);
  });

  it("is a no-op for wall (null) cells", () => {
    const updated = moveSearchMarker(initial, BOARD, 0, 0); // W cell
    expect(updated).toEqual(initial);
  });

  it("returns a new object (immutable)", () => {
    const updated = moveSearchMarker(initial, BOARD, 3, 1);
    expect(updated).not.toBe(initial);
  });

  it("is a no-op when clicked cell is out of bounds", () => {
    const updated = moveSearchMarker(initial, BOARD, 99, 99);
    expect(updated).toEqual(initial);
  });
});

// ─── setSearchNote ────────────────────────────────────────────────────────────

describe("setSearchNote", () => {
  it("adds a note for a region", () => {
    const result = setSearchNote({}, "R1", "Find the key here");
    expect(result["R1"]).toBe("Find the key here");
  });

  it("updates an existing note", () => {
    const result = setSearchNote({ "R1": "old" }, "R1", "new");
    expect(result["R1"]).toBe("new");
  });

  it("does not affect other regions", () => {
    const result = setSearchNote({ "R1": "note1", "R2": "note2" }, "R1", "updated");
    expect(result["R2"]).toBe("note2");
  });

  it("can set an empty note", () => {
    const result = setSearchNote({ "R1": "old" }, "R1", "");
    expect(result["R1"]).toBe("");
  });

  it("returns a new object (immutable)", () => {
    const notes = {};
    const result = setSearchNote(notes, "R1", "note");
    expect(result).not.toBe(notes);
  });
});

// ─── setSearchNoteAt ──────────────────────────────────────────────────────────

describe("setSearchNoteAt", () => {
  it("sets the note at the given index", () => {
    const result = setSearchNoteAt({}, "R1", 0, "First clue");
    expect(result["R1"][0]).toBe("First clue");
  });

  it("initialises missing slots as empty strings", () => {
    const result = setSearchNoteAt({}, "R1", 2, "Third clue");
    expect(result["R1"]).toEqual(["", "", "Third clue", ""]);
  });

  it("preserves existing notes at other indices", () => {
    const notes = { R1: ["a", "b", "c", "d"] };
    const result = setSearchNoteAt(notes, "R1", 1, "updated");
    expect(result["R1"]).toEqual(["a", "updated", "c", "d"]);
  });

  it("does not affect other regions", () => {
    const notes = { R1: ["a", "", "", ""], R2: ["x", "", "", ""] };
    const result = setSearchNoteAt(notes, "R1", 0, "new");
    expect(result["R2"]).toEqual(["x", "", "", ""]);
  });

  it("returns a new object (immutable)", () => {
    const notes = {};
    const result = setSearchNoteAt(notes, "R1", 0, "note");
    expect(result).not.toBe(notes);
  });
});

// ─── normalizeSearchNotes ─────────────────────────────────────────────────────

describe("normalizeSearchNotes", () => {
  it("converts a legacy string value to a 4-element array with the string at index 0", () => {
    const result = normalizeSearchNotes({ R1: "old note" });
    expect(result["R1"]).toEqual(["old note", "", "", ""]);
  });

  it("leaves a 4-element array unchanged", () => {
    const notes = { R1: ["a", "b", "c", "d"] };
    const result = normalizeSearchNotes(notes);
    expect(result["R1"]).toEqual(["a", "b", "c", "d"]);
  });

  it("pads a short array to 4 elements with empty strings", () => {
    const result = normalizeSearchNotes({ R1: ["only one"] });
    expect(result["R1"]).toEqual(["only one", "", "", ""]);
  });

  it("processes all regions", () => {
    const result = normalizeSearchNotes({ R1: "a", R2: ["b", "c"] });
    expect(result["R1"]).toEqual(["a", "", "", ""]);
    expect(result["R2"]).toEqual(["b", "c", "", ""]);
  });

  it("returns a new object (immutable)", () => {
    const notes = { R1: ["a", "b", "c", "d"] };
    const result = normalizeSearchNotes(notes);
    expect(result).not.toBe(notes);
  });

  it("handles an empty notes object", () => {
    expect(normalizeSearchNotes({})).toEqual({});
  });
});

// ─── removeSearchMarker ───────────────────────────────────────────────────────

describe("removeSearchMarker", () => {
  it("removes the marker for the given region", () => {
    const markers = { R1: [2, 2], R2: [4, 4] };
    const result = removeSearchMarker(markers, "R1");
    expect(result["R1"]).toBeUndefined();
    expect(result["R2"]).toEqual([4, 4]);
  });

  it("returns a new object (immutable)", () => {
    const markers = { R1: [2, 2] };
    const result = removeSearchMarker(markers, "R1");
    expect(result).not.toBe(markers);
  });

  it("is a no-op if the region has no marker", () => {
    const markers = { R2: [4, 4] };
    const result = removeSearchMarker(markers, "R1");
    expect(result).toEqual(markers);
  });
});
