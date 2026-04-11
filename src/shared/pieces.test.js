import { describe, it, expect } from "vitest";
import { isTrapPiece, PIECES } from "./pieces.js";

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

describe("marker piece image fields", () => {
  it("notemarker has image note.png", () => {
    expect(PIECES.notemarker.image).toBe("note.png");
  });

  it("search has image search.png", () => {
    expect(PIECES.search.image).toBe("search.png");
  });

  it("searchsecret has image search-secret-door.png", () => {
    expect(PIECES.searchsecret.image).toBe("search-secret-door.png");
  });

  it("start has no image", () => {
    expect(PIECES.start.image).toBeUndefined();
  });
});
