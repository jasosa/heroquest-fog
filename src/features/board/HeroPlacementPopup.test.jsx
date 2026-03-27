// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { HeroPlacementPopup } from "./HeroPlacementPopup.jsx";

afterEach(() => cleanup());

const DEFAULT_MESSAGE = "Place your heroes in the stairway";

describe("HeroPlacementPopup", () => {
  it("renders the message prop text", () => {
    const { getByText } = render(
      <HeroPlacementPopup message="Head to the dungeon entrance" onClose={() => {}} />
    );
    expect(getByText("Head to the dungeon entrance")).toBeTruthy();
  });

  it("falls back to the default message when message is empty string", () => {
    const { getByText } = render(
      <HeroPlacementPopup message="" onClose={() => {}} />
    );
    expect(getByText(DEFAULT_MESSAGE)).toBeTruthy();
  });

  it("renders an OK button", () => {
    const { getByRole } = render(
      <HeroPlacementPopup message="Test" onClose={() => {}} />
    );
    expect(getByRole("button", { name: /ok/i })).toBeTruthy();
  });

  it("calls onClose when OK is clicked", () => {
    const onClose = vi.fn();
    const { getByRole } = render(
      <HeroPlacementPopup message="Test" onClose={onClose} />
    );
    fireEvent.click(getByRole("button", { name: /ok/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
