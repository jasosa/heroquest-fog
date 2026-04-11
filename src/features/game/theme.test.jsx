// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { T } from "../../shared/theme.js";
import { GameScreen } from "./GameScreen.jsx";

describe("Theme token WCAG compliance", () => {
  it("T.pageBg is #12100e", () => expect(T.pageBg).toBe("#12100e"));
  it("T.panelBg is #1e1a12", () => expect(T.panelBg).toBe("#1e1a12"));
  it("T.accentGold is #f0c040", () => expect(T.accentGold).toBe("#f0c040"));
  it("T.sidebarTitle is #f0d080", () => expect(T.sidebarTitle).toBe("#f0d080"));
  it("T.sidebarTextMuted is #c8b888", () => expect(T.sidebarTextMuted).toBe("#c8b888"));
  it("T.sidebarTextFaint is #907040", () => expect(T.sidebarTextFaint).toBe("#907040"));
  it("T.sidebarInputBorder is #9a7a30", () => expect(T.sidebarInputBorder).toBe("#9a7a30"));
  it("T.sidebarBtnText is #d8c888", () => expect(T.sidebarBtnText).toBe("#d8c888"));
  it("T.sidebarBtnActiveBdr is #f0c040", () => expect(T.sidebarBtnActiveBdr).toBe("#f0c040"));
});

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

describe("GameScreen — play mode badge colour", () => {
  it("play mode badge uses #4caf50 not hardcoded #2a6a2a", () => {
    const quest = { id: "q1", title: "T", description: "", placed: {}, doors: {} };
    const { container } = render(
      <GameScreen quest={quest} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    const badge = Array.from(container.querySelectorAll("div")).find(el =>
      el.style && el.style.fontSize === "9px" && el.style.letterSpacing === "3px"
    );
    expect(badge).toBeTruthy();
    expect(badge.style.color).toBe(hexToRgb("#4caf50"));
  });
});
