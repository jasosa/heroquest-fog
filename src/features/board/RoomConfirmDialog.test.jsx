// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { RoomConfirmDialog } from "./RoomConfirmDialog.jsx";
import { T } from "../../shared/theme.js";

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

afterEach(() => cleanup());

describe("RoomConfirmDialog", () => {
  it("renders the confirmation message", () => {
    const { container } = render(
      <RoomConfirmDialog onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(container.textContent).toMatch(/No revealed door/);
  });

  it("calls onConfirm when Yes button is clicked", () => {
    const onConfirm = vi.fn();
    const { getByText } = render(
      <RoomConfirmDialog onConfirm={onConfirm} onCancel={() => {}} />
    );
    fireEvent.click(getByText(/Yes/));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when No button is clicked", () => {
    const onCancel = vi.fn();
    const { getByText } = render(
      <RoomConfirmDialog onConfirm={() => {}} onCancel={onCancel} />
    );
    fireEvent.click(getByText(/No — Cancel/));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("message element has color T.sidebarText", () => {
    const { container } = render(
      <RoomConfirmDialog onConfirm={() => {}} onCancel={() => {}} />
    );
    const messageDiv = Array.from(container.querySelectorAll("div")).find(el =>
      el.textContent.includes("No revealed door") && el.style.fontSize === "12px"
    );
    expect(messageDiv).toBeTruthy();
    expect(messageDiv.style.color).toBe(hexToRgb(T.sidebarText));
  });
});
