// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { Sidebar } from "./Sidebar.jsx";

const defaultProps = {
  mode: "play",
  tool: "",
  setMode: () => {},
  setTool: () => {},
  onReset: () => {},
  bgImage: "board2",
  setBgImage: () => {},
  onBack: () => {},
  onSave: () => {},
  savedFlash: false,
  saveError: null,
  questTitle: "Test Quest",
  questDescription: "",
  setQuestTitle: () => {},
  setQuestDescription: () => {},
  placementMessage: "",
  setQuestPlacementMessage: () => {},
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Sidebar collapse", () => {
  it("Test 1 — toggle button renders with › when expanded (default, no localStorage)", () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const buttons = container.querySelectorAll("button");
    const toggleBtn = Array.from(buttons).find(b => b.textContent === "›");
    expect(toggleBtn).toBeTruthy();
  });

  it("Test 2 — toggle button shows ‹ when localStorage has hq_sidebar_collapsed = true", () => {
    localStorage.setItem("hq_sidebar_collapsed", "true");
    const { container } = render(<Sidebar {...defaultProps} />);
    const buttons = container.querySelectorAll("button");
    const toggleBtn = Array.from(buttons).find(b => b.textContent === "‹");
    expect(toggleBtn).toBeTruthy();
  });

  it("Test 3 — clicking toggle flips chevron › → ‹", () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const toggleBtn = () => Array.from(container.querySelectorAll("button")).find(b => b.textContent === "›" || b.textContent === "‹");
    expect(toggleBtn().textContent).toBe("›");
    fireEvent.click(toggleBtn());
    expect(toggleBtn().textContent).toBe("‹");
  });

  it("Test 4 — clicking toggle writes to localStorage", () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const toggleBtn = () => Array.from(container.querySelectorAll("button")).find(b => b.textContent === "›" || b.textContent === "‹");
    fireEvent.click(toggleBtn());
    expect(localStorage.getItem("hq_sidebar_collapsed")).toBe("true");
    fireEvent.click(toggleBtn());
    expect(localStorage.getItem("hq_sidebar_collapsed")).toBe("false");
  });

  it("Test 5 — sidebar content is present in DOM when expanded", () => {
    const { getByText } = render(<Sidebar {...defaultProps} />);
    expect(getByText("Quest Master")).toBeTruthy();
  });

  it("Test 6 — outer container width is 270px when expanded, 44px when collapsed", () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    expect(container.firstChild.style.width).toBe("270px");
    const toggleBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent === "›" || b.textContent === "‹");
    fireEvent.click(toggleBtn);
    expect(container.firstChild.style.width).toBe("44px");
  });
});
