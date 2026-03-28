// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { TrapInteractionPopup } from "./TrapInteractionPopup.jsx";

afterEach(() => cleanup());

const noop = () => {};

const baseProps = {
  anchorKey: "3,5",
  pieceType: "pit",
  pieceLabel: "Pit Trap",
  pieceImage: "Pit_Tile.png",
  springMessage: "Loses 1 BP",
  removeAfterSpring: true,
  alreadySprung: false,
  onSpringTrap: vi.fn(),
  onDisarmTrap: vi.fn(),
  onClose: vi.fn(),
};

// ─── options phase ────────────────────────────────────────────────────────────

describe("TrapInteractionPopup — options phase", () => {
  it("renders 'Trap Spotted!' heading", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Trap Spotted!")).toBeTruthy();
  });

  it("renders jump-over rule containing 'black shield' AND 'springs the trap'", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    expect(container.textContent).toMatch(/black shield/i);
    expect(container.textContent).toMatch(/springs the trap/i);
  });

  it("renders 'Spring' button with sub-label about triggering", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    expect(container.textContent).toMatch(/Spring/);
    expect(container.textContent).toMatch(/Trigger the trap/i);
  });

  it("renders 'Reveal' button with sub-label about seeing type", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    expect(container.textContent).toMatch(/Reveal/);
    expect(container.textContent).toMatch(/See trap type/i);
  });

  it("renders 'Disarm' button with sub-label about removing", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    expect(container.textContent).toMatch(/Disarm/);
    expect(container.textContent).toMatch(/Remove trap for this session/i);
  });

  it("renders 'Dismiss' with sub-label about closing", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    expect(container.textContent).toMatch(/Dismiss/);
    expect(container.textContent).toMatch(/Close without doing anything/i);
  });

  it("clicking 'Dismiss' calls onClose", () => {
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

// ─── Spring → spring_result phase ────────────────────────────────────────────

describe("TrapInteractionPopup — Spring → spring_result phase", () => {
  it("clicking 'Spring' calls onSpringTrap(anchorKey, removeAfterSpring)", () => {
    const onSpringTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onSpringTrap={onSpringTrap} />);
    fireEvent.click(getByText("Spring"));
    expect(onSpringTrap).toHaveBeenCalledWith("3,5", true);
  });

  it("after clicking 'Spring', shows resolved spring message", () => {
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} springMessage="Loses 1 BP" />);
    fireEvent.click(getByText("Spring"));
    expect(container.textContent).toMatch(/Loses 1 BP/);
  });

  it("after clicking 'Spring', shows single 'Close' button, no other actions", () => {
    const { getByText, queryByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Spring"));
    expect(getByText("Close")).toBeTruthy();
    expect(queryByText("Spring")).toBeNull();
    expect(queryByText("Reveal")).toBeNull();
    expect(queryByText("Disarm")).toBeNull();
  });

  it("backdrop click in spring_result calls onClose", () => {
    const onClose = vi.fn();
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Spring"));
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── Reveal → post_reveal phase ───────────────────────────────────────────────

describe("TrapInteractionPopup — Reveal → post_reveal phase", () => {
  it("clicking 'Reveal' does NOT call onSpringTrap, onDisarmTrap, or onClose", () => {
    const onSpringTrap = vi.fn();
    const onDisarmTrap = vi.fn();
    const onClose = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onSpringTrap={onSpringTrap} onDisarmTrap={onDisarmTrap} onClose={onClose} />);
    fireEvent.click(getByText("Reveal"));
    expect(onSpringTrap).not.toHaveBeenCalled();
    expect(onDisarmTrap).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("after 'Reveal', shows pieceLabel in info block", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal"));
    expect(getByText("Pit Trap")).toBeTruthy();
  });

  it("after 'Reveal', shows img when pieceImage is set", () => {
    const { container, getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal"));
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("after 'Reveal', Spring / Disarm / Dismiss buttons still present", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal"));
    expect(getByText("Spring")).toBeTruthy();
    expect(getByText("Disarm")).toBeTruthy();
    expect(getByText("Dismiss")).toBeTruthy();
  });

  it("backdrop click in post_reveal calls onClose", () => {
    const onClose = vi.fn();
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Reveal"));
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── Disarm confirm from options ──────────────────────────────────────────────

describe("TrapInteractionPopup — Disarm confirm from options", () => {
  it("clicking 'Disarm' shows 'Disarm Trap?' header", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Disarm"));
    expect(getByText("Disarm Trap?")).toBeTruthy();
  });

  it("shows text containing 'this session'", () => {
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Disarm"));
    expect(container.textContent).toMatch(/this session/i);
  });

  it("'Cancel' returns to options phase (Trap Spotted! heading reappears)", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Disarm"));
    fireEvent.click(getByText("Cancel"));
    expect(getByText("Trap Spotted!")).toBeTruthy();
  });

  it("'Confirm' calls onDisarmTrap(anchorKey)", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onDisarmTrap={onDisarmTrap} />);
    fireEvent.click(getByText("Disarm"));
    fireEvent.click(getByText("Confirm"));
    expect(onDisarmTrap).toHaveBeenCalledWith("3,5");
  });

  it("backdrop click in disarm_confirm does NOT call onClose (returns to previous phase)", () => {
    const onClose = vi.fn();
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Disarm"));
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).not.toHaveBeenCalled();
    // should return to options
    expect(getByText("Trap Spotted!")).toBeTruthy();
  });
});

// ─── Disarm confirm from post_reveal ─────────────────────────────────────────

describe("TrapInteractionPopup — Disarm confirm from post_reveal", () => {
  it("after Reveal then Disarm, Cancel returns to post_reveal phase (pieceLabel heading)", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal"));
    fireEvent.click(getByText("Disarm"));
    fireEvent.click(getByText("Cancel"));
    expect(getByText("Pit Trap")).toBeTruthy();
  });
});

// ─── already_sprung phase ─────────────────────────────────────────────────────

describe("TrapInteractionPopup — already_sprung phase", () => {
  const sprungProps = {
    ...baseProps,
    alreadySprung: true,
    springMessage: "Loses 1 BP",
    pieceLabel: "Pit Trap",
  };

  it("when alreadySprung=true, renders 'Trap — Already Sprung' title", () => {
    const { getByText } = render(<TrapInteractionPopup {...sprungProps} />);
    expect(getByText("Trap — Already Sprung")).toBeTruthy();
  });

  it("shows pieceLabel", () => {
    const { getByText } = render(<TrapInteractionPopup {...sprungProps} />);
    expect(getByText("Pit Trap")).toBeTruthy();
  });

  it("shows spring message", () => {
    const { container } = render(<TrapInteractionPopup {...sprungProps} />);
    expect(container.textContent).toMatch(/Loses 1 BP/);
  });

  it("shows single 'Close' button", () => {
    const { getByText, queryByText } = render(<TrapInteractionPopup {...sprungProps} />);
    expect(getByText("Close")).toBeTruthy();
    expect(queryByText("Spring")).toBeNull();
    expect(queryByText("Reveal")).toBeNull();
    expect(queryByText("Disarm")).toBeNull();
  });

  it("backdrop click calls onClose", () => {
    const onClose = vi.fn();
    const { container } = render(<TrapInteractionPopup {...sprungProps} onClose={onClose} />);
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});
