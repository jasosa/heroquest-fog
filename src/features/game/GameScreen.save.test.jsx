// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { GameScreen } from "./GameScreen.jsx";
import { renderWithI18n } from "../../test-utils/renderWithI18n.jsx";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function makeQuest(overrides = {}) {
  return {
    id: "q-save-feat041",
    title: "Original Title",
    description: "Original Desc",
    placementMessage: "Original Placement",
    placed: {
      "0,0": { type: "start", blocks: false, rotation: 0, coveredCells: ["0,0"] },
    },
    doors: {},
    ...overrides,
  };
}

function getTitleInput(container) {
  return container.querySelector('input.hq-input-dark');
}

// ── Mode-specific contentLocale seeding ─────────────────────────────────────
describe("GameScreen — contentLocale seeding is mode-specific (FEAT-041)", () => {
  it("edit mode always starts contentLocale at 'original', regardless of the app's current UI language", () => {
    const { getByText } = renderWithI18n(
      <GameScreen quest={makeQuest()} initialMode="edit" onBack={() => {}} onQuestSaved={() => {}} />,
      { locale: "es" }
    );
    // Spanish UI copy for "Editing: Original text" is "Editando: texto original".
    expect(getByText("Editando: texto original")).toBeTruthy();
  });

  it("edit mode starts contentLocale at 'original' even when the UI language is English", () => {
    const { getByText } = renderWithI18n(
      <GameScreen quest={makeQuest()} initialMode="edit" onBack={() => {}} onQuestSaved={() => {}} />,
      { locale: "en" }
    );
    expect(getByText("Editing: Original text")).toBeTruthy();
  });

  it("play mode seeds contentLocale from the app's current UI language ('es')", () => {
    const { getByText } = renderWithI18n(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />,
      { locale: "es" }
    );
    // Spanish UI copy for "Showing: Spanish translation" is "Mostrando: traducción en Español".
    expect(getByText("Mostrando: traducción en Español")).toBeTruthy();
  });

  it("play mode seeds contentLocale from the app's current UI language ('en')", () => {
    const { getByText } = renderWithI18n(
      <GameScreen quest={makeQuest()} initialMode="play" onBack={() => {}} onQuestSaved={() => {}} />,
      { locale: "en" }
    );
    expect(getByText("Showing: English translation")).toBeTruthy();
  });
});

// ── Save correctness — must never persist derived/pill-resolved text ───────
describe("GameScreen — Save persists the ORIGINAL title, never the active translation tab's text", () => {
  it("saves the Original title unchanged while the EN tab is active with different typed text", () => {
    let saved = null;
    const { container, getByText } = render(
      <GameScreen quest={makeQuest()} initialMode="edit" onBack={() => {}} onQuestSaved={q => { saved = q; }} />
    );
    // Switch to the EN content-locale tab and type something different.
    fireEvent.click(getByText("en"));
    fireEvent.change(getTitleInput(container), { target: { value: "EN Title Typed" } });
    fireEvent.click(getByText("💾 Save Quest"));

    expect(saved).not.toBeNull();
    expect(saved.title).toBe("Original Title");
  });

  it("saves the Original description/placementMessage unchanged while an ES tab is active with different typed text", () => {
    let saved = null;
    const { container, getByText } = render(
      <GameScreen quest={makeQuest()} initialMode="edit" onBack={() => {}} onQuestSaved={q => { saved = q; }} />
    );
    fireEvent.click(getByText("es"));
    const descTextarea = container.querySelector("#sidebar-quest-description");
    fireEvent.change(descTextarea, { target: { value: "ES Desc Typed" } });
    const placementTextarea = container.querySelector("#sidebar-placement-message");
    fireEvent.change(placementTextarea, { target: { value: "ES Placement Typed" } });
    fireEvent.click(getByText("💾 Save Quest"));

    expect(saved.description).toBe("Original Desc");
    expect(saved.placementMessage).toBe("Original Placement");
  });
});

// ── Full translations object survives to the save payload ──────────────────
describe("GameScreen — the full translations object (both locales, multiple fields) survives to save", () => {
  it("persists translations for both en and es, across multiple fields, not just the last-active tab", () => {
    let saved = null;
    const { container, getByText } = render(
      <GameScreen quest={makeQuest()} initialMode="edit" onBack={() => {}} onQuestSaved={q => { saved = q; }} />
    );

    fireEvent.click(getByText("en"));
    fireEvent.change(getTitleInput(container), { target: { value: "EN Title" } });
    fireEvent.change(container.querySelector("#sidebar-quest-description"), { target: { value: "EN Desc" } });

    fireEvent.click(getByText("es"));
    fireEvent.change(getTitleInput(container), { target: { value: "ES Title" } });

    // Switch back to en (the "last-active tab" before save) — the test title
    // deliberately proves es data isn't lost even though en is active at save time.
    fireEvent.click(getByText("en"));

    fireEvent.click(getByText("💾 Save Quest"));

    expect(saved.translations).toEqual({
      en: { title: "EN Title", description: "EN Desc" },
      es: { title: "ES Title" },
    });
    expect(saved.title).toBe("Original Title");
  });
});
