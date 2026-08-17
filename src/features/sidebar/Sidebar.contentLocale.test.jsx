// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { fireEvent, cleanup } from "@testing-library/react";
import { Sidebar } from "./Sidebar.jsx";
import { renderWithI18n } from "../../test-utils/renderWithI18n.jsx";

const defaultProps = {
  mode: "edit",
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
  contentLocale: "original",
  setContentLocale: () => {},
  questTranslations: {},
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Sidebar — ContentLocaleTabs placement (FEAT-041)", () => {
  it("renders ContentLocaleTabs directly under the Quest Info section header in edit mode", () => {
    const { getByText } = renderWithI18n(<Sidebar {...defaultProps} mode="edit" />);
    expect(getByText("Quest Info")).toBeTruthy();
    expect(getByText("Original")).toBeTruthy();
  });

  it("renders ContentLocaleTabs in play mode too", () => {
    const { getByText } = renderWithI18n(<Sidebar {...defaultProps} mode="play" />);
    expect(getByText("Quest Info")).toBeTruthy();
    expect(getByText("Original")).toBeTruthy();
  });

  it("the quest-content ContentLocaleTabs is physically separate from the app-chrome EN/ES language switcher — both render as distinct elements", () => {
    // App-chrome switcher renders literal "EN" (uppercase DOM text);
    // ContentLocaleTabs renders lowercase "en" (visually uppercased via CSS)
    // specifically so the two controls remain independently queryable.
    const { getByText } = renderWithI18n(<Sidebar {...defaultProps} mode="edit" />);
    const appSwitcherEn = getByText("EN");
    const contentLocaleEn = getByText("en");
    expect(appSwitcherEn).toBeTruthy();
    expect(contentLocaleEn).toBeTruthy();
    expect(appSwitcherEn).not.toBe(contentLocaleEn);
  });

  it("clicking the EN content-locale pill calls setContentLocale('en'), not the app locale setter", () => {
    let called = null;
    const { getByText } = renderWithI18n(
      <Sidebar {...defaultProps} mode="edit" setContentLocale={(v) => { called = v; }} />
    );
    fireEvent.click(getByText("en"));
    expect(called).toBe("en");
  });
});

describe("Sidebar — title/description/placementMessage placeholders react to contentLocale (edit mode)", () => {
  it("title placeholder is the normal quest-title placeholder when contentLocale is 'original'", () => {
    const { container } = renderWithI18n(<Sidebar {...defaultProps} mode="edit" contentLocale="original" questTitle="" />);
    const input = container.querySelector('input.hq-input-dark');
    expect(input.placeholder).toBe("Quest title");
  });

  it("title placeholder switches to the no-translation-yet placeholder when contentLocale is 'en'", () => {
    const { container } = renderWithI18n(<Sidebar {...defaultProps} mode="edit" contentLocale="en" questTitle="" />);
    const input = container.querySelector('input.hq-input-dark');
    expect(input.placeholder).toContain("English");
  });

  it("title placeholder switches to the no-translation-yet placeholder when contentLocale is 'es'", () => {
    const { container } = renderWithI18n(<Sidebar {...defaultProps} mode="edit" contentLocale="es" questTitle="" />);
    const input = container.querySelector('input.hq-input-dark');
    expect(input.placeholder).toContain("Spanish");
  });

  it("does not change the title input's value/onChange wiring — value still reflects the questTitle prop as-is", () => {
    const { container } = renderWithI18n(<Sidebar {...defaultProps} mode="edit" contentLocale="en" questTitle="EN Title" />);
    const input = container.querySelector('input.hq-input-dark');
    expect(input.value).toBe("EN Title");
  });

  it("description placeholder switches when contentLocale is 'es'", () => {
    const { container } = renderWithI18n(<Sidebar {...defaultProps} mode="edit" contentLocale="es" />);
    const textarea = container.querySelector('#sidebar-quest-description');
    expect(textarea.placeholder).toContain("Spanish");
  });

  it("placement message placeholder switches when contentLocale is 'en'", () => {
    const { container } = renderWithI18n(<Sidebar {...defaultProps} mode="edit" contentLocale="en" />);
    const textarea = container.querySelector('#sidebar-placement-message');
    expect(textarea.placeholder).toContain("English");
  });
});

describe("Sidebar — has-content dots reflect questTranslations", () => {
  it("shows a dot on the EN content-locale pill when questTranslations.en has a non-empty field", () => {
    const { container } = renderWithI18n(
      <Sidebar {...defaultProps} mode="edit" questTranslations={{ en: { title: "EN Title" } }} />
    );
    expect(container.querySelectorAll("[data-testid='content-locale-dot']").length).toBe(1);
  });

  it("shows no dots when questTranslations is empty", () => {
    const { container } = renderWithI18n(<Sidebar {...defaultProps} mode="edit" questTranslations={{}} />);
    expect(container.querySelectorAll("[data-testid='content-locale-dot']").length).toBe(0);
  });
});
