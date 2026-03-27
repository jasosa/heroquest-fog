import { describe, it, expect } from "vitest";
import { isTrapPiece } from "./pieces.js";

describe("isTrapPiece", () => {
  it("returns true for 'trap'", () => {
    expect(isTrapPiece("trap")).toBe(true);
  });

  it("returns true for 'pit'", () => {
    expect(isTrapPiece("pit")).toBe(true);
  });

  it("returns true for 'spear'", () => {
    expect(isTrapPiece("spear")).toBe(true);
  });

  it("returns true for 'falling'", () => {
    expect(isTrapPiece("falling")).toBe(true);
  });

  it("returns false for a monster id ('goblin')", () => {
    expect(isTrapPiece("goblin")).toBe(false);
  });

  it("returns false for a furniture id ('chest')", () => {
    expect(isTrapPiece("chest")).toBe(false);
  });

  it("returns false for a marker id ('start')", () => {
    expect(isTrapPiece("start")).toBe(false);
  });

  it("returns false for an unknown id", () => {
    expect(isTrapPiece("unknown")).toBe(false);
  });
});
