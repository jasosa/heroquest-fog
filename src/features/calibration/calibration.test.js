import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadCalibration, saveCalibration } from "../../shared/questStorage.js";
import { useMapTransform } from "./MapCalibrator.jsx";

// ─── localStorage mock (not available in node test env) ───────────────────────
let store = {};
const localStorageMock = {
  getItem:    (key)        => store[key] ?? null,
  setItem:    (key, value) => { store[key] = String(value); },
  removeItem: (key)        => { delete store[key]; },
  clear:      ()           => { store = {}; },
};
vi.stubGlobal("localStorage", localStorageMock);

beforeEach(() => {
  store = {};
});

// ─── questStorage calibration CRUD ────────────────────────────────────────────
describe("loadCalibration", () => {
  it("returns empty object when nothing is stored", () => {
    expect(loadCalibration()).toEqual({});
  });

  it("returns stored calibration data", () => {
    const data = { board2: { anchors: [], ready: false } };
    localStorage.setItem("hq_calibration", JSON.stringify(data));
    expect(loadCalibration()).toEqual(data);
  });

  it("returns empty object on malformed JSON", () => {
    localStorage.setItem("hq_calibration", "not-json{{");
    expect(loadCalibration()).toEqual({});
  });
});

describe("saveCalibration", () => {
  it("persists data readable by loadCalibration", () => {
    const data = {
      board: { anchors: [{ pixel: [10, 20], logical: [1, 2] }], ready: false },
    };
    saveCalibration(data);
    expect(loadCalibration()).toEqual(data);
  });

  it("overwrites previously saved data", () => {
    saveCalibration({ board: { anchors: [], ready: false } });
    const updated = { board2: { anchors: [], ready: true } };
    saveCalibration(updated);
    expect(loadCalibration()).toEqual(updated);
  });

  it("round-trips anchors with pixel and logical values intact", () => {
    const anchors = [
      { pixel: [123, 456], logical: [3, 7] },
      { pixel: [789, 101], logical: [12, 0] },
    ];
    saveCalibration({ board3: { anchors, ready: false } });
    const loaded = loadCalibration();
    expect(loaded.board3.anchors).toEqual(anchors);
  });
});

// ─── useMapTransform ──────────────────────────────────────────────────────────
// Note: useMapTransform contains no React hooks — it is safe to call as a
// plain function in unit tests.

describe("useMapTransform — fallback", () => {
  it("returns [0,0] when calibrationData is null", () => {
    const t = useMapTransform(null, "board");
    expect(t(5, 5)).toEqual([0, 0]);
  });

  it("returns [0,0] when the requested mapId is absent", () => {
    const t = useMapTransform({ board2: { anchors: [] } }, "board");
    expect(t(5, 5)).toEqual([0, 0]);
  });

  it("returns [0,0] with fewer than 3 anchors", () => {
    const data = { board: { anchors: [{ pixel: [0, 0], logical: [0, 0] }] } };
    const t = useMapTransform(data, "board");
    expect(t(1, 1)).toEqual([0, 0]);
  });

  it("returns [0,0] with exactly 2 anchors", () => {
    const data = {
      board: {
        anchors: [
          { pixel: [0, 0], logical: [0, 0] },
          { pixel: [100, 0], logical: [10, 0] },
        ],
      },
    };
    const t = useMapTransform(data, "board");
    expect(t(5, 0)).toEqual([0, 0]);
  });
});

describe("useMapTransform — affine (3 anchors)", () => {
  // Simple uniform scale: logical * 10 = pixel
  const anchors = [
    { pixel: [0,   0  ], logical: [0,  0 ] },
    { pixel: [100, 0  ], logical: [10, 0 ] },
    { pixel: [0,   100], logical: [0,  10] },
  ];
  const data = { board: { anchors, ready: true } };

  it("maps each anchor's logical coords back to its own pixel", () => {
    const t = useMapTransform(data, "board");
    for (const { pixel, logical } of anchors) {
      const [px, py] = t(logical[0], logical[1]);
      expect(px).toBeCloseTo(pixel[0], 1);
      expect(py).toBeCloseTo(pixel[1], 1);
    }
  });

  it("interpolates an interior point correctly", () => {
    const t = useMapTransform(data, "board");
    const [px, py] = t(5, 3);
    expect(px).toBeCloseTo(50, 1);
    expect(py).toBeCloseTo(30, 1);
  });

  it("extrapolates beyond the anchor region", () => {
    const t = useMapTransform(data, "board");
    const [px, py] = t(20, 15);
    expect(px).toBeCloseTo(200, 1);
    expect(py).toBeCloseTo(150, 1);
  });
});

describe("useMapTransform — affine with translation and scale", () => {
  // Offset origin: logical (0,0) → pixel (50,50), scale 20px per cell
  const anchors = [
    { pixel: [50,  50 ], logical: [0, 0] },
    { pixel: [70,  50 ], logical: [1, 0] },
    { pixel: [50,  70 ], logical: [0, 1] },
  ];
  const data = { board2: { anchors, ready: true } };

  it("maps anchor points exactly", () => {
    const t = useMapTransform(data, "board2");
    for (const { pixel, logical } of anchors) {
      const [px, py] = t(logical[0], logical[1]);
      expect(px).toBeCloseTo(pixel[0], 1);
      expect(py).toBeCloseTo(pixel[1], 1);
    }
  });

  it("applies translation correctly", () => {
    const t = useMapTransform(data, "board2");
    // col=3,row=2 → pixel (50+60, 50+40) = (110, 90)
    const [px, py] = t(3, 2);
    expect(px).toBeCloseTo(110, 1);
    expect(py).toBeCloseTo(90, 1);
  });
});

describe("useMapTransform — homography (4+ anchors)", () => {
  // 4 anchors forming a unit square logical → pixel square (scaled ×100)
  const anchors = [
    { pixel: [0,   0  ], logical: [0, 0] },
    { pixel: [100, 0  ], logical: [1, 0] },
    { pixel: [100, 100], logical: [1, 1] },
    { pixel: [0,   100], logical: [0, 1] },
  ];
  const data = { board3: { anchors, ready: true } };

  it("maps each anchor's logical coords back to its own pixel", () => {
    const t = useMapTransform(data, "board3");
    for (const { pixel, logical } of anchors) {
      const [px, py] = t(logical[0], logical[1]);
      expect(px).toBeCloseTo(pixel[0], 0);
      expect(py).toBeCloseTo(pixel[1], 0);
    }
  });

  it("maps the centre of the square to the centre pixel", () => {
    const t = useMapTransform(data, "board3");
    const [px, py] = t(0.5, 0.5);
    expect(px).toBeCloseTo(50, 0);
    expect(py).toBeCloseTo(50, 0);
  });

  it("uses board3 calibration, not board", () => {
    const tBoard  = useMapTransform(data, "board");  // no anchors
    const tBoard3 = useMapTransform(data, "board3");
    expect(tBoard(0.5, 0.5)).toEqual([0, 0]);
    const [px] = tBoard3(0.5, 0.5);
    expect(px).toBeGreaterThan(0);
  });
});
