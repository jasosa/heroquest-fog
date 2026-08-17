// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import QuestLibrary from "./QuestLibrary.jsx";
import { T, FONT_HEADING } from "../../shared/theme.js";
import * as storage from "../../shared/questStorage.js";
import { renderWithI18n } from "../../test-utils/renderWithI18n.jsx";

afterEach(() => { cleanup(); localStorage.clear(); });

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// ── Step 1: Updated existing tests ───────────────────────────────────────────

describe("QuestLibrary showcase-detail background", () => {
  it("showcase-detail has explicit background #1a1408", () => {
    storage.createQuest({ title: "Test Quest", description: "", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const detail = container.querySelector('[data-testid="showcase-detail"]');
    expect(detail).toBeTruthy();
    expect(detail.style.background).toBe(hexToRgb("#1a1408"));
  });
});

describe("QuestLibrary header text colours", () => {
  it("page title uses T.sidebarTitle — found via data-testid='library-heading'", () => {
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const heading = container.querySelector('[data-testid="library-heading"]');
    expect(heading).toBeTruthy();
    expect(heading.style.color).toBe(hexToRgb(T.sidebarTitle));
  });
});

// ── Step 2: Showcase renders selected quest title ─────────────────────────────

describe("QuestLibrary showcase title", () => {
  it("shows selected quest title in showcase-title", () => {
    storage.createQuest({ title: "My Epic Quest", description: "", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const title = container.querySelector('[data-testid="showcase-title"]');
    expect(title).toBeTruthy();
    expect(title.textContent).toBe("My Epic Quest");
  });
});

// ── Step 3: Empty state when no quests ────────────────────────────────────────

describe("QuestLibrary empty state", () => {
  it("shows showcase-empty when no quests, hides showcase-panel", () => {
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(container.querySelector('[data-testid="showcase-empty"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="showcase-panel"]')).toBeNull();
  });
});

// ── Step 4: Clicking thumbnail changes displayed quest ────────────────────────

describe("QuestLibrary thumbnail navigation", () => {
  it("clicking a thumb button changes the showcase title", () => {
    storage.createQuest({ title: "Alpha", description: "", questBookId: null });
    const q2 = storage.createQuest({ title: "Beta", description: "", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(container.querySelector('[data-testid="showcase-title"]').textContent).toBe("Alpha");
    fireEvent.click(container.querySelector(`[data-testid="thumb-${q2.id}"]`));
    expect(container.querySelector('[data-testid="showcase-title"]').textContent).toBe("Beta");
  });
});

// ── Step 5: Prev/next arrows cycle quests ─────────────────────────────────────

describe("QuestLibrary nav-prev / nav-next", () => {
  it("nav-next advances to second quest, nav-prev returns to first", () => {
    storage.createQuest({ title: "First", description: "", questBookId: null });
    storage.createQuest({ title: "Second", description: "", questBookId: null });
    storage.createQuest({ title: "Third", description: "", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const getTitle = () => container.querySelector('[data-testid="showcase-title"]').textContent;
    expect(getTitle()).toBe("First");
    fireEvent.click(container.querySelector('[data-testid="nav-next"]'));
    expect(getTitle()).toBe("Second");
    fireEvent.click(container.querySelector('[data-testid="nav-prev"]'));
    expect(getTitle()).toBe("First");
  });
});

// ── Step 6: Keyboard arrow navigation ────────────────────────────────────────

describe("QuestLibrary keyboard navigation", () => {
  it("ArrowRight key advances to second quest", () => {
    storage.createQuest({ title: "KeyA", description: "", questBookId: null });
    storage.createQuest({ title: "KeyB", description: "", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(container.querySelector('[data-testid="showcase-title"]').textContent).toBe("KeyA");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(container.querySelector('[data-testid="showcase-title"]').textContent).toBe("KeyB");
  });
});

// ── Step 7: "New" badge for recent quests ─────────────────────────────────────

describe("QuestLibrary new-badge", () => {
  it("shows new-badge for fresh quest and hides it for old quest", () => {
    storage.createQuest({ title: "Fresh Quest", description: "", questBookId: null });
    const old = storage.createQuest({ title: "Old Quest", description: "", questBookId: null });
    // Manually patch createdAt for old quest to be 8 days ago
    const stored = JSON.parse(localStorage.getItem("hq_quests") || "[]");
    const patched = stored.map(q =>
      q.id === old.id ? { ...q, createdAt: Date.now() - 8 * 24 * 3600 * 1000 } : q
    );
    localStorage.setItem("hq_quests", JSON.stringify(patched));

    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    // First quest (fresh) is selected by default
    expect(container.querySelector('[data-testid="new-badge"]')).toBeTruthy();
    // Click the old quest thumb
    fireEvent.click(container.querySelector(`[data-testid="thumb-${old.id}"]`));
    expect(container.querySelector('[data-testid="new-badge"]')).toBeNull();
  });
});

// ── Step 8: Selection resets when book filter changes ─────────────────────────

describe("QuestLibrary book filter resets selection", () => {
  it("selecting a different book resets showcase to first quest of that book", () => {
    const bookA = storage.createQuestBook("Book A", "");
    const bookB = storage.createQuestBook("Book B", "");
    storage.createQuest({ title: "A1", description: "", questBookId: bookA.id });
    storage.createQuest({ title: "B1", description: "", questBookId: bookB.id });
    storage.createQuest({ title: "B2", description: "", questBookId: bookB.id });

    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );

    // Click sidebar button for Book B
    const bookBBtn = Array.from(container.querySelectorAll("button")).find(
      btn => btn.textContent.includes("Book B")
    );
    fireEvent.click(bookBBtn);

    const title = container.querySelector('[data-testid="showcase-title"]').textContent;
    expect(["B1", "B2"]).toContain(title);
  });
});

// ── QuestLibrary showcase cover image ────────────────────────────────────────

describe("QuestLibrary showcase cover image", () => {
  it("renders img with coverImage src when selected quest's book has one", () => {
    const book = storage.createQuestBook("Book", "", "data:image/png;base64,FAKE");
    storage.createQuest({ title: "Q", description: "", questBookId: book.id });
    const { container } = render(<QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />);
    const img = container.querySelector('[data-testid="showcase-cover-img"]');
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("data:image/png;base64,FAKE");
    expect(img.getAttribute("alt")).toBe("Cover image preview");
  });

  it("renders placeholder when book has no coverImage", () => {
    const book = storage.createQuestBook("Book", "");
    storage.createQuest({ title: "Q", description: "", questBookId: book.id });
    const { container } = render(<QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />);
    expect(container.querySelector('[data-testid="showcase-cover-img"]')).toBeNull();
    expect(container.querySelector('[data-testid="showcase-placeholder"]')).toBeTruthy();
  });

  it("renders placeholder when quest has no book", () => {
    storage.createQuest({ title: "Q", description: "", questBookId: null });
    const { container } = render(<QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />);
    expect(container.querySelector('[data-testid="showcase-cover-img"]')).toBeNull();
    expect(container.querySelector('[data-testid="showcase-placeholder"]')).toBeTruthy();
  });

  it("showcase-cover-img has opacity 0.7", () => {
    const book = storage.createQuestBook("Book", "", "data:image/png;base64,FAKE");
    storage.createQuest({ title: "Q", description: "", questBookId: book.id });
    const { container } = render(<QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />);
    const img = container.querySelector('[data-testid="showcase-cover-img"]');
    expect(img).toBeTruthy();
    expect(img.style.opacity).toBe("0.7");
  });
});

// ── Quest card border radius ──────────────────────────────────────────────────

describe("QuestLibrary quest card border radius", () => {
  it("quest card has borderRadius 8px", () => {
    const quest = storage.createQuest({ title: "Round Quest", description: "", questBookId: null });
    const { container } = render(<QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />);
    const card = container.querySelector(`[data-testid="thumb-${quest.id}"]`);
    expect(card).toBeTruthy();
    expect(card.style.borderRadius).toBe("8px");
  });
});

// ── Step 9: Action buttons trigger correct handlers ───────────────────────────

describe("QuestLibrary action buttons", () => {
  it("action-play calls onPlay with quest, action-edit calls onEdit with quest", () => {
    const quest = storage.createQuest({ title: "Action Quest", description: "", questBookId: null });
    const onPlay = vi.fn();
    const onEdit = vi.fn();
    const { container } = render(
      <QuestLibrary onPlay={onPlay} onEdit={onEdit} onCalibrate={() => {}} />
    );
    fireEvent.click(container.querySelector('[data-testid="action-play"]'));
    expect(onPlay).toHaveBeenCalledWith(expect.objectContaining({ id: quest.id }));
    fireEvent.click(container.querySelector('[data-testid="action-edit"]'));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: quest.id }));
  });
});

// ── Description tooltip ───────────────────────────────────────────────────────

describe("QuestLibrary description tooltip", () => {
  it("hovering over a description shows a tooltip with the full description text", () => {
    const desc = "A long quest description that may be truncated in the card.";
    storage.createQuest({ title: "Tooltip Quest", description: desc, questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const descEl = container.querySelector('[data-testid="quest-description"]');
    expect(descEl).toBeTruthy();
    fireEvent.mouseEnter(descEl);
    const tooltip = container.querySelector('[data-testid="desc-tooltip"]');
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toBe(desc);
  });

  it("mouse leave hides the description tooltip", () => {
    storage.createQuest({ title: "Q", description: "Some description text", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const descEl = container.querySelector('[data-testid="quest-description"]');
    fireEvent.mouseEnter(descEl);
    expect(container.querySelector('[data-testid="desc-tooltip"]')).toBeTruthy();
    fireEvent.mouseLeave(descEl);
    expect(container.querySelector('[data-testid="desc-tooltip"]')).toBeNull();
  });

  it("does not add a tooltip-triggering element when description is empty", () => {
    storage.createQuest({ title: "Q", description: "", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(container.querySelector('[data-testid="quest-description"]')).toBeNull();
  });

  it("tooltip has position fixed and is non-interactive", () => {
    storage.createQuest({ title: "Q", description: "Desc text", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const descEl = container.querySelector('[data-testid="quest-description"]');
    fireEvent.mouseEnter(descEl);
    const tooltip = container.querySelector('[data-testid="desc-tooltip"]');
    expect(tooltip.style.position).toBe("fixed");
    expect(tooltip.style.pointerEvents).toBe("none");
  });
});

// ── New Quest dialog trigger/open/close/create flow ──────────────────────────

describe("QuestLibrary New Quest dialog — baseline", () => {
  it("no New Quest dialog heading is present initially, and the trigger button is visible", () => {
    const { container, getByText } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(container.querySelector("h6.modal-title")).toBeNull();
    expect(getByText("＋ New Quest")).toBeTruthy();
  });
});

describe("QuestLibrary New Quest dialog — open/close", () => {
  it("clicking ＋ New Quest shows the dialog and hides the trigger button", () => {
    const { getByText, container, queryByText } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Quest"));
    const heading = container.querySelector("h6.modal-title");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe("New Quest");
    expect(queryByText("＋ New Quest")).toBeNull();
  });
});

describe("QuestLibrary New Quest dialog — create flow", () => {
  it("filling the title and clicking Create & Edit adds a quest, closes the dialog, and calls onEdit", () => {
    const onEdit = vi.fn();
    const { getByText, getByPlaceholderText, container, queryByText } = render(
      <QuestLibrary onPlay={() => {}} onEdit={onEdit} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Quest"));
    fireEvent.change(getByPlaceholderText("Quest title"), { target: { value: "Brand New Quest" } });
    fireEvent.click(getByText("Create & Edit"));

    expect(container.querySelector("h6.modal-title")).toBeNull();
    expect(queryByText("＋ New Quest")).toBeTruthy();
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ title: "Brand New Quest" }));

    const stored = JSON.parse(localStorage.getItem("hq_quests") || "[]");
    expect(stored.some(q => q.title === "Brand New Quest")).toBe(true);
  });
});

describe("QuestLibrary New Quest dialog — cancel", () => {
  it("clicking Cancel inside the dialog closes it without adding a quest", () => {
    const { getByText, container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Quest"));
    fireEvent.click(getByText("Cancel"));
    expect(container.querySelector("h6.modal-title")).toBeNull();
    const stored = JSON.parse(localStorage.getItem("hq_quests") || "[]");
    expect(stored.length).toBe(0);
  });
});

describe("QuestLibrary New Quest dialog — backdrop dismiss", () => {
  it("clicking the backdrop closes the dialog without creating a quest", () => {
    const { getByText, container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Quest"));
    const backdrop = container.querySelector(".hq-modal-backdrop");
    fireEvent.mouseDown(backdrop);
    expect(container.querySelector("h6.modal-title")).toBeNull();
    const stored = JSON.parse(localStorage.getItem("hq_quests") || "[]");
    expect(stored.length).toBe(0);
  });
});

describe("QuestLibrary New Quest dialog — Escape key", () => {
  it("pressing Escape while the dialog is open closes it", () => {
    const { getByText, container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Quest"));
    expect(container.querySelector("h6.modal-title")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector("h6.modal-title")).toBeNull();
  });
});

describe("QuestLibrary New Quest dialog — fresh state on reopen", () => {
  it("typed values are not retained across close/reopen", () => {
    const { getByText, getByPlaceholderText } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Quest"));
    fireEvent.change(getByPlaceholderText("Quest title"), { target: { value: "Some draft title" } });
    fireEvent.click(getByText("Cancel"));
    fireEvent.click(getByText("＋ New Quest"));
    expect(getByPlaceholderText("Quest title").value).toBe("");
  });
});

// ── FEAT-030: Larger quest number display on quest cards ─────────────────────

describe("QuestLibrary quest number badge", () => {
  it("renders a larger, bold quest-number-badge", () => {
    storage.createQuest({ title: "Numbered Quest", description: "", questBookId: null, questNumber: 5 });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const badge = container.querySelector('[data-testid="quest-number-badge"]');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe("#5");
    expect(badge.style.fontSize).toBe("16px");
    expect(badge.style.fontWeight).toBe("bold");
  });

  it("keeps the original background/color contrast on the larger badge", () => {
    storage.createQuest({ title: "Numbered Quest", description: "", questBookId: null, questNumber: 5 });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const badge = container.querySelector('[data-testid="quest-number-badge"]');
    expect(badge).toBeTruthy();
    expect(badge.style.background).toBe(hexToRgb(T.accentGold));
    expect(badge.style.color).toBe(hexToRgb("#12100e"));
  });

  it("is pill-shaped and sized to fit its content without clipping", () => {
    storage.createQuest({ title: "Numbered Quest", description: "", questBookId: null, questNumber: 5 });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const badge = container.querySelector('[data-testid="quest-number-badge"]');
    expect(badge).toBeTruthy();
    expect(badge.style.borderRadius).not.toBe("50%");
    expect(badge.style.minWidth).not.toBe("");
    expect(badge.style.width).toBe("");
  });

  it("renders full multi-digit quest numbers without truncation", () => {
    storage.createQuest({ title: "Multi Digit Quest", description: "", questBookId: null, questNumber: 123 });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const badge = container.querySelector('[data-testid="quest-number-badge"]');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe("#123");
  });

  it("does not render the badge when questNumber is absent", () => {
    storage.createQuest({ title: "No Number Quest", description: "", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(container.querySelector('[data-testid="quest-number-badge"]')).toBeNull();
  });

  it("leaves the New badge's smaller font size untouched", () => {
    storage.createQuest({ title: "Fresh Quest", description: "", questBookId: null });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const badge = container.querySelector('[data-testid="new-badge"]');
    expect(badge).toBeTruthy();
    expect(badge.style.fontSize).toBe("8px");
  });

  it("stacks badges vertically in the quest-badges container", () => {
    storage.createQuest({ title: "Numbered Quest", description: "", questBookId: null, questNumber: 5 });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const badges = container.querySelector('[data-testid="quest-badges"]');
    expect(badges).toBeTruthy();
    expect(badges.style.flexDirection).toBe("column");
  });

  it("reserves vertical space in the badge column to avoid layout jitter", () => {
    storage.createQuest({ title: "Fresh Numbered Quest", description: "", questBookId: null, questNumber: 5 });
    const { container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    const badges = container.querySelector('[data-testid="quest-badges"]');
    expect(badges).toBeTruthy();
    expect(badges.style.minHeight).not.toBe("");
    expect(badges.style.minHeight).not.toBe("0px");
  });
});

// ── New Book dialog trigger/open/close/create flow (FEAT-033) ────────────────

describe("QuestLibrary New Book dialog — baseline", () => {
  it("no New Quest Book dialog heading is present initially, and the trigger button is visible", () => {
    const { container, getByText } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(container.querySelector("h6.modal-title")).toBeNull();
    expect(getByText("＋ New Book")).toBeTruthy();
  });
});

describe("QuestLibrary New Book dialog — open/close", () => {
  it("clicking ＋ New Book shows the dialog and hides the trigger button", () => {
    const { getByText, container, queryByText } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Book"));
    const heading = container.querySelector("h6.modal-title");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe("New Quest Book");
    expect(queryByText("＋ New Book")).toBeNull();
  });
});

describe("QuestLibrary New Book dialog — create flow", () => {
  it("filling the title and clicking Create adds a book to the sidebar list, closes the dialog, persists to storage, and does not change selectedBookId", () => {
    const { getByText, getByPlaceholderText, container, queryByText } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Book"));
    fireEvent.change(getByPlaceholderText("Book title"), { target: { value: "Brand New Book" } });
    fireEvent.click(getByText("Create"));

    expect(container.querySelector("h6.modal-title")).toBeNull();
    expect(queryByText("＋ New Book")).toBeTruthy();
    expect(getByText("Brand New Book")).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem("hq_quest_books") || "[]");
    expect(stored.some(b => b.title === "Brand New Book")).toBe(true);

    // "All Quests" remains the active filter (selectedBookId unchanged)
    const allQuestsBtn = container.querySelector("nav button.active");
    expect(allQuestsBtn.textContent).toContain("All Quests");
  });
});

describe("QuestLibrary New Book dialog — cancel", () => {
  it("clicking Cancel inside the dialog closes it without adding a book", () => {
    const { getByText, container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Book"));
    fireEvent.click(getByText("Cancel"));
    expect(container.querySelector("h6.modal-title")).toBeNull();
    const stored = JSON.parse(localStorage.getItem("hq_quest_books") || "[]");
    expect(stored.length).toBe(0);
  });
});

describe("QuestLibrary New Book dialog — backdrop dismiss", () => {
  it("clicking the backdrop closes the dialog without creating a book", () => {
    const { getByText, container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Book"));
    const backdrop = container.querySelector(".hq-modal-backdrop");
    fireEvent.mouseDown(backdrop);
    expect(container.querySelector("h6.modal-title")).toBeNull();
    const stored = JSON.parse(localStorage.getItem("hq_quest_books") || "[]");
    expect(stored.length).toBe(0);
  });
});

describe("QuestLibrary New Book dialog — Escape key", () => {
  it("pressing Escape while the dialog is open closes it", () => {
    const { getByText, container } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Book"));
    expect(container.querySelector("h6.modal-title")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector("h6.modal-title")).toBeNull();
  });
});

describe("QuestLibrary New Book dialog — fresh state on reopen", () => {
  it("typed values are not retained across close/reopen", () => {
    const { getByText, getByPlaceholderText } = render(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    fireEvent.click(getByText("＋ New Book"));
    fireEvent.change(getByPlaceholderText("Book title"), { target: { value: "Some draft title" } });
    fireEvent.click(getByText("Cancel"));
    fireEvent.click(getByText("＋ New Book"));
    expect(getByPlaceholderText("Book title").value).toBe("");
  });
});

// ── FEAT-040: Language switcher ───────────────────────────────────────────────

describe("QuestLibrary language switcher", () => {
  it("renders EN and ES segments", () => {
    const { getByText } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(getByText("EN")).toBeTruthy();
    expect(getByText("ES")).toBeTruthy();
  });

  it("clicking ES switches visible text to Spanish and persists to localStorage", () => {
    const { getByText, getByTestId } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(getByTestId("library-heading").textContent).toBe("HeroQuest — Quest Library");
    fireEvent.click(getByText("ES"));
    expect(getByTestId("library-heading").textContent).toBe("HeroQuest — Biblioteca de Misiones");
    expect(localStorage.getItem("hq_locale")).toBe("es");
  });

  it("starting in Spanish (seeded locale) renders Spanish text", () => {
    const { getByTestId } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />,
      { locale: "es" }
    );
    expect(getByTestId("library-heading").textContent).toBe("HeroQuest — Biblioteca de Misiones");
  });

  it("delete button text switches between English and Spanish", () => {
    storage.createQuest({ title: "Test Quest", description: "", questBookId: null });
    const { getByText, getByTestId } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(getByTestId("action-delete").textContent).toBe("× Delete");
    fireEvent.click(getByText("ES"));
    expect(getByTestId("action-delete").textContent).toBe("× Eliminar");
  });

  it("new-badge text switches between English and Spanish", () => {
    storage.createQuest({ title: "Fresh Quest", description: "", questBookId: null });
    const { getByText, getByTestId } = renderWithI18n(
      <QuestLibrary onPlay={() => {}} onEdit={() => {}} onCalibrate={() => {}} />
    );
    expect(getByTestId("new-badge").textContent).toBe("New");
    fireEvent.click(getByText("ES"));
    expect(getByTestId("new-badge").textContent).toBe("Nuevo");
  });
});
