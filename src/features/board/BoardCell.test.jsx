// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React from "react";
import BoardCell from "./BoardCell.jsx";

describe("BoardCell outline behaviour", () => {
  it("does NOT show red outline in play mode (isLastClick=true, isEditMode=false)", () => {
    const { container } = render(
      <BoardCell
        r={0}
        c={0}
        region="R1"
        isRevealed={true}
        isEditMode={false}
        isLastClick={true}
        coverage={undefined}
        onClick={() => {}}
        onRightClick={() => {}}
      />
    );
    const div = container.firstChild;
    expect(div.style.outline).toBe("none");
  });

  it("SHOWS red outline in edit mode (isLastClick=true, isEditMode=true)", () => {
    const { container } = render(
      <BoardCell
        r={0}
        c={0}
        region="R1"
        isRevealed={true}
        isEditMode={true}
        isLastClick={true}
        coverage={undefined}
        onClick={() => {}}
        onRightClick={() => {}}
      />
    );
    const div = container.firstChild;
    expect(div.style.outline).toBe("2px solid #c0302066");
  });

  it("does NOT show red outline when isLastClick=false in play mode", () => {
    const { container } = render(
      <BoardCell
        r={0}
        c={0}
        region="R1"
        isRevealed={true}
        isEditMode={false}
        isLastClick={false}
        coverage={undefined}
        onClick={() => {}}
        onRightClick={() => {}}
      />
    );
    const div = container.firstChild;
    expect(div.style.outline).toBe("none");
  });
});

describe("BoardCell hover behaviour", () => {
  it("does not use filter for hover highlight (avoids compositing-layer promotion); uses background instead", () => {
    const { container } = render(
      <BoardCell
        r={0}
        c={0}
        region="R1"
        isRevealed={true}
        isEditMode={false}
        isLastClick={false}
        coverage={undefined}
        onClick={() => {}}
        onRightClick={() => {}}
      />
    );
    const div = container.firstChild;
    const originalBackground = div.style.background;

    expect(div.style.filter).toBe("");

    fireEvent.mouseEnter(div);
    expect(div.style.filter).toBe("");
    expect(div.style.background).not.toBe(originalBackground);

    fireEvent.mouseLeave(div);
    expect(div.style.filter).toBe("");
    expect(div.style.background).toBe(originalBackground);
  });

  it("shows NO hover effect on wall cells (region === null)", () => {
    const { container } = render(
      <BoardCell
        r={0}
        c={0}
        region={null}
        isRevealed={false}
        isEditMode={false}
        isLastClick={false}
        coverage={undefined}
        onClick={() => {}}
        onRightClick={() => {}}
      />
    );
    const div = container.firstChild;
    const originalBackground = div.style.background;

    fireEvent.mouseEnter(div);
    expect(div.style.filter).toBe("");
    expect(div.style.background).toBe(originalBackground);
  });
});
