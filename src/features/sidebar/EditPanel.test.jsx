// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PieceButton, EditPanel } from "./EditPanel.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { PIECE_CATEGORIES } from "../../shared/pieces.js";

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

describe("PieceButton — sizing", () => {
  it("outer button has minHeight 48, gap 12, fontSize 13, and no gap-2 class", () => {
    const piece = { id: "goblin", image: "Monster_Goblin.png", label: "Goblin", color: "#66bb6a", shape: "circle" };
    const { container } = render(<PieceButton piece={piece} isSelected={false} onSelect={() => {}} tileSet="board2" />);
    const btn = container.querySelector("button");
    expect(btn.style.minHeight).toBe("48px");
    expect(btn.style.gap === "12px" || btn.style.gap === "12").toBe(true);
    expect(btn.style.fontSize).toBe("13px");
    expect(btn.className).not.toMatch(/\bgap-2\b/);
  });

  it("image piece <img> is 36x36", () => {
    const piece = { id: "goblin", image: "Monster_Goblin.png", label: "Goblin", color: "#66bb6a", shape: "circle" };
    const { container } = render(<PieceButton piece={piece} isSelected={false} onSelect={() => {}} tileSet="board2" />);
    const img = container.querySelector("img");
    expect(img.style.width).toBe("36px");
    expect(img.style.height).toBe("36px");
  });

  it("non-image piece swatch <div> is 36x36", () => {
    const piece = { id: "start", label: "Hero Start", icon: "⚔", color: "#f0c040", shape: "diamond", blocks: false };
    const { container } = render(<PieceButton piece={piece} isSelected={false} onSelect={() => {}} tileSet="board2" />);
    const swatch = container.querySelector("button > div");
    expect(swatch.style.width).toBe("36px");
    expect(swatch.style.height).toBe("36px");
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

describe("EditPanel — category tab sizing", () => {
  it("category tab buttons have padding 7px 10px, fontSize 11, minHeight 36", () => {
    const { container } = render(
      <EditPanel
        pieceCategories={PIECE_CATEGORIES}
        tool=""
        onSelectTool={() => {}}
        tileSet="board2"
      />
    );
    const tabButtons = PIECE_CATEGORIES.map(cat =>
      Array.from(container.querySelectorAll("button")).find(b => b.textContent === cat.label)
    );
    tabButtons.forEach(btn => {
      expect(btn).toBeTruthy();
      expect(btn.style.padding).toBe("7px 10px");
      expect(btn.style.fontSize).toBe("11px");
      expect(btn.style.minHeight).toBe("36px");
    });
  });
});

describe("EditPanel — piece list scroll container", () => {
  it("piece-list container has a maxHeight and overflowY auto", () => {
    const { getByTestId } = render(
      <EditPanel
        pieceCategories={PIECE_CATEGORIES}
        tool=""
        onSelectTool={() => {}}
        tileSet="board2"
      />
    );
    const list = getByTestId("piece-list");
    expect(list.style.maxHeight).toBeTruthy();
    expect(list.style.overflowY).toBe("auto");
  });
});

describe("EditPanel", () => {
  it("renders a 'Pieces' section header above the category tabs", () => {
    const { getByText } = render(
      <EditPanel
        pieceCategories={PIECE_CATEGORIES}
        tool=""
        onSelectTool={() => {}}
        tileSet="board2"
      />
    );
    expect(getByText("Pieces")).toBeTruthy();
  });

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
