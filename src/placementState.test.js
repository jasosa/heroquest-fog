import { describe, it, expect } from "vitest";
import {
  togglePlacedPiece,
  rotatePlacedPiece,
  toggleDoor,
  cycleDoorRotation,
  placeNoteMarker,
  updateNoteMarker,
  setMonsterSpecial,
  setChestTrap,
} from "./placementState.js";

// ─── Piece definitions used across tests ──────────────────────────────────────

const GOBLIN   = { id: "goblin",   blocks: false, cells: undefined, isEdge: false };
const BOOKCASE = { id: "bookcase", blocks: true,  cells: [[0,0],[0,1],[0,2]], isEdge: false };
const TABLE    = { id: "table",    blocks: false, cells: [[0,0],[0,1]],       isEdge: false };
const DOOR     = { id: "door",     isEdge: true };
// Marker: 1×1, no image (e.g. Hero Start)
const START    = { id: "start",   blocks: false };
// Furniture with image: 2×2 (e.g. Stairs)
const STAIRS   = { id: "stairs",  blocks: false, cells: [[0,0],[0,1],[1,0],[1,1]], image: "Stairs.png" };

const PIECES = { goblin: GOBLIN, bookcase: BOOKCASE, table: TABLE, door: DOOR, start: START, stairs: STAIRS };

// ─── togglePlacedPiece ────────────────────────────────────────────────────────

describe("togglePlacedPiece — placement", () => {
  it("places a 1×1 piece at the clicked cell", () => {
    const result = togglePlacedPiece({}, GOBLIN, 3, 5, 0);
    expect(result["3,5"]).toMatchObject({ type: "goblin", rotation: 0 });
    expect(result["3,5"].coveredCells).toEqual(["3,5"]);
  });

  it("stores the supplied rotation", () => {
    const result = togglePlacedPiece({}, GOBLIN, 3, 5, 2);
    expect(result["3,5"].rotation).toBe(2);
  });

  it("places a multi-cell piece and records coveredCells", () => {
    const result = togglePlacedPiece({}, BOOKCASE, 2, 3, 0);
    expect(result["2,3"].coveredCells).toEqual(["2,3", "2,4", "2,5"]);
  });

  it("records rotated coveredCells (rotation 1)", () => {
    // BOOKCASE [[0,0],[0,1],[0,2]] rotated 90°CW → [[0,0],[1,0],[2,0]]
    const result = togglePlacedPiece({}, BOOKCASE, 2, 3, 1);
    expect(result["2,3"].coveredCells).toEqual(["2,3", "3,3", "4,3"]);
  });

  it("stores blocks flag from the piece definition", () => {
    expect(togglePlacedPiece({}, BOOKCASE, 0, 0, 0)["0,0"].blocks).toBe(true);
    expect(togglePlacedPiece({}, GOBLIN,   0, 0, 0)["0,0"].blocks).toBe(false);
  });

  it("does NOT place when any covered cell is already occupied", () => {
    const placed = togglePlacedPiece({}, GOBLIN, 2, 4, 0); // occupies "2,4"
    const result = togglePlacedPiece(placed, BOOKCASE, 2, 3, 0); // would cover "2,3","2,4","2,5"
    expect(result["2,3"]).toBeUndefined(); // bookcase not placed
    expect(result["2,4"]).toBeDefined();   // goblin still there
  });

  it("ignores edge pieces (doors) — returns placed unchanged", () => {
    const placed = {};
    expect(togglePlacedPiece(placed, DOOR, 3, 5, 0)).toEqual({});
  });
});

