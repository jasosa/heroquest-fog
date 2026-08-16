// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent, act } from "@testing-library/react";
import { GameScreen } from "./GameScreen.jsx";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

function makeQuest() {
  return { id: "q-pan", title: "T", description: "", placed: {}, doors: {} };
}

function mockRect({ width, height }) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width, height, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON() {},
  });
}

function getInnerBoardDiv(container) {
  return Array.from(container.querySelectorAll("div")).find(el =>
    el.style.transform && el.style.transform.includes("scale(")
  );
}

describe("GameScreen — pan offset centers the overflowing axis on mount", () => {
  it("centers the overflowing height axis (1443x1000 container, 962x703 board -> 150% zoom)", () => {
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    const inner = getInnerBoardDiv(container);
    expect(inner).toBeTruthy();
    // width axis is an exact fit at 150% zoom -> x = 0
    // height axis overflows (703*1.5=1054.5 > 1000) -> centered -> y = (1000-1054.5)/2 = -27.25
    expect(inner.style.transform).toBe("translate(0px, -27.25px) scale(1.5)");
  });

  it("marks the transform-scaled board div with willChange: transform (stabilizes its compositing layer)", () => {
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    const inner = getInnerBoardDiv(container);
    expect(inner).toBeTruthy();
    expect(inner.style.willChange).toBe("transform");
  });
});

function getBoardAreaDiv(container) {
  // The pannable container is the parent of the transform-scaled inner div.
  const inner = getInnerBoardDiv(container);
  return inner?.parentElement;
}

describe("GameScreen — pointer-drag panning", () => {
  it("updates the transform offset and cursor while dragging past the threshold, at a non-1 zoom", () => {
    // 1443x1000 container, 962x703 board -> 150% zoom. Width axis is an exact
    // fit (locked at x=0 regardless of drag); height axis overflows and
    // starts centered at y=-27.25 (see the mount-centering test above).
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="edit" onBack={() => {}} onQuestSaved={() => {}} />
    );
    const boardArea = getBoardAreaDiv(container);
    expect(boardArea.style.cursor).toBe("grab");

    act(() => {
      fireEvent.pointerDown(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 100, clientY: 100 });
    });
    act(() => {
      fireEvent.pointerMove(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 100, clientY: 110 });
    });

    expect(boardArea.style.cursor).toBe("grabbing");
    const inner = getInnerBoardDiv(container);
    // dy=10 (distance 10 >= 6px threshold): y = -27.25 + 10 = -17.25, within
    // clamp bounds [-54.5, 0]. x stays locked at 0 (an order-sensitive exact
    // string match, so a backwards translate/scale swap would fail here).
    expect(inner.style.transform).toBe("translate(0px, -17.25px) scale(1.5)");

    act(() => {
      fireEvent.pointerUp(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 100, clientY: 110 });
    });
    expect(boardArea.style.cursor).toBe("grab");
  });
});

function dismissPlacementPopup(container) {
  const okBtn = Array.from(container.querySelectorAll("button")).find(btn => btn.textContent === "OK");
  act(() => { fireEvent.click(okBtn); });
}

function getPlainRoomCell(container) {
  const rowDivs = Array.from(container.querySelectorAll("div")).filter(el => el.childElementCount === 26);
  return rowDivs[1].children[1];
}

function hasRoomConfirmDialog(container) {
  return !!Array.from(container.querySelectorAll("button")).find(btn => btn.textContent.includes("Yes"));
}

