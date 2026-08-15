// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import { GameScreen } from "./GameScreen.jsx";

afterEach(() => cleanup());

// Two monsters placed on row-0 corridor cells. A Hero Start marker at "0,0"
// auto-reveals the row-0 corridor on entering play mode (see game-state.md),
// so the monster tokens are visible without needing manual fog clicks —
// TokenOverlay hides tokens entirely (not just intercepts pointer events)
// until their cell is in fog (tokenRenderHelpers.getTrapRenderMode).
function makeQuest() {
  return {
    id: "q-monster-tooltip",
    title: "T",
    description: "",
    placed: {
      "0,0": { type: "start", blocks: false, rotation: 0, coveredCells: ["0,0"] },
      "0,3": { type: "goblin", blocks: false, rotation: 0, coveredCells: ["0,3"] },
      "0,4": { type: "orc", blocks: false, rotation: 0, coveredCells: ["0,4"] },
    },
    doors: {},
  };
}

function findTooltip(container) {
  return Array.from(container.querySelectorAll("div")).find(el =>
    el.style.position === "fixed" && el.style.zIndex === "200"
  );
}

describe("GameScreen — monster tooltip toggle/dismiss", () => {
  it("clicking a monster shows a tooltip with its label, clicking it again toggles it off", () => {
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );

    const goblinImg = container.querySelector("img[alt='Goblin']");
    expect(goblinImg).toBeTruthy();

    act(() => { fireEvent.click(goblinImg); });
    let tooltip = findTooltip(container);
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toBe("Goblin");

    act(() => { fireEvent.click(goblinImg); });
    tooltip = findTooltip(container);
    expect(tooltip).toBeFalsy();
  });

  it("clicking a second monster while a tooltip is open replaces the content (not stacked)", () => {
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );

    const goblinImg = container.querySelector("img[alt='Goblin']");
    const orcImg = container.querySelector("img[alt='Orc']");

    act(() => { fireEvent.click(goblinImg); });
    expect(findTooltip(container).textContent).toBe("Goblin");

    act(() => { fireEvent.click(orcImg); });
    const tooltip = findTooltip(container);
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toBe("Orc");
  });

  it("clicking a plain revealed-cell (no piece) dismisses an open tooltip and still performs the cell's normal click effect", () => {
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );

    const goblinImg = container.querySelector("img[alt='Goblin']");
    act(() => { fireEvent.click(goblinImg); });
    expect(findTooltip(container)).toBeTruthy();

    // Click a plain room cell (1,1, region R1) with no piece on it. The quest
    // has no doors, so clicking any room cell deterministically triggers the
    // RoomConfirmDialog ("require a visible connecting door") — a reliable,
    // observable normal-click effect independent of fog state.
    const allDivs = Array.from(container.querySelectorAll("div"));
    const rowDivs = allDivs.filter(el => el.childElementCount === 26);
    expect(rowDivs.length).toBeGreaterThan(1);
    const plainRoomCell = rowDivs[1].children[1];
    act(() => { fireEvent.click(plainRoomCell); });

    // Tooltip dismissed.
    expect(findTooltip(container)).toBeFalsy();

    // Normal click effect still occurs: the room-confirm dialog appears
    // (proving the plain-cell click handler ran, i.e. the click wasn't swallowed).
    const confirmBtn = Array.from(container.querySelectorAll("button")).find(btn =>
      btn.textContent.includes("Yes")
    );
    expect(confirmBtn).toBeTruthy();
  });

  it("desktop hover still works: mouseEnter shows tooltip, mouseLeave hides it, re-entering the same monster shows it again", () => {
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    const goblinImg = container.querySelector("img[alt='Goblin']");

    act(() => { fireEvent.mouseEnter(goblinImg); });
    expect(findTooltip(container)).toBeTruthy();

    act(() => { fireEvent.mouseLeave(goblinImg); });
    expect(findTooltip(container)).toBeFalsy();

    act(() => { fireEvent.mouseEnter(goblinImg); });
    expect(findTooltip(container)).toBeTruthy();
  });
});