describe("togglePlacedPiece — removal", () => {
  it("removes a 1×1 piece when clicking its cell again", () => {
    const placed = togglePlacedPiece({}, GOBLIN, 3, 5, 0);
    expect(togglePlacedPiece(placed, GOBLIN, 3, 5, 0)).toEqual({});
  });

  it("removes a multi-cell piece when clicking its anchor", () => {
    const placed = togglePlacedPiece({}, BOOKCASE, 2, 3, 0);
    expect(togglePlacedPiece(placed, BOOKCASE, 2, 3, 0)).toEqual({});
  });

  it("removes a multi-cell piece when clicking any covered cell", () => {
    const placed = togglePlacedPiece({}, BOOKCASE, 2, 3, 0); // covers 2,3 2,4 2,5
    expect(togglePlacedPiece(placed, BOOKCASE, 2, 5, 0)).toEqual({});
    expect(togglePlacedPiece(placed, BOOKCASE, 2, 4, 0)).toEqual({});
  });

  it("leaves other pieces intact when removing one", () => {
    let placed = togglePlacedPiece({},     GOBLIN, 1, 1, 0);
    placed     = togglePlacedPiece(placed, GOBLIN, 5, 5, 0);
    const result = togglePlacedPiece(placed, GOBLIN, 1, 1, 0);
    expect(result["1,1"]).toBeUndefined();
    expect(result["5,5"]).toBeDefined();
  });
});

// ─── togglePlacedPiece — marker stacking on furniture ────────────────────────

describe("togglePlacedPiece — marker stacking on furniture", () => {
  it("places a marker on a cell covered (not anchored) by multi-cell furniture", () => {
    // Stairs at anchor "2,3" covering "2,3","2,4","3,3","3,4"
    const withStairs = togglePlacedPiece({}, STAIRS, 2, 3, 0);
    // Place Hero Start at "2,4" (covered by Stairs, not the anchor)
    const result = togglePlacedPiece(withStairs, START, 2, 4, 0, PIECES);
    expect(result["2,4"]).toMatchObject({ type: "start" });
    expect(result["2,3"]).toBeDefined(); // Stairs still there
  });

  it("removes a marker stacked on furniture without affecting the furniture", () => {
    let placed = togglePlacedPiece({}, STAIRS, 2, 3, 0);
    placed = togglePlacedPiece(placed, START, 2, 4, 0, PIECES);
    const result = togglePlacedPiece(placed, START, 2, 4, 0, PIECES);
    expect(result["2,4"]).toBeUndefined(); // marker removed
    expect(result["2,3"]).toBeDefined();   // Stairs still there
  });

  it("places a marker as overlayMarker on the anchor cell of furniture", () => {
    const withStairs = togglePlacedPiece({}, STAIRS, 2, 3, 0);
    const result = togglePlacedPiece(withStairs, START, 2, 3, 0, PIECES);
    expect(result["2,3"].type).toBe("stairs");        // Stairs not removed
    expect(result["2,3"].overlayMarker).toBe("start"); // marker stored as overlay
    expect(Object.keys(result)).toHaveLength(1);       // still one entry
  });

  it("removes overlayMarker when clicking anchor again with marker tool", () => {
    let placed = togglePlacedPiece({}, STAIRS, 2, 3, 0);
    placed = togglePlacedPiece(placed, START, 2, 3, 0, PIECES);
    const result = togglePlacedPiece(placed, START, 2, 3, 0, PIECES);
    expect(result["2,3"].type).toBe("stairs");
    expect(result["2,3"].overlayMarker).toBeUndefined();
  });
});

// ─── rotatePlacedPiece ────────────────────────────────────────────────────────

