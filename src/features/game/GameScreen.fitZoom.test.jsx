// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent, act } from "@testing-library/react";
import { GameScreen } from "./GameScreen.jsx";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

function makeQuest() {
  return { id: "q-fitzoom", title: "T", description: "", placed: {}, doors: {} };
}

function mockRect({ width, height }) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width, height, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON() {},
  });
}

function getZoomText(container) {
  const zoomSpan = Array.from(container.querySelectorAll("span")).find(el =>
    /^\d+%$/.test(el.textContent.trim())
  );
  return zoomSpan?.textContent.trim();
}

describe("GameScreen — fit-to-viewport zoom on mount", () => {
  it("computes 150% zoom when the board area measures 1443x2000", () => {
    mockRect({ width: 1443, height: 2000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    expect(getZoomText(container)).toBe("150%");
  });

  it("falls back to 100% when the container measures zero (jsdom default, unmocked)", () => {
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    expect(getZoomText(container)).toBe("100%");
  });

  it("clamps to 25% (ZOOM_MIN) for a tiny container, and disables the zoom-out button", () => {
    mockRect({ width: 50, height: 50 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    expect(getZoomText(container)).toBe("25%");
    const zoomOutBtn = Array.from(container.querySelectorAll("button")).find(btn => btn.title === "Zoom out");
    expect(zoomOutBtn.disabled).toBe(true);
  });

  it("clamps to 300% (ZOOM_MAX) for a huge container, and disables the zoom-in button", () => {
    mockRect({ width: 5000, height: 5000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    expect(getZoomText(container)).toBe("300%");
    const zoomInBtn = Array.from(container.querySelectorAll("button")).find(btn => btn.title === "Zoom in");
    expect(zoomInBtn.disabled).toBe(true);
  });

  it("zooming in from a 150% fit baseline goes to 175%, not 125% (proves setZoom writes shared state)", () => {
    mockRect({ width: 1443, height: 2000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    expect(getZoomText(container)).toBe("150%");
    const zoomInBtn = Array.from(container.querySelectorAll("button")).find(btn => btn.title === "Zoom in");
    act(() => { fireEvent.click(zoomInBtn); });
    expect(getZoomText(container)).toBe("175%");
  });

  it("does not leak zoom state across mounts (simulates key={quest.id} remount)", () => {
    mockRect({ width: 1443, height: 2000 });
    const first = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    expect(getZoomText(first.container)).toBe("150%");
    first.unmount();

    mockRect({ width: 962, height: 703 });
    const second = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    expect(getZoomText(second.container)).toBe("100%");
  });
});
