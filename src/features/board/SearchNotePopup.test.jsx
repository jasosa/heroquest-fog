// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { SearchNotePopup } from "./SearchNotePopup.jsx";
import { T } from "../../shared/theme.js";

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

afterEach(() => cleanup());

describe("SearchNotePopup", () => {
  it("renders search result heading", () => {
    const { container } = render(
      <SearchNotePopup notes={["Find treasure!"]} count={0} onClose={() => {}} />
    );
    expect(container.textContent).toMatch(/Search Result/);
  });

  it("renders the note text", () => {
    const { getByText } = render(
      <SearchNotePopup notes={["Find treasure!"]} count={0} onClose={() => {}} />
    );
    expect(getByText("Find treasure!")).toBeTruthy();
  });

  it("renders default message when notes is empty", () => {
    const { container } = render(
      <SearchNotePopup notes={[]} count={0} onClose={() => {}} />
    );
    expect(container.textContent).toMatch(/Draw a treasure card/);
  });

  it("heading has color T.sidebarTitle", () => {
    const { container } = render(
      <SearchNotePopup notes={["Find treasure!"]} count={0} onClose={() => {}} />
    );
    const heading = Array.from(container.querySelectorAll("div")).find(el =>
      el.textContent.includes("Search Result") && el.style.fontWeight === "bold"
    );
    expect(heading).toBeTruthy();
    expect(heading.style.color).toBe(hexToRgb(T.sidebarTitle));
  });

  it("body text has color T.sidebarText", () => {
    const { getByText } = render(
      <SearchNotePopup notes={["Find treasure!"]} count={0} onClose={() => {}} />
    );
    const body = getByText("Find treasure!");
    expect(body.style.color).toBe(hexToRgb(T.sidebarText));
  });

  it("sub-text (search number) has color T.sidebarTextMuted", () => {
    const { container } = render(
      <SearchNotePopup notes={["Find treasure!"]} count={0} onClose={() => {}} />
    );
    const subText = Array.from(container.querySelectorAll("div")).find(el =>
      el.textContent.includes("Search number") && el.style.fontSize === "10px"
    );
    expect(subText).toBeTruthy();
    expect(subText.style.color).toBe(hexToRgb(T.sidebarTextMuted));
  });

  it("calls onClose when Close button clicked", () => {
    const onClose = vi.fn();
    const { getByText } = render(
      <SearchNotePopup notes={["Find treasure!"]} count={0} onClose={onClose} />
    );
    fireEvent.click(getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
