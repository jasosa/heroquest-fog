// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ChestResultPopup } from "./ChestResultPopup.jsx";

afterEach(() => cleanup());

const defaultProps = {
  anchorKey: "5,5",
  onDisarmTrap: () => {},
  onResolve: () => {},
  onClose: () => {},
};

// ─── options phase ────────────────────────────────────────────────────────────

describe("ChestResultPopup — options phase", () => {
  it("shows 'Chest — Trap!' heading and rules message when hasTrap=true", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    expect(getByText("Chest — Trap!")).toBeTruthy();
    expect(getByText(/A chest can contain a trap/)).toBeTruthy();
  });

  it("shows 'Chest — Trap!' heading and rules message when hasTrap=false", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" />
    );
    expect(getByText("Chest — Trap!")).toBeTruthy();
    expect(getByText(/A chest can contain a trap/)).toBeTruthy();
  });

  it("renders 'Reveal' button", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    expect(getByText("Reveal")).toBeTruthy();
  });

  it("renders 'Remove' button", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    expect(getByText("Remove")).toBeTruthy();
  });

  it("renders 'Cancel' button", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("does not render 'Spring Trap' button", () => {
    const { queryByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    expect(queryByText("Spring Trap")).toBeNull();
  });

  it("does not render standalone 'Disarm' button", () => {
    const { queryByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    expect(queryByText("Disarm")).toBeNull();
  });

  it("'Cancel' calls onClose without calling onResolve", () => {
    const onClose = vi.fn();
    const onResolve = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onClose={onClose} onResolve={onResolve} />
    );
    fireEvent.click(getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
    expect(onResolve).not.toHaveBeenCalled();
  });

  it("backdrop click calls onClose", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" onClose={onClose} />
    );
    fireEvent.mouseDown(container.querySelector('[data-testid="chest-popup-backdrop"]'));
    expect(onClose).toHaveBeenCalled();
  });
});

// ─── Reveal flow (hasTrap=true) ───────────────────────────────────────────────

describe("ChestResultPopup — Reveal flow (hasTrap=true)", () => {
  it("clicking 'Reveal' calls onResolve(anchorKey)", () => {
    const onResolve = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onResolve={onResolve} />
    );
    fireEvent.click(getByText("Reveal"));
    expect(onResolve).toHaveBeenCalledWith("5,5");
  });

  it("clicking 'Reveal' does NOT call onDisarmTrap", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onDisarmTrap={onDisarmTrap} />
    );
    fireEvent.click(getByText("Reveal"));
    expect(onDisarmTrap).not.toHaveBeenCalled();
  });

  it("after 'Reveal' (hasTrap=true), shows 'Trap Sprung!' heading", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    fireEvent.click(getByText("Reveal"));
    expect(getByText("Trap Sprung!")).toBeTruthy();
  });

  it("after 'Reveal' (hasTrap=true), shows springMessage", () => {
    const { container, getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="Spike!" />
    );
    fireEvent.click(getByText("Reveal"));
    expect(container.textContent).toMatch(/Spike!/);
  });

  it("after 'Reveal' (hasTrap=true), shows only 'Close' button", () => {
    const { getByText, queryByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    fireEvent.click(getByText("Reveal"));
    expect(getByText("Close")).toBeTruthy();
    expect(queryByText("Spring Trap")).toBeNull();
    expect(queryByText("Reveal")).toBeNull();
    expect(queryByText("Remove")).toBeNull();
  });
});

// ─── Reveal flow (hasTrap=false) ─────────────────────────────────────────────

describe("ChestResultPopup — Reveal flow (hasTrap=false)", () => {
  it("clicking 'Reveal' (hasTrap=false) does NOT call onDisarmTrap", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" onDisarmTrap={onDisarmTrap} />
    );
    fireEvent.click(getByText("Reveal"));
    expect(onDisarmTrap).not.toHaveBeenCalled();
  });

  it("clicking 'Reveal' (hasTrap=false) calls onResolve(anchorKey)", () => {
    const onResolve = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" onResolve={onResolve} />
    );
    fireEvent.click(getByText("Reveal"));
    expect(onResolve).toHaveBeenCalledWith("5,5");
  });

  it("clicking 'Reveal' (hasTrap=false) shows 'No Trap'", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" />
    );
    fireEvent.click(getByText("Reveal"));
    expect(getByText("No Trap")).toBeTruthy();
  });
});

