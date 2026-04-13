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
  it("shows Trap! heading and message when hasTrap=true", () => {
    const { getByText } = render(<ChestResultPopup hasTrap={true} message="Spike!" onClose={() => {}} />)
    expect(getByText(/Trap!/)).toBeTruthy()
    expect(getByText("Spike!")).toBeTruthy()
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
