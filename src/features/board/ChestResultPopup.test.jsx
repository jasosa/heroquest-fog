// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ChestResultPopup } from "./ChestResultPopup.jsx";

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
});
