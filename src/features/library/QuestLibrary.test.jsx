// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import QuestLibrary from "./QuestLibrary.jsx";
import { T } from "../../shared/theme.js";
import * as storage from "../../shared/questStorage.js";

afterEach(() => { cleanup(); localStorage.clear(); });

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

describe("QuestLibrary card background", () => {
  it("quest card has explicit background matching T.panelBg", () => {
    storage.createQuest({ title: "Test Quest", description: "", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const card = container.querySelector(".card");
    expect(card).toBeTruthy();
    expect(card.style.background).toBe(hexToRgb(T.panelBg));
  });
});

describe("QuestLibrary header text colours", () => {
  it("page title uses T.sidebarTitle on dark background", () => {
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    // Find heading with 'HeroQuest' or similar — look for the element with letterSpacing:4
    const heading = Array.from(container.querySelectorAll("*")).find(el =>
      el.style && el.style.letterSpacing === "4px" && el.tagName !== "BUTTON"
    );
    expect(heading).toBeTruthy();
    expect(heading.style.color).toBe(hexToRgb(T.sidebarTitle));
  });
});
