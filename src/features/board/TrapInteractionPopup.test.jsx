// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { TrapInteractionPopup } from "./TrapInteractionPopup.jsx";
import { T } from "../../shared/theme.js";

afterEach(() => cleanup());

const baseProps = {
  anchorKey: "3,5",
  pieceType: "pit",
  pieceLabel: "Pit Trap",
  pieceImage: "Pit_Tile.png",
  trapNote: "Loses 1 BP",
  isRevealed: false,
  onRevealTrap: vi.fn(),
  onDisarmTrap: vi.fn(),
  onClose: vi.fn(),
};

// ─── overlay positioning ──────────────────────────────────────────────────────

describe("TrapInteractionPopup — overlay positioning", () => {
  it("overlay uses position absolute (not fixed) so it covers only the board panel", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    const overlay = container.firstChild;
    expect(overlay.style.position).toBe("absolute");
  });
});

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
    expect(container.textContent).toMatch(/Reveal Trap button/i);
  });

  it("renders disarm rule text mentioning adjacent hero", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    expect(container.textContent).toMatch(/adjacent hero/i);
    expect(container.textContent).toMatch(/Remove button/i);
  });

  it("renders 'Reveal trap' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Reveal trap")).toBeTruthy();
  });

  it("renders 'Remove trap' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Remove trap")).toBeTruthy();
  });

  it("renders 'Close' button", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(getByText("Close")).toBeTruthy();
  });

  it("does not render 'Spring Trap' button", () => {
    const { queryByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(queryByText("Spring Trap")).toBeNull();
  });

  it("does not render standalone 'Disarm' button", () => {
    const { queryByText } = render(<TrapInteractionPopup {...baseProps} />);
    expect(queryByText("Disarm")).toBeNull();
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

// ─── Reveal trap → post_reveal phase ─────────────────────────────────────────

describe("TrapInteractionPopup — Reveal trap → post_reveal phase", () => {
  it("clicking 'Reveal trap' calls onRevealTrap(anchorKey)", () => {
    const onRevealTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onRevealTrap={onRevealTrap} />);
    fireEvent.click(getByText("Reveal trap"));
    expect(onRevealTrap).toHaveBeenCalledWith("3,5");
  });

  it("clicking 'Reveal trap' does NOT call onDisarmTrap or onClose", () => {
    const onDisarmTrap = vi.fn();
    const onClose = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onDisarmTrap={onDisarmTrap} onClose={onClose} />);
    fireEvent.click(getByText("Reveal trap"));
    expect(onDisarmTrap).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("after 'Reveal trap', shows pieceLabel", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal trap"));
    expect(getByText("Pit Trap")).toBeTruthy();
  });

  it("after 'Reveal trap', shows img when pieceImage is set", () => {
    const { container, getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal trap"));
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("after 'Reveal trap', shows trapNote", () => {
    const { container, getByText } = render(<TrapInteractionPopup {...baseProps} trapNote="Loses 1 BP" />);
    fireEvent.click(getByText("Reveal trap"));
    expect(container.textContent).toMatch(/Loses 1 BP/);
  });

  it("after 'Reveal trap', shows 'Remove trap' and 'Close' buttons", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal trap"));
    expect(getByText("Remove trap")).toBeTruthy();
    expect(getByText("Close")).toBeTruthy();
  });

  it("after 'Reveal trap', does not show 'Spring Trap' button", () => {
    const { queryByText, getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal trap"));
    expect(queryByText("Spring Trap")).toBeNull();
  });

  it("backdrop click in post_reveal calls onClose", () => {
    const onClose = vi.fn();
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Reveal trap"));
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });

  it("'Remove trap' from post_reveal goes to remove_confirm without calling onDisarmTrap", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onDisarmTrap={onDisarmTrap} />);
    fireEvent.click(getByText("Reveal trap"));
    fireEvent.click(getByText("Remove trap"));
    expect(onDisarmTrap).not.toHaveBeenCalled();
    expect(getByText("Confirm Remove")).toBeTruthy();
  });

  it("'Cancel' in remove_confirm from post_reveal returns to post_reveal", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Reveal trap"));
    fireEvent.click(getByText("Remove trap"));
    fireEvent.click(getByText("Cancel"));
    expect(getByText("Pit Trap")).toBeTruthy();
    expect(getByText("Remove trap")).toBeTruthy();
  });
});

// ─── isRevealed=true → opens directly in post_reveal ─────────────────────────

describe("TrapInteractionPopup — isRevealed=true", () => {
  const revealedProps = { ...baseProps, isRevealed: true };

  it("when isRevealed=true, opens in post_reveal (no 'Trap Spotted!' heading)", () => {
    const { queryByText } = render(<TrapInteractionPopup {...revealedProps} />);
    expect(queryByText("Trap Spotted!")).toBeNull();
  });

  it("when isRevealed=true, shows pieceLabel directly", () => {
    const { getByText } = render(<TrapInteractionPopup {...revealedProps} />);
    expect(getByText("Pit Trap")).toBeTruthy();
  });

  it("when isRevealed=true, shows 'Remove trap' and 'Close' buttons", () => {
    const { getByText } = render(<TrapInteractionPopup {...revealedProps} />);
    expect(getByText("Remove trap")).toBeTruthy();
    expect(getByText("Close")).toBeTruthy();
  });

  it("when isRevealed=true, shows trapNote", () => {
    const { container } = render(<TrapInteractionPopup {...revealedProps} />);
    expect(container.textContent).toMatch(/Loses 1 BP/);
  });

  it("backdrop click when isRevealed=true calls onClose", () => {
    const onClose = vi.fn();
    const { container } = render(<TrapInteractionPopup {...revealedProps} onClose={onClose} />);
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── Remove trap → remove_confirm phase ──────────────────────────────────────

describe("TrapInteractionPopup — Remove trap → remove_confirm phase", () => {
  it("clicking 'Remove trap' does NOT immediately call onDisarmTrap", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(<TrapInteractionPopup {...baseProps} onDisarmTrap={onDisarmTrap} />);
    fireEvent.click(getByText("Remove trap"));
    expect(onDisarmTrap).not.toHaveBeenCalled();
  });

  it("clicking 'Remove trap' shows a confirmation dialog", () => {
    const { container, getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Remove trap"));
    expect(container.textContent).toMatch(/confirm/i);
  });

  it("remove_confirm shows 'Confirm Remove' and 'Cancel' buttons", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Remove trap"));
    expect(getByText("Confirm Remove")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("'Confirm Remove' calls onDisarmTrap(anchorKey) and shows remove_result", () => {
    const onDisarmTrap = vi.fn();
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} onDisarmTrap={onDisarmTrap} />);
    fireEvent.click(getByText("Remove trap"));
    fireEvent.click(getByText("Confirm Remove"));
    expect(onDisarmTrap).toHaveBeenCalledWith("3,5");
    expect(container.textContent).toMatch(/removed/i);
  });

  it("'Cancel' in remove_confirm from options goes back to options", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Remove trap"));
    fireEvent.click(getByText("Cancel"));
    expect(getByText("Trap Spotted!")).toBeTruthy();
  });

  it("backdrop click in remove_confirm calls onClose", () => {
    const onClose = vi.fn();
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Remove trap"));
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── remove_result phase ──────────────────────────────────────────────────────

describe("TrapInteractionPopup — remove_result phase", () => {
  it("after confirming remove, shows pieceLabel", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Remove trap"));
    fireEvent.click(getByText("Confirm Remove"));
    expect(getByText("Pit Trap")).toBeTruthy();
  });

  it("after confirming remove, shows removed text", () => {
    const { container, getByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Remove trap"));
    fireEvent.click(getByText("Confirm Remove"));
    expect(container.textContent).toMatch(/removed/i);
  });

  it("after confirming remove, shows only 'Close' button", () => {
    const { getByText, queryByText } = render(<TrapInteractionPopup {...baseProps} />);
    fireEvent.click(getByText("Remove trap"));
    fireEvent.click(getByText("Confirm Remove"));
    expect(getByText("Close")).toBeTruthy();
    expect(queryByText("Spring Trap")).toBeNull();
    expect(queryByText("Reveal trap")).toBeNull();
    expect(queryByText("Remove trap")).toBeNull();
  });

  it("backdrop click in remove_result calls onClose", () => {
    const onClose = vi.fn();
    const { getByText, container } = render(<TrapInteractionPopup {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText("Remove trap"));
    fireEvent.click(getByText("Confirm Remove"));
    fireEvent.mouseDown(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── styling ─────────────────────────────────────────────────────────────────

describe("TrapInteractionPopup — styling", () => {
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }

  it("'Trap Spotted!' heading has color T.sidebarTitle", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    const heading = getByText("Trap Spotted!");
    expect(heading.style.color).toBe(hexToRgb(T.sidebarTitle));
  });

  it("body text in options phase has color T.sidebarText", () => {
    const { container } = render(<TrapInteractionPopup {...baseProps} />);
    const bodyDivs = Array.from(container.querySelectorAll("div")).filter(el =>
      el.style.fontSize === "13px" && el.style.lineHeight === "1.5"
    );
    expect(bodyDivs.length).toBeGreaterThan(0);
    bodyDivs.forEach(el => {
      expect(el.style.color).toBe(hexToRgb(T.sidebarText));
    });
  });

  it("'Close' dismiss link has color T.sidebarTextFaint", () => {
    const { getByText } = render(<TrapInteractionPopup {...baseProps} />);
    const closeLink = getByText("Close");
    expect(closeLink.style.color).toBe(hexToRgb(T.sidebarTextFaint));
  });
});
