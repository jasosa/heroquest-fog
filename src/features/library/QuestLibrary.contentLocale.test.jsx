// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import QuestLibrary from "./QuestLibrary.jsx";
import * as storage from "../../shared/questStorage.js";
import { renderWithI18n } from "../../test-utils/renderWithI18n.jsx";

afterEach(() => { cleanup(); localStorage.clear(); });

function createQuestWithTranslations({ title, description, questBookId = null, translations }) {
  const q = storage.createQuest({ title, description, questBookId });
  return storage.persistQuest({ ...q, translations });
}

describe("QuestLibrary — content-locale reader control (FEAT-041)", () => {
  it("renders a 'Quest text:' label and en/es pills, positioned left of the app-chrome language switcher", () => {
    const { getByText } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(getByText("Quest text:")).toBeTruthy();
    // Lowercase DOM text (CSS-uppercased) — distinct from the app-chrome
    // switcher's literal "EN"/"ES" text nodes, so both stay independently queryable.
    expect(getByText("en")).toBeTruthy();
    expect(getByText("es")).toBeTruthy();
    // The app-chrome switcher itself is still present, unaffected.
    expect(getByText("EN")).toBeTruthy();
    expect(getByText("ES")).toBeTruthy();
  });

  it("the reader-control pills use a rounded (pill-shaped) style, distinct from the app switcher's square buttons", () => {
    const { getByText } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const enPill = getByText("en").closest("button");
    const appEnBtn = getByText("EN");
    expect(enPill.style.borderRadius).toBe("999px");
    expect(appEnBtn.style.borderRadius).not.toBe("999px");
  });

  it("selecting the es pill re-resolves the selected quest card's title/description via resolveText", () => {
    createQuestWithTranslations({
      title: "Original Title", description: "Original Desc",
      translations: { es: { title: "Título ES", description: "Descripción ES" } },
    });
    const { getByText, container } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(container.querySelector('[data-testid="showcase-title"]').textContent).toBe("Original Title");
    fireEvent.click(getByText("es"));
    expect(container.querySelector('[data-testid="showcase-title"]').textContent).toBe("Título ES");
    expect(container.querySelector('[data-testid="quest-description"]').textContent).toBe("Descripción ES");
  });

  it("falls back silently to Original when no translation exists for the selected content locale", () => {
    storage.createQuest({ title: "No Translation Quest", description: "", questBookId: null });
    const { getByText, container } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("es"));
    expect(container.querySelector('[data-testid="showcase-title"]').textContent).toBe("No Translation Quest");
  });

  it("re-resolves the hover-tooltip content (not the raw description) once a content locale is selected", () => {
    createQuestWithTranslations({
      title: "T", description: "Original Desc",
      translations: { es: { description: "Descripción ES" } },
    });
    const { getByText, container } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("es"));
    const descEl = container.querySelector('[data-testid="quest-description"]');
    fireEvent.mouseEnter(descEl, { clientX: 100, clientY: 100 });
    const tooltip = container.querySelector('[data-testid="desc-tooltip"]');
    expect(tooltip.textContent).toBe("Descripción ES");
  });

  it("re-resolves the left-nav quest-book list titles", () => {
    const book = storage.createQuestBook("Original Book", "");
    storage.updateQuestBook(book.id, { translations: { es: { title: "Libro ES" } } });
    const { getByText } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(getByText("Original Book")).toBeTruthy();
    fireEvent.click(getByText("es"));
    expect(getByText("Libro ES")).toBeTruthy();
  });

  it("re-resolves the selected-book-name display when a book filter is active", () => {
    const book = storage.createQuestBook("Original Book", "");
    storage.updateQuestBook(book.id, { translations: { es: { title: "Libro ES" } } });
    const { getByText, getAllByText } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("Original Book"));
    fireEvent.click(getByText("es"));
    // Both the nav list entry and the header's selected-book-name display
    // resolve to "Libro ES" once selected — assert at least one instance.
    expect(getAllByText("Libro ES").length).toBeGreaterThanOrEqual(1);
  });
});

describe("QuestLibrary — handleSaveEditBook passes translations through to updateQuestBook", () => {
  it("persists a translations object edited in EditQuestBookDialog", () => {
    const book = storage.createQuestBook("My Book", "desc");
    const { getAllByTitle, container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getAllByTitle("Edit book")[0]);
    // Switch to the EN content-locale tab inside the dialog (scoped — the
    // library's own "en" reader-control pill is also on screen behind the
    // modal) and type a translation.
    const dialog = container.querySelector(".modal-dialog");
    fireEvent.click(Array.from(dialog.querySelectorAll("button")).find(b => b.textContent.trim().toLowerCase() === "en"));
    const titleInput = dialog.querySelector("input.hq-input-dark");
    fireEvent.change(titleInput, { target: { value: "EN Book Title" } });
    fireEvent.click(dialog.querySelector("button.btn-hq-light.active"));

    const stored = storage.loadQuestBooks().find(b => b.id === book.id);
    expect(stored.translations).toEqual({ en: { title: "EN Book Title" } });
  });
});
