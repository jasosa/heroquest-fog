// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ChestResultPopup } from "./ChestResultPopup.jsx";
import { T } from "../../shared/theme.js";

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

afterEach(() => cleanup());

describe("ChestResultPopup", () => {
  it("shows 'Chest — Trap!' heading, rules message, Spring Trap and Disarm buttons when hasTrap=true", () => {
    const { getByText } = render(
      <ChestResultPopup hasTrap={true} springMessage="" anchorKey="5,5" onSpringTrap={() => {}} onDisarmTrap={() => {}} onClose={() => {}} />
    );
    expect(getByText("Chest — Trap!")).toBeTruthy();
    expect(getByText(/A chest can contain a trap/)).toBeTruthy();
    expect(getByText("Spring Trap")).toBeTruthy();
    expect(getByText("Disarm")).toBeTruthy();
  });

  it("shows springMessage as extra paragraph in options phase when provided", () => {
    const { getByText } = render(
      <ChestResultPopup hasTrap={true} springMessage="Poison dart!" anchorKey="5,5" onSpringTrap={() => {}} onDisarmTrap={() => {}} onClose={() => {}} />
    );
    expect(getByText("Poison dart!")).toBeTruthy();
  });

  it("clicking Spring Trap calls onSpringTrap(anchorKey, false) and shows 'Trap Sprung!' heading", () => {
    const onSpringTrap = vi.fn();
    const { getByText } = render(
      <ChestResultPopup hasTrap={true} springMessage="Spike!" anchorKey="5,5" onSpringTrap={onSpringTrap} onDisarmTrap={() => {}} onClose={() => {}} />
    );
    fireEvent.click(getByText("Spring Trap"));
    expect(onSpringTrap).toHaveBeenCalledWith("5,5", false);
    expect(getByText("Trap Sprung!")).toBeTruthy();
  });

  it("clicking Disarm shows confirmation screen with 'Disarm Trap?' heading", () => {
    const { getByText } = render(
      <ChestResultPopup hasTrap={true} springMessage="" anchorKey="5,5" onSpringTrap={() => {}} onDisarmTrap={() => {}} onClose={() => {}} />
    );
    fireEvent.click(getByText("Disarm"));
    expect(getByText("Disarm Trap?")).toBeTruthy();
    expect(getByText("Confirm Disarm")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("clicking Confirm Disarm calls onDisarmTrap(anchorKey) and shows 'Trap Disarmed' heading", () => {
    const onDisarmTrap = vi.fn();
    const { getByText } = render(
      <ChestResultPopup hasTrap={true} springMessage="" anchorKey="5,5" onSpringTrap={() => {}} onDisarmTrap={onDisarmTrap} onClose={() => {}} />
    );
    fireEvent.click(getByText("Disarm"));
    fireEvent.click(getByText("Confirm Disarm"));
    expect(onDisarmTrap).toHaveBeenCalledWith("5,5");
    expect(getByText("Trap Disarmed")).toBeTruthy();
  });

  it("clicking Cancel in disarm_confirm returns to options phase", () => {
    const { getByText } = render(
      <ChestResultPopup hasTrap={true} springMessage="" anchorKey="5,5" onSpringTrap={() => {}} onDisarmTrap={() => {}} onClose={() => {}} />
    );
    fireEvent.click(getByText("Disarm"));
    fireEvent.click(getByText("Cancel"));
    expect(getByText("Chest — Trap!")).toBeTruthy();
  });

  it("Close button in options phase calls onClose when hasTrap=true", () => {
    const onClose = vi.fn();
    const { getAllByText } = render(
      <ChestResultPopup hasTrap={true} springMessage="" anchorKey="5,5" onSpringTrap={() => {}} onDisarmTrap={() => {}} onClose={onClose} />
    );
    fireEvent.click(getAllByText("Close")[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("backdrop click in options phase calls onClose when hasTrap=true", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ChestResultPopup hasTrap={true} springMessage="" anchorKey="5,5" onSpringTrap={() => {}} onDisarmTrap={() => {}} onClose={onClose} />
    );
    fireEvent.mouseDown(container.querySelector('[data-testid="chest-popup-backdrop"]'));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows All Clear heading when hasTrap=false", () => {
    const { getByText } = render(<ChestResultPopup hasTrap={false} message="The chest is safe." onClose={() => {}} />)
    expect(getByText(/All Clear/)).toBeTruthy()
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn()
    const { container } = render(<ChestResultPopup hasTrap={false} message="safe" onClose={onClose} />)
    fireEvent.mouseDown(container.querySelector('[data-testid="chest-popup-backdrop"]'))
    expect(onClose).toHaveBeenCalled()
  });

  it("calls onClose when Close button is clicked", () => {
    const onClose = vi.fn()
    const { getByText } = render(<ChestResultPopup hasTrap={false} message="safe" onClose={onClose} />)
    fireEvent.click(getByText("Close"))
    expect(onClose).toHaveBeenCalled()
  });

  it("message body div has color T.sidebarText", () => {
    const { getByText } = render(<ChestResultPopup hasTrap={false} message="The chest is safe." onClose={() => {}} />)
    const body = getByText("The chest is safe.")
    expect(body.style.color).toBe(hexToRgb(T.sidebarText))
  });
});