describe("GameScreen — click suppression after a pan drag", () => {
  it("a tiny move below the threshold does not suppress the following click (normal click still fires)", () => {
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    dismissPlacementPopup(container);
    const boardArea = getBoardAreaDiv(container);
    const cell = getPlainRoomCell(container);

    act(() => { fireEvent.pointerDown(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 50, clientY: 50 }); });
    act(() => { fireEvent.pointerMove(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 52, clientY: 51 }); });
    act(() => { fireEvent.pointerUp(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 52, clientY: 51 }); });
    act(() => { fireEvent.click(cell); });

    expect(hasRoomConfirmDialog(container)).toBe(true);
  });

  it("a move past the threshold suppresses the following click on the same target", () => {
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    dismissPlacementPopup(container);
    const boardArea = getBoardAreaDiv(container);
    const cell = getPlainRoomCell(container);

    act(() => { fireEvent.pointerDown(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 50, clientY: 50 }); });
    act(() => { fireEvent.pointerMove(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 60, clientY: 50 }); });
    act(() => { fireEvent.pointerUp(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 60, clientY: 50 }); });
    act(() => { fireEvent.click(cell); });

    expect(hasRoomConfirmDialog(container)).toBe(false);
  });
});

describe("GameScreen — zoom button clicked mid-drag (before pointerup)", () => {
  it("clicking a zoom button mid-drag recenters using the pre-interrupt pan/zoom and suppresses the following click", () => {
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    dismissPlacementPopup(container);
    const boardArea = getBoardAreaDiv(container);
    const cell = getPlainRoomCell(container);

    act(() => {
      fireEvent.pointerDown(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 100, clientY: 100 });
    });
    act(() => {
      fireEvent.pointerMove(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 100, clientY: 110 });
    });

    // Same drag as the "drag-transform-tracking at zoom!=1" test above:
    // dy=10 crosses the 6px threshold, leaving pan={x:0, y:-17.25} at zoom=1.5.
    expect(boardArea.style.cursor).toBe("grabbing");
    expect(getInnerBoardDiv(container).style.transform).toBe("translate(0px, -17.25px) scale(1.5)");

    // Deliberately no pointerUp here -- the zoom button is clicked while the
    // drag is still active, and applyZoom() must end the gesture "as if
    // pointerup fired" (see endPanAsRelease in GameScreen.jsx).
    const zoomInBtn = Array.from(container.querySelectorAll("button")).find(btn => btn.title === "Zoom in");
    expect(zoomInBtn.disabled).toBe(false);
    act(() => { fireEvent.click(zoomInBtn); });

    // The drag gesture ended as-if-released.
    expect(boardArea.style.cursor).toBe("grab");

    const inner = getInnerBoardDiv(container);
    // zoomIn(): newZoom = 1.5 + 0.25 = 1.75.
    // x-axis: boardCoordAtCenter = (1443/2 - 0)/1.5 = 481;
    //   desired = 721.5 - 1.75*481 = -120.25; scaled width 962*1.75=1683.5 > 1443
    //   so clamp bounds [1443-1683.5, 0] = [-240.5, 0]; -120.25 is in range -> x=-120.25.
    // y-axis: this is the crux of the test. It must recenter using the LIVE
    // mid-drag pan (y=-17.25 from above), not the pre-drag/mount-time pan
    // (y=-27.25), which would prove applyZoom reads a stale panRef.
    //   boardCoordAtCenter = (1000/2 - (-17.25))/1.5 = 517.25/1.5 = 344.8333...;
    //   desired = 500 - 1.75*344.8333... = -103.45833333333326; scaled height
    //   703*1.75=1230.25 > 1000 so clamp bounds [1000-1230.25, 0] = [-230.25, 0];
    //   -103.4583... is in range -> y=-103.45833333333326.
    // Contrast fixture: if applyZoom had (bug) used the pre-drag/mount-time
    // pan {x:0, y:-27.25} instead of the live mid-drag value, the same
    // formula gives a cleanly different y: boardCoordAtCenter=(500-(-27.25))/1.5
    // = 351.5 exactly; desired = 500 - 1.75*351.5 = -115.125 exactly. The
    // assertion below (-103.45833333333326, not -115.125) is what actually
    // discriminates live vs. stale pan state, not merely "some transform changed".
    expect(inner.style.transform).toBe("translate(-120.25px, -103.45833333333326px) scale(1.75)");

    act(() => { fireEvent.click(cell); });
    expect(hasRoomConfirmDialog(container)).toBe(false);
  });
});

