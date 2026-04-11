import { describe, it, expect } from "vitest";
import { resolveTilePath } from "./editPanelUtils.js";

describe("resolveTilePath", () => {
  it("returns null for a piece with no image", () => {
    const piece = { id: "start", label: "Hero Start", color: "#f0c040" };
    expect(resolveTilePath(piece, "board2")).toBeNull();
  });

  it("returns root-level path for tileIndependent piece", () => {
    const piece = { id: "notemarker", image: "note.png", tileIndependent: true };
    expect(resolveTilePath(piece, "board2")).toBe("/tiles/note.png");
  });

  it("returns tileset-subfolder path for regular piece with image", () => {
    const piece = { id: "goblin", image: "Monster_Goblin.png" };
    expect(resolveTilePath(piece, "board2")).toBe("/tiles/board2/Monster_Goblin.png");
  });

  it("uses board2 as default tileSet when undefined", () => {
    const piece = { id: "goblin", image: "Monster_Goblin.png" };
    expect(resolveTilePath(piece, undefined)).toBe("/tiles/board2/Monster_Goblin.png");
  });

  it("returns root-level path for tileIndependent piece with any tileSet", () => {
    const piece = { id: "search", image: "search.png", tileIndependent: true };
    expect(resolveTilePath(piece, "board3")).toBe("/tiles/search.png");
  });
});
