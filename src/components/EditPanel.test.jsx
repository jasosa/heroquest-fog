// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PieceButton, EditPanel } from "./EditPanel.jsx";
import { Sidebar } from "../features/sidebar/Sidebar.jsx";
import { PIECE_CATEGORIES } from "../pieces.js";

afterEach(cleanup);

describe("PieceButton", () => {
  it("renders <img> with tileset-subfolder src when piece has image", () => {
    const piece = { id: "goblin", image: "Monster_Goblin.png", label: "Goblin", color: "#66bb6a", shape: "circle" };
    const { container } = render(<PieceButton piece={piece} isSelected={false} onSelect={() => {}} tileSet="board2" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("/tiles/board2/Monster_Goblin.png");
  });

  it("renders <img> with root-level src for tileIndependent piece", () => {
    const piece = { id: "notemarker", image: "note.png", tileIndependent: true, label: "Event Note", color: "#90caf9", shape: "square" };
    const { container } = render(<PieceButton piece={piece} isSelected={false} onSelect={() => {}} tileSet="board2" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("/tiles/note.png");
  });

  it("renders colored swatch (no img) when piece has no image", () => {
    const piece = { id: "start", label: "Hero Start", icon: "⚔", color: "#f0c040", shape: "diamond", blocks: false };
    const { container } = render(<PieceButton piece={piece} isSelected={false} onSelect={() => {}} tileSet="board2" />);
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("Sidebar", () => {
  it("passes bgImage as tileSet to EditPanel so PieceButton images use that tileset", () => {
    const { container } = render(
      <Sidebar
        mode="edit"
        tool="goblin"
        setMode={() => {}}
        setTool={() => {}}
        onReset={() => {}}
        bgImage="board3"
        setBgImage={() => {}}
      />
    );
    // Monsters tab is active by default; goblin image should use board3 subfolder
    const imgs = container.querySelectorAll("img");
    const goblinImg = Array.from(imgs).find(img => img.getAttribute("src") && img.getAttribute("src").includes("board3"));
    expect(goblinImg).not.toBeUndefined();
  });
});

describe("EditPanel", () => {
  it("forwards tileSet prop to PieceButton — img src uses the given tileset", () => {
    const { container } = render(
      <EditPanel
        pieceCategories={PIECE_CATEGORIES}
        tool="goblin"
        onSelectTool={() => {}}
        tileSet="board3"
      />
    );
    // Monsters tab is active by default; goblin has image Monster_Goblin.png
    const imgs = container.querySelectorAll("img");
    const goblinImg = Array.from(imgs).find(img => img.getAttribute("src").includes("board3"));
    expect(goblinImg).not.toBeUndefined();
  });
});
