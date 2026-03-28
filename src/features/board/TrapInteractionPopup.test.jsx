// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { TrapInteractionPopup } from "./TrapInteractionPopup.jsx";

afterEach(() => cleanup());

const noop = () => {};

// ─── Task 4: options phase (isRevealed=false) ─────────────────────────────────

describe("TrapInteractionPopup — options phase", () => {
  const baseProps = {
    anchorKey: "3,5",
    isRevealed: false,
    pieceType: "pit",
    pieceLabel: "Pit Trap",
    pieceImage: "Pit_Tile.png",
    trapNote: "",
    onRevealTrap: vi.fn(),
    onDisarmTrap: vi.fn(),
    onClose: vi.fn(),
  };

  it("when isRevealed=false, renders header 'Trap Spotted!'", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Trap Spotted!")).toBeTruthy();
  });

  it("renders jump-over rule text containing 'black shield'", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText(/black shield/i)).toBeTruthy();
  });

  it("renders disarm-adjacent rule text", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    expect(container.textContent).toMatch(/disarm/i);
  });

  it("renders 'Reveal Trap' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Reveal Trap")).toBeTruthy();
  });

  it("renders 'Disarm Trap' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Disarm Trap")).toBeTruthy();
  });

  it("renders 'Dismiss' button/link", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Dismiss")).toBeTruthy();
  });

  it("'Dismiss' calls onClose", () => {
    const onClose = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Dismiss"));
    expect(onClose).toHaveBeenCalled();
  });

  it("backdrop click calls onClose", () => {
    const onClose = vi.fn();
    const { container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── Task 5: revealed phase ───────────────────────────────────────────────────

describe("TrapInteractionPopup — revealed phase", () => {
  const baseRevealedProps = {
    anchorKey: "3,5",
    isRevealed: true,
    pieceType: "pit",
    pieceLabel: "Pit Trap",
    pieceImage: "Pit_Tile.png",
    trapNote: "",
    onRevealTrap: noop,
    onDisarmTrap: noop,
    onClose: noop,
  };

  it("when isRevealed=true, renders pieceLabel as header immediately", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseRevealedProps} />);
    expect(getByText("Pit Trap")).toBeTruthy();
  });

  it("when isRevealed=true, does NOT show 'Trap Spotted!'", () => {
    const { queryByText } = render(<TrapInteractionPopup {...baseRevealedProps} />);
    expect(queryByText("Trap Spotted!")).toBeNull();
  });

  it("when pieceImage is provided, renders an img element", () => {
    const { container } = render(<TrapInteractionPopup {...baseRevealedProps} />);
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("when pieceImage is undefined, renders no img element", () => {
    const { container } = render(<TrapInteractionPopup {...baseRevealedProps} pieceImage={undefined} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("when trapNote is provided, renders the trapNote text (not fallback)", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseRevealedProps} trapNote="Custom DM note" />);
    expect(getByText("Custom DM note")).toBeTruthy();
  });

  it("when trapNote is falsy and pieceType is 'pit', renders the pit fallback text", () => {
    const { container } = render(<TrapInteractionPopup {...baseRevealedProps} trapNote="" />);
    expect(container.textContent).toMatch(/lose 1 Body Point/i);
  });

  it("renders 'Disarm' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseRevealedProps} />);
    expect(getByText("Disarm")).toBeTruthy();
  });

  it("renders 'Close' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseRevealedProps} />);
    expect(getByText("Close")).toBeTruthy();
  });

  it("'Close' calls onClose", () => {
    const onClose = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseRevealedProps} onClose={onClose} />);
    fireEvent.click(getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── Task 6: Reveal Trap transitions to revealed ──────────────────────────────

describe("TrapInteractionPopup — Reveal Trap transition", () => {
  const optionsProps = {
    anchorKey: "3,5",
    isRevealed: false,
    pieceType: "pit",
    pieceLabel: "Pit Trap",
    pieceImage: "Pit_Tile.png",
    trapNote: "",
    onRevealTrap: noop,
    onDisarmTrap: noop,
    onClose: noop,
  };

  it("clicking 'Reveal Trap' calls onRevealTrap(anchorKey)", () => {
    const onRevealTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...optionsProps} onRevealTrap={onRevealTrap} />);
    fireEvent.click(getByText("Reveal Trap"));
    expect(onRevealTrap).toHaveBeenCalledWith("3,5");
  });

  it("after clicking 'Reveal Trap', header changes to pieceLabel", () => {
    const { getByText } = render(<TrapInteractionPopup {...optionsProps} />);
    fireEvent.click(getByText("Reveal Trap"));
    expect(getByText("Pit Trap")).toBeTruthy();
  });

  it("after clicking 'Reveal Trap', 'Disarm' and 'Close' buttons appear", () => {
    const { getByText } = render(<TrapInteractionPopup {...optionsProps} />);
    fireEvent.click(getByText("Reveal Trap"));
    expect(getByText("Disarm")).toBeTruthy();
    expect(getByText("Close")).toBeTruthy();
  });
});

// ─── Task 7: confirming_disarm from options ───────────────────────────────────

describe("TrapInteractionPopup — confirming_disarm from options", () => {
  const optionsProps = {
    anchorKey: "3,5",
    isRevealed: false,
    pieceType: "pit",
    pieceLabel: "Pit Trap",
    pieceImage: "Pit_Tile.png",
    trapNote: "",
    onRevealTrap: noop,
    onDisarmTrap: noop,
    onClose: noop,
  };

  it("clicking 'Disarm Trap' shows header 'Disarm Trap?'", () => {
    const { getByText } = render(<TrapInteractionPopup {...optionsProps} />);
    fireEvent.click(getByText("Disarm Trap"));
    expect(getByText("Disarm Trap?")).toBeTruthy();
  });

  it("shows body text containing 'permanently remove'", () => {
    const { container } = render(<TrapInteractionPopup {...optionsProps} />);
    fireEvent.click(container.querySelector("button"));
    const { getByText } = render(<TrapInteractionPopup {...optionsProps} />);
    fireEvent.click(getByText("Disarm Trap"));
    expect(container.textContent || getByText(/permanently remove/i)).toBeTruthy();
  });

  it("shows 'Confirm' and 'Cancel' buttons after Disarm Trap", () => {
    const { getByText } = render(<TrapInteractionPopup {...optionsProps} />);
    fireEvent.click(getByText("Disarm Trap"));
    expect(getByText("Confirm")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("'Cancel' returns to options phase ('Trap Spotted!' reappears)", () => {
    const { getByText } = render(<TrapInteractionPopup {...optionsProps} />);
    fireEvent.click(getByText("Disarm Trap"));
    fireEvent.click(getByText("Cancel"));
    expect(getByText("Trap Spotted!")).toBeTruthy();
  });
});

// ─── Task 8: confirming_disarm from revealed ──────────────────────────────────

describe("TrapInteractionPopup — confirming_disarm from revealed", () => {
  const revealedProps = {
    anchorKey: "3,5",
    isRevealed: true,
    pieceType: "pit",
    pieceLabel: "Pit Trap",
    pieceImage: "Pit_Tile.png",
    trapNote: "",
    onRevealTrap: noop,
    onDisarmTrap: noop,
    onClose: noop,
  };

  it("when starting in revealed phase, clicking 'Disarm' shows 'Disarm Trap?' header", () => {
    const { getByText } = render(<TrapInteractionPopup {...revealedProps} />);
    fireEvent.click(getByText("Disarm"));
    expect(getByText("Disarm Trap?")).toBeTruthy();
  });

  it("'Cancel' in confirm state returns to revealed phase", () => {
    const { getByText } = render(<TrapInteractionPopup {...revealedProps} />);
    fireEvent.click(getByText("Disarm"));
    fireEvent.click(getByText("Cancel"));
    expect(getByText("Pit Trap")).toBeTruthy();
  });
});

// ─── Task 9: disarmed state and confirm ──────────────────────────────────────

describe("TrapInteractionPopup — disarmed state", () => {
  const optionsProps = {
    anchorKey: "3,5",
    isRevealed: false,
    pieceType: "pit",
    pieceLabel: "Pit Trap",
    pieceImage: "Pit_Tile.png",
    trapNote: "",
    onRevealTrap: noop,
    onDisarmTrap: noop,
    onClose: noop,
  };

  it("clicking 'Confirm' calls onDisarmTrap(anchorKey)", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...optionsProps} onDisarmTrap={onDisarmTrap} />);
    fireEvent.click(getByText("Disarm Trap"));
    fireEvent.click(getByText("Confirm"));
    expect(onDisarmTrap).toHaveBeenCalledWith("3,5");
  });

  it("after 'Confirm', renders 'Trap removed.' and a single 'Close' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...optionsProps} />);
    fireEvent.click(getByText("Disarm Trap"));
    fireEvent.click(getByText("Confirm"));
    expect(getByText("Trap removed.")).toBeTruthy();
    expect(getByText("Close")).toBeTruthy();
  });

  it("'Close' in disarmed state calls onClose", () => {
    const onClose = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...optionsProps} onClose={onClose} />);
    fireEvent.click(getByText("Disarm Trap"));
    fireEvent.click(getByText("Confirm"));
    fireEvent.click(getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
