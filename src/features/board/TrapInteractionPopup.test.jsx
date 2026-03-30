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

  it("renders jump rule text mentioning Combat die and black shield", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    expect(container.textContent).toMatch(/Combat die/i);
    expect(container.textContent).toMatch(/black shield/i);
    expect(container.textContent).toMatch(/Spring Trap button/i);
  });

  it("renders disarm rule text mentioning adjacent hero", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    expect(container.textContent).toMatch(/adjacent hero/i);
    expect(container.textContent).toMatch(/Disarm button/i);
  });

  it("renders 'Spring Trap' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Spring Trap")).toBeTruthy();
  });

  it("renders 'Disarm' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Disarm")).toBeTruthy();
  });

  it("renders 'Reveal' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Reveal")).toBeTruthy();
  });

  it("renders 'Close' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Close")).toBeTruthy();
  });

  it("clicking 'Close' calls onClose", () => {
    const onClose = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("backdrop click calls onClose", () => {
    const onClose = vi.fn();
    const { container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── Spring Trap → spring_result phase ───────────────────────────────────────

describe("TrapInteractionPopup — Spring Trap → spring_result phase", () => {
  it("clicking 'Spring Trap' calls onSpringTrap(anchorKey, removeAfterSpring)", () => {
    const onSpringTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onSpringTrap={onSpringTrap} />);
    fireEvent.click(getByText("Spring Trap"));
    expect(onSpringTrap).toHaveBeenCalledWith("3,5", true);
  });

  it("after clicking 'Spring Trap', shows pieceLabel", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Spring Trap"));
    expect(getByText("Pit Trap")).toBeTruthy();
  });

  it("after clicking 'Spring Trap', shows spring message", () => {
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} springMessage="Loses 1 BP" />);
    fireEvent.click(getByText("Spring Trap"));
    expect(container.textContent).toMatch(/Loses 1 BP/);
  });

  it("after clicking 'Spring Trap', shows only 'Close' button", () => {
    const { getByText, queryByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Spring Trap"));
    expect(getByText("Close")).toBeTruthy();
    expect(queryByText("Spring Trap")).toBeNull();
    expect(queryByText("Reveal")).toBeNull();
    expect(queryByText("Disarm")).toBeNull();
  });

  it("backdrop click in spring_result calls onClose", () => {
    const onClose = vi.fn();
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Spring Trap"));
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── Disarm → disarm_result phase ────────────────────────────────────────────

describe("TrapInteractionPopup — Disarm → disarm_result phase", () => {
  it("clicking 'Disarm' immediately calls onDisarmTrap(anchorKey)", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onDisarmTrap={onDisarmTrap} />);
    fireEvent.click(getByText("Disarm"));
    expect(onDisarmTrap).toHaveBeenCalledWith("3,5");
  });

  it("after clicking 'Disarm', shows pieceLabel", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Disarm"));
    expect(getByText("Pit Trap")).toBeTruthy();
  });

  it("after clicking 'Disarm', shows disarmed confirmation text", () => {
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Disarm"));
    expect(container.textContent).toMatch(/disarmed/i);
  });

  it("after clicking 'Disarm', shows only 'Close' button", () => {
    const { getByText, queryByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Disarm"));
    expect(getByText("Close")).toBeTruthy();
    expect(queryByText("Spring Trap")).toBeNull();
    expect(queryByText("Reveal")).toBeNull();
    expect(queryByText("Disarm")).toBeNull();
  });

  it("backdrop click in disarm_result calls onClose", () => {
    const onClose = vi.fn();
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Disarm"));
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

  it("after 'Reveal', shows pieceLabel", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal"));
    expect(getByText("Pit Trap")).toBeTruthy();
  });

  it("after 'Reveal', shows img when pieceImage is set", () => {
    const { container, getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal"));
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("after 'Reveal', Spring Trap / Disarm / Close buttons are present", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal"));
    expect(getByText("Spring Trap")).toBeTruthy();
    expect(getByText("Disarm")).toBeTruthy();
    expect(getByText("Close")).toBeTruthy();
  });

  it("backdrop click in post_reveal calls onClose", () => {
    const onClose = vi.fn();
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Reveal"));
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });

  it("'Spring Trap' from post_reveal calls onSpringTrap", () => {
    const onSpringTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onSpringTrap={onSpringTrap} />);
    fireEvent.click(getByText("Reveal"));
    fireEvent.click(getByText("Spring Trap"));
    expect(onSpringTrap).toHaveBeenCalledWith("3,5", true);
  });

  it("'Disarm' from post_reveal calls onDisarmTrap immediately", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onDisarmTrap={onDisarmTrap} />);
    fireEvent.click(getByText("Reveal"));
    fireEvent.click(getByText("Disarm"));
    expect(onDisarmTrap).toHaveBeenCalledWith("3,5");
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

  it("shows single 'Close' button, no other actions", () => {
    const { getByText, queryByText } = render(<TrapInteractionPopup {...sprungProps} />);
    expect(getByText("Close")).toBeTruthy();
    expect(queryByText("Spring Trap")).toBeNull();
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
