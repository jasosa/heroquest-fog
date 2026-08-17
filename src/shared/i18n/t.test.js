import { describe, it, expect } from "vitest";
import { t } from "./t.js";

const dict = {
  common: {
    cancel: "Cancel",
  },
  library: {
    heading: "HeroQuest — Quest Library",
  },
  board: {
    trap: {
      applyToAll: "Apply to all {trapTypeLabel} traps in this quest",
    },
  },
};

describe("t", () => {
  it("resolves a top-level dot-path key", () => {
    expect(t(dict, "common.cancel")).toBe("Cancel");
  });

  it("resolves a nested dot-path key", () => {
    expect(t(dict, "board.trap.applyToAll", { trapTypeLabel: "Pit Trap" })).toBe(
      "Apply to all Pit Trap traps in this quest"
    );
  });

  it("falls back to the key itself when the key is entirely missing", () => {
    expect(t(dict, "does.not.exist")).toBe("does.not.exist");
  });

  it("falls back to the key itself when an intermediate segment is missing", () => {
    expect(t(dict, "library.missing.deeper")).toBe("library.missing.deeper");
  });

  it("falls back to the key itself when the resolved value is not a string", () => {
    expect(t(dict, "library")).toBe("library");
  });

  it("falls back to the key itself when the resolved value is an array", () => {
    expect(t({ a: [1, 2, 3] }, "a")).toBe("a");
  });

  it("interpolates a single variable", () => {
    expect(t(dict, "board.trap.applyToAll", { trapTypeLabel: "Spear Trap" })).toBe(
      "Apply to all Spear Trap traps in this quest"
    );
  });

  it("leaves unmatched placeholders visible when a var is missing", () => {
    expect(t(dict, "board.trap.applyToAll", {})).toBe(
      "Apply to all {trapTypeLabel} traps in this quest"
    );
  });

  it("leaves unmatched placeholders visible when no vars object is passed", () => {
    expect(t(dict, "board.trap.applyToAll")).toBe(
      "Apply to all {trapTypeLabel} traps in this quest"
    );
  });

  it("does not throw when dict is missing the requested top-level namespace", () => {
    expect(t({}, "common.cancel")).toBe("common.cancel");
  });
});
