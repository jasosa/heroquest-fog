import { describe, it, expect } from "vitest";
import { getTrapRenderMode } from "./TokenOverlay.jsx";

describe("getTrapRenderMode", () => {
  const fog = new Set(["3,5"]);
  const revealedTraps = new Set(["3,5"]);
  const emptyRevealedTraps = new Set();

  // Trap in edit mode → always show real icon
  it("returns 'real' for a trap in edit mode (not yet revealed)", () => {
    expect(getTrapRenderMode("trap", true, fog, emptyRevealedTraps, "3,5", ["3,5"])).toBe("real");
  });

  it("returns 'real' for a trap in edit mode (already revealed)", () => {
    expect(getTrapRenderMode("trap", true, fog, revealedTraps, "3,5", ["3,5"])).toBe("real");
  });

  // Trap in play mode, cell in fog, NOT revealed → show warning
  it("returns 'warning' for a trap in play mode when cell is in fog but not revealed", () => {
    expect(getTrapRenderMode("trap", false, fog, emptyRevealedTraps, "3,5", ["3,5"])).toBe("warning");
  });

  // Trap in play mode, cell in fog, IN revealedTraps → show real
  it("returns 'real' for a trap in play mode when cell is revealed", () => {
    expect(getTrapRenderMode("trap", false, fog, revealedTraps, "3,5", ["3,5"])).toBe("real");
  });

  // Cell not in fog → hidden (handled by isVisible guard before this helper)
  it("returns 'hidden' when cell is not in fog in play mode", () => {
    const emptyFog = new Set();
    expect(getTrapRenderMode("trap", false, emptyFog, emptyRevealedTraps, "3,5", ["3,5"])).toBe("hidden");
  });

  // Non-trap pieces → 'real' (not affected by trap logic)
  it("returns 'real' for a non-trap piece (goblin) in play mode", () => {
    expect(getTrapRenderMode("goblin", false, fog, emptyRevealedTraps, "3,5", ["3,5"])).toBe("real");
  });

  it("returns 'real' for a non-trap piece (chest) in play mode", () => {
    expect(getTrapRenderMode("chest", false, fog, emptyRevealedTraps, "3,5", ["3,5"])).toBe("real");
  });

  // Trap with no image (just token circle) — 'trap' piece has no image field
  it("returns 'warning' for 'trap' (no image) in play mode, unrevealed", () => {
    expect(getTrapRenderMode("trap", false, fog, emptyRevealedTraps, "3,5", ["3,5"])).toBe("warning");
  });

  // coveredCells visibility: revealed if any covered cell is in fog
  it("returns 'warning' when anchorKey not in fog but a covered cell is in fog", () => {
    const fog2 = new Set(["3,6"]);
    expect(getTrapRenderMode("pit", false, fog2, emptyRevealedTraps, "3,5", ["3,5", "3,6"])).toBe("warning");
  });

  // hidden when anchorKey not in fog and no covered cell in fog
  it("returns 'hidden' when neither anchor nor covered cells are in fog", () => {
    const fog2 = new Set(["3,6"]);
    expect(getTrapRenderMode("pit", false, fog2, emptyRevealedTraps, "3,5", ["3,5"])).toBe("hidden");
  });
});
