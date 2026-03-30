// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { TokenOverlay } from "./TokenOverlay.jsx";

afterEach(() => cleanup());

// Minimal getTokenPos stub for component tests
const getTokenPos = (col, row) => [col * 37 + 18.5, row * 37 + 18.5];

// ─── Task 11: warning image glow + onTrapInteraction ─────────────────────────

describe("TokenOverlay — warning image onTrapInteraction", () => {
  it("clicking the warning image calls onTrapInteraction(anchorKey)", () => {
    const onTrapInteraction = vi.fn();
    const fog = new Set(["5,5"]);
    const { container } = render(
      <TokenOverlay
        anchorKey="5,5"
        type="pit"
        coveredCells={["5,5"]}
        rotation={0}
        fog={fog}
        isEditMode={false}
        getTokenPos={getTokenPos}
        tileSet="board2"
        revealedTraps={new Set()}
        onTrapInteraction={onTrapInteraction}
      />
    );
    const img = container.querySelector("img");
    fireEvent.click(img);
    expect(onTrapInteraction).toHaveBeenCalledWith("5,5");
  });

  it("warning image has a red glow filter applied (contains c0392b)", () => {
    const fog = new Set(["5,5"]);
    const { container } = render(
      <TokenOverlay
        anchorKey="5,5"
        type="pit"
        coveredCells={["5,5"]}
        rotation={0}
        fog={fog}
        isEditMode={false}
        getTokenPos={getTokenPos}
        tileSet="board2"
        revealedTraps={new Set()}
        onTrapInteraction={() => {}}
      />
    );
    const img = container.querySelector("img");
    expect(img.style.filter).toContain("c0392b");
  });
});

// ─── Task 12: revealed trap click in play mode ────────────────────────────────

describe("TokenOverlay — revealed trap image in play mode", () => {
  it("when trapMode === 'real' and isEditMode === false, renders trap image with cursor: pointer", () => {
    const fog = new Set(["5,5"]);
    const revealedTraps = new Set(["5,5"]);
    const { container } = render(
      <TokenOverlay
        anchorKey="5,5"
        type="pit"
        coveredCells={["5,5"]}
        rotation={0}
        fog={fog}
        isEditMode={false}
        getTokenPos={getTokenPos}
        tileSet="board2"
        revealedTraps={revealedTraps}
        onTrapInteraction={() => {}}
      />
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.style.cursor).toBe("pointer");
  });

  it("clicking revealed trap image calls onTrapInteraction(anchorKey, true)", () => {
    const onTrapInteraction = vi.fn();
    const fog = new Set(["5,5"]);
    const revealedTraps = new Set(["5,5"]);
    const { container } = render(
      <TokenOverlay
        anchorKey="5,5"
        type="pit"
        coveredCells={["5,5"]}
        rotation={0}
        fog={fog}
        isEditMode={false}
        getTokenPos={getTokenPos}
        tileSet="board2"
        revealedTraps={revealedTraps}
        onTrapInteraction={onTrapInteraction}
      />
    );
    const img = container.querySelector("img");
    fireEvent.click(img);
    expect(onTrapInteraction).toHaveBeenCalledWith("5,5", true);
  });
});

// ─── Task 13: edit-mode config button for traps ───────────────────────────────

describe("TokenOverlay — edit mode config button for traps", () => {
  const editProps = {
    rotation: 0,
    fog: new Set(),
    isEditMode: true,
    getTokenPos,
    tileSet: "board2",
    revealedTraps: new Set(),
  };

  it("when isEditMode=true and type is 'pit', renders a config button", () => {
    const { container } = render(
      <TokenOverlay {...editProps} anchorKey="5,5" type="pit" coveredCells={["5,5"]} onConfigureTrap={() => {}} />
    );
    expect(container.querySelector("button")).toBeTruthy();
  });

  it("clicking config button calls onConfigureTrap(anchorKey)", () => {
    const onConfigureTrap = vi.fn();
    const { container } = render(
      <TokenOverlay {...editProps} anchorKey="5,5" type="pit" coveredCells={["5,5"]} onConfigureTrap={onConfigureTrap} />
    );
    const btn = container.querySelector("button");
    fireEvent.mouseDown(btn);
    expect(onConfigureTrap).toHaveBeenCalledWith("5,5");
  });

  it("config button appears for type 'trap'", () => {
    const { container } = render(
      <TokenOverlay {...editProps} anchorKey="5,5" type="trap" coveredCells={["5,5"]} onConfigureTrap={() => {}} />
    );
    expect(container.querySelector("button")).toBeTruthy();
  });

  it("config button appears for type 'spear'", () => {
    const { container } = render(
      <TokenOverlay {...editProps} anchorKey="5,5" type="spear" coveredCells={["5,5"]} onConfigureTrap={() => {}} />
    );
    expect(container.querySelector("button")).toBeTruthy();
  });

  it("config button appears for type 'falling'", () => {
    const { container } = render(
      <TokenOverlay {...editProps} anchorKey="5,5" type="falling" coveredCells={["5,5"]} onConfigureTrap={() => {}} />
    );
    expect(container.querySelector("button")).toBeTruthy();
  });
});

// ─── ISSUE-007: special monster tap shows note in play mode ───────────────────

describe("TokenOverlay — special monster click shows note on mobile (play mode)", () => {
  const baseMonsterProps = {
    anchorKey: "5,5",
    type: "goblin",
    coveredCells: ["5,5"],
    rotation: 0,
    fog: new Set(["5,5"]),
    isEditMode: false,
    getTokenPos,
    tileSet: "board2",
    revealedTraps: new Set(),
    isSpecial: true,
    specialNote: "Boss goblin — immune to arrows",
  };

  it("clicking a special monster image in play mode calls onShowTooltip with the special note", () => {
    const onShowTooltip = vi.fn();
    const { container } = render(
      <TokenOverlay {...baseMonsterProps} onShowTooltip={onShowTooltip} />
    );
    const img = container.querySelector("img");
    fireEvent.click(img);
    expect(onShowTooltip).toHaveBeenCalled();
    const [,, content] = onShowTooltip.mock.calls[0];
    expect(content).toBe("Boss goblin — immune to arrows");
  });

  it("clicking a non-special monster in play mode does NOT call onShowTooltip", () => {
    const onShowTooltip = vi.fn();
    const { container } = render(
      <TokenOverlay {...baseMonsterProps} isSpecial={false} specialNote="" onShowTooltip={onShowTooltip} />
    );
    const img = container.querySelector("img");
    fireEvent.click(img);
    expect(onShowTooltip).not.toHaveBeenCalled();
  });

  it("clicking a special monster in edit mode does NOT call onShowTooltip", () => {
    const onShowTooltip = vi.fn();
    const { container } = render(
      <TokenOverlay {...baseMonsterProps} isEditMode={true} onShowTooltip={onShowTooltip} />
    );
    const img = container.querySelector("img");
    // In edit mode there's no img at the root level due to the edit button overlay; just check no tooltip call
    fireEvent.click(img || container.firstChild);
    expect(onShowTooltip).not.toHaveBeenCalled();
  });
});
