import { describe, it, expect } from "vitest";
import { getTrapRenderMode, shouldHideHeroStart, shouldShowChestGlow } from "./TokenOverlay.jsx";

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

describe("shouldHideHeroStart", () => {
  // Hero Start in play mode → should be hidden
  it("returns true for type='start' in play mode (isEditMode=false)", () => {
    expect(shouldHideHeroStart("start", false)).toBe(true);
  });

  // Hero Start in edit mode → should NOT be hidden
  it("returns false for type='start' in edit mode (isEditMode=true)", () => {
    expect(shouldHideHeroStart("start", true)).toBe(false);
  });

  // Non-start piece in play mode → should NOT be hidden
  it("returns false for type='goblin' in play mode (isEditMode=false)", () => {
    expect(shouldHideHeroStart("goblin", false)).toBe(false);
  });
});

describe("shouldShowChestGlow", () => {
  it("returns true for un-opened chest in fog in play mode", () =>
    expect(shouldShowChestGlow("chest", false, true, false)).toBe(true))
  it("returns false when already opened", () =>
    expect(shouldShowChestGlow("chest", false, true, true)).toBe(false))
  it("returns false when not in fog", () =>
    expect(shouldShowChestGlow("chest", false, false, false)).toBe(false))
  it("returns false in edit mode", () =>
    expect(shouldShowChestGlow("chest", true, true, false)).toBe(false))
  it("returns false for non-chest types", () =>
    expect(shouldShowChestGlow("goblin", false, true, false)).toBe(false))
});

describe("shouldHideHeroStart — overlayMarker guard", () => {
  // The overlayMarker path uses the same helper to decide whether to render.
  it("returns true for overlayMarker='start' in play mode", () => {
    expect(shouldHideHeroStart("start", false)).toBe(true);
  });

  it("returns false for overlayMarker='start' in edit mode", () => {
    expect(shouldHideHeroStart("start", true)).toBe(false);
  });

  it("returns false for overlayMarker='search' in play mode", () => {
    expect(shouldHideHeroStart("search", false)).toBe(false);
  });
});
