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
