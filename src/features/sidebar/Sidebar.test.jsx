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
    expect(getByText("Mode")).toBeTruthy();
  });

  it("Test 6 — outer container width is 300px when expanded, 44px when collapsed", () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    expect(container.firstChild.style.width).toBe("300px");
    const toggleBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent === "›" || b.textContent === "‹");
    fireEvent.click(toggleBtn);
    expect(container.firstChild.style.width).toBe("44px");
  });
});

describe("Sidebar edit mode — description label", () => {
  it("shows a label for the quest description textarea in edit mode", () => {
    const { container } = render(<Sidebar {...defaultProps} mode="edit" />);
    const label = container.querySelector('label[for="sidebar-quest-description"]');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain("Description");
  });

  it("description textarea has matching id in edit mode", () => {
    const { container } = render(<Sidebar {...defaultProps} mode="edit" />);
    expect(container.querySelector('#sidebar-quest-description')).toBeTruthy();
  });
});

describe("Sidebar edit mode — placement message label", () => {
  it("shows a label for the placement message textarea in edit mode", () => {
    const { container } = render(<Sidebar {...defaultProps} mode="edit" />);
    const label = container.querySelector('label[for="sidebar-placement-message"]');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain("Placement message");
  });

  it("placement message textarea has matching id in edit mode", () => {
    const { container } = render(<Sidebar {...defaultProps} mode="edit" />);
    expect(container.querySelector('#sidebar-placement-message')).toBeTruthy();
  });
});

describe("Sidebar play mode — description font size", () => {
  it("description in play mode has fontSize of at least 12px", () => {
    const { container } = render(
      <Sidebar {...defaultProps} mode="play" questDescription="A great quest" />
    );
    const desc = container.querySelector('[data-testid="play-quest-description"]');
    expect(desc).toBeTruthy();
    const size = parseInt(desc.style.fontSize, 10);
    expect(size).toBeGreaterThanOrEqual(12);
  });
});

describe("Sidebar — section headers", () => {
  it("renders Quest Info, Mode, and Board Style section headers, but no Quest Master text", () => {
    const { getByText, queryByText } = render(<Sidebar {...defaultProps} mode="edit" />);
    expect(getByText("Quest Info")).toBeTruthy();
    expect(getByText("Mode")).toBeTruthy();
    expect(getByText("Board Style")).toBeTruthy();
    expect(queryByText("Quest Master")).toBeNull();
  });
});

describe("Sidebar — back to library button", () => {
  it("has a slightly larger font and a moderate minHeight, lower tier than the mode toggle", () => {
    const { getByText } = render(<Sidebar {...defaultProps} />);
    const backBtn = getByText("← Library");
    expect(parseInt(backBtn.style.fontSize, 10)).toBeGreaterThanOrEqual(10);
    const minHeight = parseInt(backBtn.style.minHeight, 10);
    expect(minHeight).toBeGreaterThanOrEqual(32);
    expect(minHeight).toBeLessThanOrEqual(36);
  });
});

describe("Sidebar — ModeToggle styling", () => {
  it("active Play button has larger font, letter spacing, and gold glow; inactive Edit button has no glow", () => {
    const { getByText } = render(<Sidebar {...defaultProps} mode="play" />);
    const playBtn = getByText("⚔ Play");
    const editBtn = getByText("✎ Edit");

    expect(playBtn.style.fontSize).toBe("12px");
    expect(playBtn.style.letterSpacing).toBe("3px");
    expect(playBtn.style.textShadow).toContain("f0c04088");
    expect(editBtn.style.textShadow).toBeFalsy();
  });

  it("both mode buttons have an explicit minHeight of at least 44px", () => {
    const { getByText } = render(<Sidebar {...defaultProps} mode="play" />);
    const playBtn = getByText("⚔ Play");
    const editBtn = getByText("✎ Edit");
    expect(parseInt(playBtn.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    expect(parseInt(editBtn.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
  });
});

describe("Sidebar — dev footer removed", () => {
  it("does not render the v0.2 dev footer text", () => {
    const { queryByText } = render(<Sidebar {...defaultProps} />);
    expect(queryByText(/v0\.2/i)).toBeNull();
    expect(queryByText(/Real HeroQuest board/i)).toBeNull();
  });
});

describe("PlayPanel — legend removed", () => {
  it("play mode renders no Legend heading", () => {
    const { queryByText } = render(<Sidebar {...defaultProps} mode="play" />);
    expect(queryByText("Legend")).toBeNull();
  });

  it("play mode renders no Show/Hide legend toggle button", () => {
    const { queryByTitle } = render(<Sidebar {...defaultProps} mode="play" />);
    expect(queryByTitle(/legend/i)).toBeNull();
  });
});