describe("rotatePlacedPiece", () => {
  it("increments rotation mod 4 for a multi-cell piece", () => {
    const placed = togglePlacedPiece({}, BOOKCASE, 2, 3, 0);
    expect(rotatePlacedPiece(placed, PIECES, 2, 3)["2,3"].rotation).toBe(1);
  });

  it("wraps rotation from 3 back to 0", () => {
    const placed = { "2,3": { type: "bookcase", rotation: 3, blocks: true, coveredCells: ["2,3","1,3","0,3"] } };
    expect(rotatePlacedPiece(placed, PIECES, 2, 3)["2,3"].rotation).toBe(0);
  });

  it("recomputes coveredCells after rotation (0→1)", () => {
    const placed = togglePlacedPiece({}, BOOKCASE, 2, 3, 0);
    const result = rotatePlacedPiece(placed, PIECES, 2, 3);
    expect(result["2,3"].coveredCells).toEqual(["2,3", "3,3", "4,3"]);
  });

  it("works when clicking a covered cell (not the anchor)", () => {
    const placed = togglePlacedPiece({}, BOOKCASE, 2, 3, 0); // covers 2,3 2,4 2,5
    const result = rotatePlacedPiece(placed, PIECES, 2, 5);  // click covered cell
    expect(result["2,3"].rotation).toBe(1);
  });

  it("does NOT rotate a 1×1 piece (nothing changes)", () => {
    const placed = togglePlacedPiece({}, GOBLIN, 3, 5, 0);
    expect(rotatePlacedPiece(placed, PIECES, 3, 5)).toEqual(placed);
  });

  it("does NOT rotate when the rotated footprint would overlap another piece", () => {
    let placed = togglePlacedPiece({},     BOOKCASE, 2, 3, 0); // covers 2,3 2,4 2,5
    placed     = togglePlacedPiece(placed, GOBLIN,   3, 3, 0); // blocks rotation-1 footprint
    const result = rotatePlacedPiece(placed, PIECES, 2, 3);
    expect(result["2,3"].rotation).toBe(0); // unchanged
  });

  it("returns placed unchanged if no piece at the clicked cell", () => {
    const placed = {};
    expect(rotatePlacedPiece(placed, PIECES, 5, 5)).toEqual({});
  });
});

// ─── toggleDoor ───────────────────────────────────────────────────────────────

describe("toggleDoor", () => {
  it("places a door at the cell with the given rotation", () => {
    expect(toggleDoor({}, 3, 5, 0)["3,5"]).toEqual({ rotation: 0 });
    expect(toggleDoor({}, 3, 5, 2)["3,5"]).toEqual({ rotation: 2 });
  });

  it("removes the door when toggled again (any rotation)", () => {
    const doors = { "3,5": { rotation: 1 } };
    expect(toggleDoor(doors, 3, 5, 0)).toEqual({});
  });

  it("leaves other doors intact when removing one", () => {
    const doors = { "3,5": { rotation: 0 }, "7,7": { rotation: 2 } };
    const result = toggleDoor(doors, 3, 5, 0);
    expect(result["3,5"]).toBeUndefined();
    expect(result["7,7"]).toEqual({ rotation: 2 });
  });
});

// ─── cycleDoorRotation ────────────────────────────────────────────────────────

describe("cycleDoorRotation", () => {
  it("increments door rotation mod 4", () => {
    expect(cycleDoorRotation({ "3,5": { rotation: 0 } }, 3, 5)["3,5"].rotation).toBe(1);
    expect(cycleDoorRotation({ "3,5": { rotation: 1 } }, 3, 5)["3,5"].rotation).toBe(2);
    expect(cycleDoorRotation({ "3,5": { rotation: 2 } }, 3, 5)["3,5"].rotation).toBe(3);
  });

  it("wraps from 3 to 0", () => {
    expect(cycleDoorRotation({ "3,5": { rotation: 3 } }, 3, 5)["3,5"].rotation).toBe(0);
  });

  it("returns doors unchanged if no door at cell", () => {
    const doors = { "7,7": { rotation: 1 } };
    expect(cycleDoorRotation(doors, 3, 5)).toEqual(doors);
  });
});

// ─── placeNoteMarker ─────────────────────────────────────────────────────────

