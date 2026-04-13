// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { T } from "../../shared/theme.js";
import { GameScreen } from "./GameScreen.jsx";

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

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

describe("GameScreen — hover tooltip colour", () => {
  it("hover tooltip element uses T.sidebarText color (not hardcoded #f0e6d0)", () => {
    // Place a note marker at corridor cell 0,0 (first cell of the board)
    const notemarkerPlaced = {
      "0,0": {
        type: "notemarker",
        blocks: false,
        rotation: 0,
        coveredCells: ["0,0"],
        note: "Find the key!",
      }
    };
    const quest = {
      id: "q-tooltip",
      title: "T",
      description: "",
      placed: notemarkerPlaced,
      doors: {},
    };
    const { container } = render(
      <GameScreen quest={quest} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );

    // Board cells are rendered in row-major order.
    // Cell 0,0 is a corridor cell. Clicking it in play mode (empty fog) triggers
    // the RoomConfirmDialog because corridor connectivity is not established yet.
    // We click the cell, then confirm "Yes — Reveal" to force the fog reveal.
    const allDivs = Array.from(container.querySelectorAll("div"));
    const rowDivs = allDivs.filter(el => el.childElementCount === 26);

    if (rowDivs.length > 0) {
      const cell00 = rowDivs[0].children[0];
      act(() => { fireEvent.click(cell00); });
    }

    // Confirm the room reveal dialog if it appeared
    const confirmBtn = Array.from(container.querySelectorAll("button")).find(btn =>
      btn.textContent.includes("Yes")
    );
    if (confirmBtn) {
      act(() => { fireEvent.click(confirmBtn); });
    }

    // After revealing cell 0,0, the note marker img should be visible.
    // Clicking the note img triggers onShowTooltip (play mode, non-edit).
    const noteImg = container.querySelector("img[alt='Event Note']");
    if (noteImg) {
      act(() => { fireEvent.click(noteImg); });
    }

    // The tooltip div has position:fixed and zIndex:200
    const tooltip = Array.from(container.querySelectorAll("div")).find(el =>
      el.style.position === "fixed" && el.style.zIndex === "200"
    );
    expect(tooltip).toBeTruthy();
    expect(tooltip.style.color).toBe(hexToRgb(T.sidebarText));
  });
});

describe("GameScreen — zoom indicator visibility", () => {
  it("zoom indicator uses T.sidebarText color, not T.textMuted (dark brown invisible on dark bg)", () => {
    const quest = { id: "q-zoom", title: "T", description: "", placed: {}, doors: {} };
    const { container } = render(
      <GameScreen quest={quest} initialMode="edit" onBack={() => {}} onQuestSaved={() => {}} />
    );
    // The zoom indicator span shows "100%" at default zoom
    const zoomSpan = Array.from(container.querySelectorAll("span")).find(el =>
      el.textContent.trim() === "100%"
    );
    expect(zoomSpan).toBeTruthy();
    // Must NOT use T.textMuted (#5a3010) — dark brown is invisible on the near-black board bg
    expect(zoomSpan.style.color).not.toBe(hexToRgb(T.textMuted));
    // Must use a light readable color — T.sidebarText
    expect(zoomSpan.style.color).toBe(hexToRgb(T.sidebarText));
  });
});

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
