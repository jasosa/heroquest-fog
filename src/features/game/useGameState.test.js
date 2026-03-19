import { describe, it, expect } from "vitest";
import { hasHeroStart } from "./useGameState.js";

describe("hasHeroStart", () => {
  it("returns false for empty placed", () => {
    expect(hasHeroStart({})).toBe(false);
  });

  it("returns false when no start piece is placed", () => {
    expect(hasHeroStart({ "1,1": { type: "goblin" } })).toBe(false);
  });

  it("returns true when a start piece is placed", () => {
    expect(hasHeroStart({ "3,3": { type: "start" } })).toBe(true);
  });

  it("returns true when start piece is among other pieces", () => {
    expect(hasHeroStart({ "1,1": { type: "goblin" }, "2,2": { type: "start" } })).toBe(true);
  });

  it("returns true when start is an overlayMarker on furniture", () => {
    expect(hasHeroStart({ "3,3": { type: "stairs", overlayMarker: "start" } })).toBe(true);
  });
});
