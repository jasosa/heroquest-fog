import { describe, it, expect } from "vitest";
import {
  PAN_DRAG_THRESHOLD_PX,
  centeredAxisOffset,
  clampAxisOffset,
  clampPanOffset,
  computeInitialPanOffset,
  computeRecenterOnZoomOffset,
  isPannable,
  exceedsPanThreshold,
} from "./panOffset.js";

describe("PAN_DRAG_THRESHOLD_PX", () => {
  it("is 6", () => {
    expect(PAN_DRAG_THRESHOLD_PX).toBe(6);
  });
});

describe("centeredAxisOffset", () => {
  it("centers a board smaller than the container (positive offset)", () => {
    const result = centeredAxisOffset({ containerSize: 1000, boardSize: 500, zoom: 1 });
    expect(result).toBe(250);
  });

  it("centers a board larger than the container (negative offset)", () => {
    const result = centeredAxisOffset({ containerSize: 1000, boardSize: 1000, zoom: 1.5 });
    expect(result).toBe(-250);
  });
});

describe("clampAxisOffset", () => {
  it("locked case: ignores desired and returns centered offset when board*zoom fits within the container", () => {
    const result = clampAxisOffset({ desired: -9999, containerSize: 1000, boardSize: 500, zoom: 1 });
    expect(result).toBe(250);
  });

  it("locked case: also ignores a large positive desired value", () => {
    const result = clampAxisOffset({ desired: 9999, containerSize: 1000, boardSize: 500, zoom: 1 });
    expect(result).toBe(250);
  });

  it("overflow case: clamps a too-negative desired value to the lower bound", () => {
    // board*zoom = 1500 > container 1000 -> bounds [1000-1500, 0] = [-500, 0]
    const result = clampAxisOffset({ desired: -1000, containerSize: 1000, boardSize: 1000, zoom: 1.5 });
    expect(result).toBe(-500);
  });

  it("overflow case: clamps a positive desired value to the upper bound (0)", () => {
    const result = clampAxisOffset({ desired: 100, containerSize: 1000, boardSize: 1000, zoom: 1.5 });
    expect(result).toBe(0);
  });

  it("overflow case: passes through a desired value already within bounds", () => {
    const result = clampAxisOffset({ desired: -200, containerSize: 1000, boardSize: 1000, zoom: 1.5 });
    expect(result).toBe(-200);
  });
});

describe("clampPanOffset", () => {
  it("clamps both axes independently", () => {
    const result = clampPanOffset({
      offset: { x: -1000, y: 100 },
      containerWidth: 1000, containerHeight: 1000,
      boardWidth: 1000, boardHeight: 1000,
      zoom: 1.5,
    });
    // bounds on each axis: [1000-1500,0] = [-500,0]
    expect(result).toEqual({ x: -500, y: 0 });
  });
});

describe("computeInitialPanOffset", () => {
  it("locks width (exact fit) and centers the overflowing height axis — 1443x1000 container, 962x703 board, zoom 1.5", () => {
    const result = computeInitialPanOffset({
      containerWidth: 1443, containerHeight: 1000,
      boardWidth: 962, boardHeight: 703,
      zoom: 1.5,
    });
    // width: 962*1.5 = 1443 === container -> locked/centered -> x = (1443-1443)/2 = 0
    // height: 703*1.5 = 1054.5 > 1000 -> centered -> y = (1000-1054.5)/2 = -27.25 (within clamp bounds)
    expect(result.x).toBe(0);
    expect(result.y).toBe(-27.25);
  });
});

describe("computeRecenterOnZoomOffset", () => {
  it("zooming in from an exact-fit baseline recenters on the same board point (hand-derived fixture)", () => {
    // containerWidth=1000, boardWidth=500, oldZoom=2 (exact fit, oldOffset.x=0)
    // boardCoordAtCenter = (1000/2 - 0)/2 = 250
    // desired = 500 - 4*250 = -500
    // clamp bounds at newZoom=4: [1000-2000,0] = [-1000,0] -> -500 within range
    const result = computeRecenterOnZoomOffset({
      oldOffset: { x: 0, y: 0 },
      oldZoom: 2, newZoom: 4,
      containerWidth: 1000, containerHeight: 1000,
      boardWidth: 500, boardHeight: 500,
    });
    expect(result).toEqual({ x: -500, y: -500 });
  });

  it("zooming back out until the axis re-fits snaps to the locked-centered value (not raw unclamped math)", () => {
    // oldZoom=3, oldOffset.x=-100 (arbitrary, not on the "centered" trajectory)
    // boardCoordAtCenter = (500 - (-100))/3 = 200
    // raw desired = 500 - 1*200 = 300 (NOT the expected result)
    // but board*newZoom = 500*1 = 500 <= container 1000 -> locked -> centered = (1000-500)/2 = 250
    const result = computeRecenterOnZoomOffset({
      oldOffset: { x: -100, y: -100 },
      oldZoom: 3, newZoom: 1,
      containerWidth: 1000, containerHeight: 1000,
      boardWidth: 500, boardHeight: 500,
    });
    expect(result).toEqual({ x: 250, y: 250 });
  });
});

describe("isPannable", () => {
  it("returns false when the board fits within the container on both axes", () => {
    const result = isPannable({
      containerWidth: 1000, containerHeight: 1000,
      boardWidth: 500, boardHeight: 500,
      zoom: 1,
    });
    expect(result).toBe(false);
  });

  it("returns true when the board overflows the container on both axes", () => {
    const result = isPannable({
      containerWidth: 1000, containerHeight: 1000,
      boardWidth: 500, boardHeight: 500,
      zoom: 3,
    });
    expect(result).toBe(true);
  });

  it("returns true when only one axis overflows", () => {
    const result = isPannable({
      containerWidth: 1000, containerHeight: 2000,
      boardWidth: 500, boardHeight: 500,
      zoom: 3,
    });
    expect(result).toBe(true);
  });
});

describe("exceedsPanThreshold", () => {
  it("returns false for a small movement below the default threshold", () => {
    expect(exceedsPanThreshold({ dx: 2, dy: 1 })).toBe(false);
  });

  it("returns true for a movement past the default threshold", () => {
    expect(exceedsPanThreshold({ dx: 10, dy: 0 })).toBe(true);
  });

  it("returns true exactly at the threshold boundary", () => {
    expect(exceedsPanThreshold({ dx: 6, dy: 0 })).toBe(true);
  });

  it("honors a custom threshold override", () => {
    expect(exceedsPanThreshold({ dx: 10, dy: 0, threshold: 20 })).toBe(false);
  });
});
