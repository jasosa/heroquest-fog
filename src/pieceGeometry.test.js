import { describe, it, expect } from "vitest";
import { rotateCells90, rotateCells, getDistinctRotations, getCoveredCellKeys } from "./pieceGeometry.js";

// ─── rotateCells90 ───────────────────────────────────────────────────────────

describe("rotateCells90", () => {
  it("1×1 piece is a no-op", () => {
    expect(rotateCells90([[0, 0]])).toEqual([[0, 0]]);
  });

  it("extends right  → extends down", () => {
    expect(rotateCells90([[0, 0], [0, 1]])).toEqual([[0, 0], [1, 0]]);
  });

  it("extends down   → extends left", () => {
    expect(rotateCells90([[0, 0], [1, 0]])).toEqual([[0, 0], [0, -1]]);
  });

  it("extends left   → extends up", () => {
    expect(rotateCells90([[0, 0], [0, -1]])).toEqual([[0, 0], [-1, 0]]);
  });

  it("extends up     → extends right (back to start)", () => {
    expect(rotateCells90([[0, 0], [-1, 0]])).toEqual([[0, 0], [0, 1]]);
  });
});

// ─── rotateCells ─────────────────────────────────────────────────────────────

describe("rotateCells", () => {
  const fireplace = [[0, 0], [0, 1]];

  it("rotation 0 is identity", () => {
    expect(rotateCells(fireplace, 0)).toEqual(fireplace);
  });

  it("rotation 4 is identity", () => {
    expect(rotateCells(fireplace, 4)).toEqual(fireplace);
  });

  it("rotation 8 is identity", () => {
    expect(rotateCells(fireplace, 8)).toEqual(fireplace);
  });

  it("all four rotations of a 2×1 piece are distinct", () => {
    const keys = [0, 1, 2, 3].map(n =>
      rotateCells(fireplace, n).map(([r, c]) => `${r},${c}`).sort().join("|")
    );
    expect(new Set(keys).size).toBe(4);
  });

  it("all four rotations of a 2×2 piece are distinct", () => {
    const stairs = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const keys = [0, 1, 2, 3].map(n =>
      rotateCells(stairs, n).map(([r, c]) => `${r},${c}`).sort().join("|")
    );
    expect(new Set(keys).size).toBe(4);
  });

  it("all four rotations of a 3×1 piece are distinct", () => {
    const bookcase = [[0, 0], [0, 1], [0, 2]];
    const keys = [0, 1, 2, 3].map(n =>
      rotateCells(bookcase, n).map(([r, c]) => `${r},${c}`).sort().join("|")
    );
    expect(new Set(keys).size).toBe(4);
  });
});

// ─── getCoveredCellKeys — fireplace bug-report example ───────────────────────

describe("getCoveredCellKeys", () => {
  const cells = [[0, 0], [0, 1]]; // 2×1, default extends right

  it("rotation 0 — anchor + right", () => {
    expect(getCoveredCellKeys(9, 12, cells, 0).sort())
      .toEqual(["9,12", "9,13"].sort());
  });

  it("rotation 1 — anchor + down", () => {
    expect(getCoveredCellKeys(9, 12, cells, 1).sort())
      .toEqual(["9,12", "10,12"].sort());
  });

  it("rotation 2 — anchor + left", () => {
    expect(getCoveredCellKeys(9, 12, cells, 2).sort())
      .toEqual(["9,12", "9,11"].sort());
  });

  it("rotation 3 — anchor + up", () => {
    expect(getCoveredCellKeys(9, 12, cells, 3).sort())
      .toEqual(["9,12", "8,12"].sort());
  });

  it("rotation 4 — same as rotation 0", () => {
    expect(getCoveredCellKeys(9, 12, cells, 4).sort())
      .toEqual(getCoveredCellKeys(9, 12, cells, 0).sort());
  });

  it("1×1 piece (no cells) always covers only the anchor", () => {
    expect(getCoveredCellKeys(5, 3, undefined, 2)).toEqual(["5,3"]);
  });

  it("3×1 bookcase rotation 0 — extends right", () => {
    const bookcase = [[0, 0], [0, 1], [0, 2]];
    expect(getCoveredCellKeys(2, 2, bookcase, 0).sort())
      .toEqual(["2,2", "2,3", "2,4"].sort());
  });

  it("3×1 bookcase rotation 1 — extends down", () => {
    const bookcase = [[0, 0], [0, 1], [0, 2]];
    expect(getCoveredCellKeys(2, 2, bookcase, 1).sort())
      .toEqual(["2,2", "3,2", "4,2"].sort());
  });
});

// ─── getDistinctRotations ────────────────────────────────────────────────────

describe("getDistinctRotations", () => {
  it("1×1 piece has 1 rotation", () => {
    expect(getDistinctRotations([[0, 0]])).toBe(1);
  });

  it("null returns 1", () => {
    expect(getDistinctRotations(null)).toBe(1);
  });

  it("undefined returns 1", () => {
    expect(getDistinctRotations(undefined)).toBe(1);
  });

  it("2×1 piece has 4 distinct rotations (no normalisation)", () => {
    expect(getDistinctRotations([[0, 0], [0, 1]])).toBe(4);
  });

  it("3×1 piece has 4 distinct rotations", () => {
    expect(getDistinctRotations([[0, 0], [0, 1], [0, 2]])).toBe(4);
  });

  it("2×2 piece has 4 distinct rotations", () => {
    expect(getDistinctRotations([[0, 0], [0, 1], [1, 0], [1, 1]])).toBe(4);
  });
});
