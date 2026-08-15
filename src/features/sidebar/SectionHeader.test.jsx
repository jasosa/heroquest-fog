// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SectionHeader } from "./SectionHeader.jsx";

afterEach(cleanup);

describe("SectionHeader", () => {
  it("renders the given label text", () => {
    const { getByText } = render(<SectionHeader label="Mode" />);
    expect(getByText("Mode")).toBeTruthy();
  });

  it("renders two sibling gradient rule elements flanking the label", () => {
    const { container } = render(<SectionHeader label="Mode" />);
    const row = container.firstChild;
    const children = Array.from(row.children);
    const gradientEls = children.filter(el => {
      const bg = el.style.background || el.style.backgroundImage;
      return bg && bg.includes("linear-gradient");
    });
    expect(gradientEls.length).toBe(2);
  });

  it("label uses Cinzel heading font and uppercase styling", () => {
    const { getByText } = render(<SectionHeader label="Mode" />);
    const label = getByText("Mode");
    expect(label.style.fontFamily).toContain("Cinzel");
    expect(label.style.textTransform).toBe("uppercase");
  });
});
