import { describe, it, expect } from "vitest";
import { computeFitZoom } from "./fitZoom.js";

describe("computeFitZoom", () => {
  it("returns 1 when availableWidth is 0", () => {
    const result = computeFitZoom({
      availableWidth: 0, availableHeight: 2000,
      boardWidth: 962, boardHeight: 703,
      zoomMin: 0.25, zoomMax: 3,
    });
    expect(result).toBe(1);
  });

  it("returns 1 when availableHeight is 0", () => {
    const result = computeFitZoom({
      availableWidth: 1443, availableHeight: 0,
      boardWidth: 962, boardHeight: 703,
      zoomMin: 0.25, zoomMax: 3,
    });
    expect(result).toBe(1);
  });

  it("covers using the width ratio when width is the binding (larger-ratio) dimension", () => {
    const result = computeFitZoom({
      availableWidth: 1443, availableHeight: 1000,
      boardWidth: 962, boardHeight: 703,
      zoomMin: 0.25, zoomMax: 3,
    });
    expect(result).toBe(1.5);
  });

  it("covers using the height ratio when height is the binding (larger-ratio) dimension", () => {
    const result = computeFitZoom({
      availableWidth: 962, availableHeight: 1406,
      boardWidth: 962, boardHeight: 703,
      zoomMin: 0.25, zoomMax: 3,
    });
    expect(result).toBe(2);
  });

  it("clamps to zoomMax when the raw fit ratio exceeds it", () => {
    const result = computeFitZoom({
      availableWidth: 5000, availableHeight: 5000,
      boardWidth: 962, boardHeight: 703,
      zoomMin: 0.25, zoomMax: 3,
    });
    expect(result).toBe(3);
  });

  it("clamps to zoomMin when the raw fit ratio is below it", () => {
    const result = computeFitZoom({
      availableWidth: 50, availableHeight: 50,
      boardWidth: 962, boardHeight: 703,
      zoomMin: 0.25, zoomMax: 3,
    });
    expect(result).toBe(0.25);
  });

  it("returns 1 (never NaN or negative) for negative dimensions", () => {
    const result = computeFitZoom({
      availableWidth: -100, availableHeight: -100,
      boardWidth: 962, boardHeight: 703,
      zoomMin: 0.25, zoomMax: 3,
    });
    expect(result).toBe(1);
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBeGreaterThan(0);
  });
});