describe("placeNoteMarker", () => {
  it("places a note marker with a note", () => {
    const result = placeNoteMarker({}, 3, 4, "Find the key here");
    expect(result["3,4"]).toMatchObject({
      type: "notemarker", note: "Find the key here",
      blocks: false, rotation: 0,
    });
    expect(result["3,4"].coveredCells).toEqual(["3,4"]);
  });

  it("removes an existing note marker when clicking its cell again", () => {
    const placed = { "3,4": { type: "notemarker", note: "old", blocks: false, rotation: 0, coveredCells: ["3,4"] } };
    const result = placeNoteMarker(placed, 3, 4, "new");
    expect(result["3,4"]).toBeUndefined();
  });

  it("places on an empty cell even when note is empty", () => {
    const result = placeNoteMarker({}, 0, 0, "");
    expect(result["0,0"]).toMatchObject({ type: "notemarker", note: "" });
  });

  it("does not affect other placed pieces", () => {
    const placed = { "1,1": { type: "goblin", blocks: false, rotation: 0, coveredCells: ["1,1"] } };
    const result = placeNoteMarker(placed, 3, 4, "note");
    expect(result["1,1"]).toEqual(placed["1,1"]);
    expect(result["3,4"].type).toBe("notemarker");
  });
});

// ─── updateNoteMarker ─────────────────────────────────────────────────────────

describe("updateNoteMarker", () => {
  const base = { "3,4": { type: "notemarker", note: "old", blocks: false, rotation: 0, coveredCells: ["3,4"] } };

  it("updates the note of an existing note marker", () => {
    const result = updateNoteMarker(base, "3,4", "new note");
    expect(result["3,4"]).toMatchObject({ note: "new note" });
  });

  it("preserves other fields on update", () => {
    const result = updateNoteMarker(base, "3,4", "x");
    expect(result["3,4"].coveredCells).toEqual(["3,4"]);
    expect(result["3,4"].type).toBe("notemarker");
  });

  it("is a no-op if anchor does not exist", () => {
    const result = updateNoteMarker(base, "9,9", "note");
    expect(result).toEqual(base);
  });

  it("is a no-op if the piece at anchor is not a note marker", () => {
    const placed = { "3,4": { type: "goblin" } };
    const result = updateNoteMarker(placed, "3,4", "note");
    expect(result).toEqual(placed);
  });
});

// ─── setChestTrap ─────────────────────────────────────────────────────────────

describe("setChestTrap", () => {
  it("setChestTrap adds hasTrap and trapNote to placed piece", () => {
    const placed = { "3,5": { type: "chest", blocks: false } }
    const result = setChestTrap(placed, "3,5", true, "rusty spike")
    expect(result["3,5"].hasTrap).toBe(true)
    expect(result["3,5"].trapNote).toBe("rusty spike")
    expect(result["3,5"].type).toBe("chest") // other fields preserved
  });

  it("setChestTrap is a no-op when anchorKey not in placed", () => {
    const placed = {}
    expect(setChestTrap(placed, "3,5", true, "x")).toBe(placed)
  });

  it("setChestTrap can set hasTrap to false", () => {
    const placed = { "3,5": { type: "chest", hasTrap: true, trapNote: "x" } }
    const result = setChestTrap(placed, "3,5", false, "")
    expect(result["3,5"].hasTrap).toBe(false)
    expect(result["3,5"].trapNote).toBe("")
  });
});

// ─── setMonsterSpecial ────────────────────────────────────────────────────────

describe("setMonsterSpecial", () => {
  const base = { "3,4": { type: "goblin", blocks: false, rotation: 0, coveredCells: ["3,4"] } };

  it("marks a monster as special with a note", () => {
    const result = setMonsterSpecial(base, "3,4", true, "Boss goblin");
    expect(result["3,4"]).toMatchObject({ isSpecial: true, specialNote: "Boss goblin" });
  });

  it("clears special status", () => {
    const placed = { "3,4": { ...base["3,4"], isSpecial: true, specialNote: "Boss" } };
    const result = setMonsterSpecial(placed, "3,4", false, "");
    expect(result["3,4"].isSpecial).toBe(false);
    expect(result["3,4"].specialNote).toBe("");
  });

  it("preserves other fields on the piece", () => {
    const result = setMonsterSpecial(base, "3,4", true, "note");
    expect(result["3,4"].type).toBe("goblin");
    expect(result["3,4"].coveredCells).toEqual(["3,4"]);
  });

  it("is a no-op if no piece at anchor", () => {
    expect(setMonsterSpecial({}, "3,4", true, "note")).toEqual({});
  });
});
