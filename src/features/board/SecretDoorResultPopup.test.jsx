// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { SecretDoorResultPopup } from "./SecretDoorResultPopup.jsx";
import { T } from "../../shared/theme.js";

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

afterEach(() => cleanup());

describe("SecretDoorResultPopup", () => {
  it("renders 'Secret Door Found!' heading for reveal action", () => {
    const { container } = render(
      <SecretDoorResultPopup action="reveal" text="" onClose={() => {}} />
    );
    expect(container.textContent).toMatch(/Secret Door Found/);
  });

  it("renders 'Search Result' heading for non-reveal action", () => {
    const { container } = render(
      <SecretDoorResultPopup action="search" text="Nothing here." onClose={() => {}} />
    );
    expect(container.textContent).toMatch(/Search Result/);
  });

  it("heading has color T.sidebarTitle", () => {
    const { container } = render(
      <SecretDoorResultPopup action="reveal" text="" onClose={() => {}} />
    );
    const heading = Array.from(container.querySelectorAll("div")).find(el =>
      el.textContent.includes("Secret Door Found") && el.style.fontWeight === "bold"
    );
    expect(heading).toBeTruthy();
    expect(heading.style.color).toBe(hexToRgb(T.sidebarTitle));
  });

  it("body text has color T.sidebarText", () => {
    const { container } = render(
      <SecretDoorResultPopup action="reveal" text="" onClose={() => {}} />
    );
    const body = Array.from(container.querySelectorAll("div")).find(el =>
      el.textContent.includes("You discovered a secret door") && el.style.fontSize === "15px"
    );
    expect(body).toBeTruthy();
    expect(body.style.color).toBe(hexToRgb(T.sidebarText));
  });

  it("calls onClose when Close button clicked", () => {
    const onClose = vi.fn();
    const { getByText } = render(
      <SecretDoorResultPopup action="reveal" text="" onClose={onClose} />
    );
    fireEvent.click(getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