describe("GameScreen — pointercancel / lostpointercapture clean up the gesture", () => {
  it("pointercancel ends the gesture: cursor returns to grab and a subsequent plain click works normally", () => {
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    dismissPlacementPopup(container);
    const boardArea = getBoardAreaDiv(container);
    const cell = getPlainRoomCell(container);

    act(() => { fireEvent.pointerDown(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 50, clientY: 50 }); });
    act(() => { fireEvent.pointerMove(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 60, clientY: 50 }); });
    expect(boardArea.style.cursor).toBe("grabbing");

    act(() => { fireEvent.pointerCancel(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 60, clientY: 50 }); });
    expect(boardArea.style.cursor).toBe("grab");

    act(() => { fireEvent.click(cell); });
    expect(hasRoomConfirmDialog(container)).toBe(true);
  });

  it("lostpointercapture ends the gesture: cursor returns to grab and a subsequent plain click works normally", () => {
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    dismissPlacementPopup(container);
    const boardArea = getBoardAreaDiv(container);
    const cell = getPlainRoomCell(container);

    act(() => { fireEvent.pointerDown(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 50, clientY: 50 }); });
    act(() => { fireEvent.pointerMove(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 60, clientY: 50 }); });
    expect(boardArea.style.cursor).toBe("grabbing");

    act(() => { fireEvent.lostPointerCapture(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 60, clientY: 50 }); });
    expect(boardArea.style.cursor).toBe("grab");

    act(() => { fireEvent.click(cell); });
    expect(hasRoomConfirmDialog(container)).toBe(true);
  });
});

describe("GameScreen — right-click never arms panning", () => {
  it("button:2 pointerdown+move never turns the cursor to grabbing", () => {
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    dismissPlacementPopup(container);
    const boardArea = getBoardAreaDiv(container);

    act(() => { fireEvent.pointerDown(boardArea, { pointerId: 1, pointerType: "mouse", button: 2, clientX: 50, clientY: 50 }); });
    act(() => { fireEvent.pointerMove(boardArea, { pointerId: 1, pointerType: "mouse", button: 2, clientX: 60, clientY: 50 }); });

    expect(boardArea.style.cursor).not.toBe("grabbing");
  });
});

describe("GameScreen — in-board dialogs disable pan-arming", () => {
  it("with pendingRoomReveal open, a wobbly pointer sequence on the confirm button still fires normally", () => {
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    dismissPlacementPopup(container);
    const cell = getPlainRoomCell(container);
    act(() => { fireEvent.click(cell); });
    const confirmBtn = Array.from(container.querySelectorAll("button")).find(btn => btn.textContent.includes("Yes"));
    expect(confirmBtn).toBeTruthy();

    const boardArea = getBoardAreaDiv(container);
    act(() => { fireEvent.pointerDown(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 50, clientY: 50 }); });
    act(() => { fireEvent.pointerMove(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 60, clientY: 50 }); });
    act(() => { fireEvent.pointerUp(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 60, clientY: 50 }); });
    act(() => { fireEvent.click(confirmBtn); });

    // Dialog resolved (Yes button no longer present) -- confirm click fired normally.
    expect(hasRoomConfirmDialog(container)).toBe(false);
  });

  it("with pendingPlacementPopup open, a wobbly pointer sequence on the OK button still fires normally", () => {
    mockRect({ width: 1443, height: 1000 });
    const { container } = render(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />
    );
    const okBtn = Array.from(container.querySelectorAll("button")).find(btn => btn.textContent === "OK");
    expect(okBtn).toBeTruthy();

    const boardArea = getBoardAreaDiv(container);
    act(() => { fireEvent.pointerDown(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 50, clientY: 50 }); });
    act(() => { fireEvent.pointerMove(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 60, clientY: 50 }); });
    act(() => { fireEvent.pointerUp(boardArea, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 60, clientY: 50 }); });
    act(() => { fireEvent.click(okBtn); });

    const okBtnAfter = Array.from(container.querySelectorAll("button")).find(btn => btn.textContent === "OK");
    expect(okBtnAfter).toBeFalsy();
  });
});
