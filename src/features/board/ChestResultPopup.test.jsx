// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ChestResultPopup } from "./ChestResultPopup.jsx";

afterEach(() => cleanup());

const defaultProps = {
  anchorKey: "5,5",
  onSpringTrap: () => {},
  onDisarmTrap: () => {},
  onResolve: () => {},
  onClose: () => {},
};

describe("ChestResultPopup — options phase (both hasTrap values)", () => {
  it("shows 'Chest — Trap!' heading and rules message when hasTrap=true", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    expect(getByText("Chest — Trap!")).toBeTruthy();
    expect(getByText(/A chest can contain a trap/)).toBeTruthy();
    expect(getByText("Spring Trap")).toBeTruthy();
    expect(getByText("Disarm")).toBeTruthy();
  });

  it("shows 'Chest — Trap!' heading and rules message when hasTrap=false (same message)", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" />
    );
    expect(getByText("Chest — Trap!")).toBeTruthy();
    expect(getByText(/A chest can contain a trap/)).toBeTruthy();
    expect(getByText("Spring Trap")).toBeTruthy();
    expect(getByText("Disarm")).toBeTruthy();
  });

  it("shows springMessage as extra paragraph when provided", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="Poison dart!" />
    );
    expect(getByText("Poison dart!")).toBeTruthy();
  });
});

describe("ChestResultPopup — Spring Trap flow (hasTrap=true)", () => {
  it("clicking Spring Trap calls onSpringTrap(anchorKey, false) and shows 'Trap Sprung!'", () => {
    const onSpringTrap = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="Spike!" onSpringTrap={onSpringTrap} />
    );
    fireEvent.click(getByText("Spring Trap"));
    expect(onSpringTrap).toHaveBeenCalledWith("5,5", false);
    expect(getByText("Trap Sprung!")).toBeTruthy();
  });
});

describe("ChestResultPopup — Spring Trap flow (hasTrap=false)", () => {
  it("clicking Spring Trap does NOT call onSpringTrap and shows 'No Trap'", () => {
    const onSpringTrap = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" onSpringTrap={onSpringTrap} />
    );
    fireEvent.click(getByText("Spring Trap"));
    expect(onSpringTrap).not.toHaveBeenCalled();
    expect(getByText("No Trap")).toBeTruthy();
  });
});

describe("ChestResultPopup — Disarm flow (hasTrap=true)", () => {
  it("clicking Disarm shows confirmation with 'Disarm Trap?' heading", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    fireEvent.click(getByText("Disarm"));
    expect(getByText("Disarm Trap?")).toBeTruthy();
    expect(getByText("Confirm Disarm")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("clicking Confirm Disarm calls onDisarmTrap(anchorKey) and shows 'Trap Disarmed'", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onDisarmTrap={onDisarmTrap} />
    );
    fireEvent.click(getByText("Disarm"));
    fireEvent.click(getByText("Confirm Disarm"));
    expect(onDisarmTrap).toHaveBeenCalledWith("5,5");
    expect(getByText("Trap Disarmed")).toBeTruthy();
  });

  it("clicking Cancel in disarm_confirm returns to options phase", () => {
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" />
    );
    fireEvent.click(getByText("Disarm"));
    fireEvent.click(getByText("Cancel"));
    expect(getByText("Chest — Trap!")).toBeTruthy();
  });
});

describe("ChestResultPopup — Disarm flow (hasTrap=false)", () => {
  it("clicking Disarm does NOT call onDisarmTrap and shows 'No Trap'", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" onDisarmTrap={onDisarmTrap} />
    );
    fireEvent.click(getByText("Disarm"));
    expect(onDisarmTrap).not.toHaveBeenCalled();
    expect(getByText("No Trap")).toBeTruthy();
  });
});

describe("ChestResultPopup — onResolve callback", () => {
  it("Spring Trap (hasTrap=true) calls onResolve(anchorKey)", () => {
    const onResolve = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onResolve={onResolve} />
    );
    fireEvent.click(getByText("Spring Trap"));
    expect(onResolve).toHaveBeenCalledWith("5,5");
  });

  it("Confirm Disarm (hasTrap=true) calls onResolve(anchorKey)", () => {
    const onResolve = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onResolve={onResolve} />
    );
    fireEvent.click(getByText("Disarm"));
    fireEvent.click(getByText("Confirm Disarm"));
    expect(onResolve).toHaveBeenCalledWith("5,5");
  });

  it("Spring Trap (hasTrap=false) calls onResolve(anchorKey)", () => {
    const onResolve = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" onResolve={onResolve} />
    );
    fireEvent.click(getByText("Spring Trap"));
    expect(onResolve).toHaveBeenCalledWith("5,5");
  });

  it("Disarm (hasTrap=false) calls onResolve(anchorKey)", () => {
    const onResolve = vi.fn();
    const { getByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={false} springMessage="" onResolve={onResolve} />
    );
    fireEvent.click(getByText("Disarm"));
    expect(onResolve).toHaveBeenCalledWith("5,5");
  });

  it("Close button does NOT call onResolve", () => {
    const onResolve = vi.fn();
    const { getAllByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onResolve={onResolve} />
    );
    fireEvent.click(getAllByText("Close")[0]);
    expect(onResolve).not.toHaveBeenCalled();
  });
});

describe("ChestResultPopup — close and backdrop", () => {
  it("Close button in options phase calls onClose", () => {
    const onClose = vi.fn();
    const { getAllByText } = render(
      <ChestResultPopup {...defaultProps} hasTrap={true} springMessage="" onClose={onClose} />
    );
    fireEvent.click(getAllByText("Close")[0]);
    expect(onClose).toHaveBeenCalled();
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
