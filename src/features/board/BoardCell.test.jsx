// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
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