// ─── Remove flow (hasTrap=true) ───────────────────────────────────────────────

describe("ChestResultPopup — Remove flow (hasTrap=true)", () => {
  it("clicking 'Remove' does NOT immediately call onDisarmTrap", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onDisarmTrap={onDisarmTrap} />
    );
    fireEvent.click(getByText("Remove"));
    expect(onDisarmTrap).not.toHaveBeenCalled();
  });

  it("clicking 'Remove' (hasTrap=true) shows remove_confirm with 'Remove Trap?' heading", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    fireEvent.click(getByText("Remove"));
    expect(getByText("Remove Trap?")).toBeTruthy();
    expect(getByText("Confirm Remove")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("'Confirm Remove' calls onDisarmTrap(anchorKey) and onResolve(anchorKey)", () => {
    const onDisarmTrap = vi.fn();
    const onResolve = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onDisarmTrap={onDisarmTrap} onResolve={onResolve} />
    );
    fireEvent.click(getByText("Remove"));
    fireEvent.click(getByText("Confirm Remove"));
    expect(onDisarmTrap).toHaveBeenCalledWith("5,5");
    expect(onResolve).toHaveBeenCalledWith("5,5");
  });

  it("'Confirm Remove' shows 'Trap Removed'", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    fireEvent.click(getByText("Remove"));
    fireEvent.click(getByText("Confirm Remove"));
    expect(getByText("Trap Removed")).toBeTruthy();
  });

  it("'Cancel' in remove_confirm returns to options", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    fireEvent.click(getByText("Remove"));
    fireEvent.click(getByText("Cancel"));
    expect(getByText("Chest — Trap!")).toBeTruthy();
  });
});

// ─── Remove flow (hasTrap=false) ─────────────────────────────────────────────

describe("ChestResultPopup — Remove flow (hasTrap=false)", () => {
  it("clicking 'Remove' (hasTrap=false) does NOT call onDisarmTrap", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" onDisarmTrap={onDisarmTrap} />
    );
    fireEvent.click(getByText("Remove"));
    expect(onDisarmTrap).not.toHaveBeenCalled();
  });

  it("clicking 'Remove' (hasTrap=false) calls onResolve(anchorKey)", () => {
    const onResolve = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" onResolve={onResolve} />
    );
    fireEvent.click(getByText("Remove"));
    expect(onResolve).toHaveBeenCalledWith("5,5");
  });

  it("clicking 'Remove' (hasTrap=false) shows 'No Trap'", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" />
    );
    fireEvent.click(getByText("Remove"));
    expect(getByText("No Trap")).toBeTruthy();
  });
});

// ─── remove_result phase ──────────────────────────────────────────────────────

describe("ChestResultPopup — remove_result phase", () => {
  it("after Confirm Remove, shows only 'Close' button", () => {
    const { getByText, queryByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    fireEvent.click(getByText("Remove"));
    fireEvent.click(getByText("Confirm Remove"));
    expect(getByText("Close")).toBeTruthy();
    expect(queryByText("Spring Trap")).toBeNull();
    expect(queryByText("Reveal")).toBeNull();
    expect(queryByText("Remove")).toBeNull();
  });

  it("backdrop click in remove_result calls onClose", () => {
    const onClose = vi.fn();
    const { getByText, container } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onClose={onClose} />
    );
    fireEvent.click(getByText("Remove"));
    fireEvent.click(getByText("Confirm Remove"));
    fireEvent.mouseDown(container.querySelector('[data-testid="chest-popup-backdrop"]'));
    expect(onClose).toHaveBeenCalled();
  });
});
