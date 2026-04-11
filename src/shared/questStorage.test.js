import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  exportQuestAsJson,
  importQuestFromJson,
  createQuestBook,
  updateQuestBook,
  loadQuestBooks,
  createQuest,
  loadQuests,
  migrateQuests,
} from "./questStorage.js";

// ── Minimal localStorage mock ──────────────────────────────────────────────
const store = {};
const localStorageMock = {
  getItem: vi.fn(k => store[k] ?? null),
  setItem: vi.fn((k, v) => { store[k] = v; }),
  removeItem: vi.fn(k => { delete store[k]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
};
vi.stubGlobal("localStorage", localStorageMock);

beforeEach(() => {
  localStorageMock.clear();
});

// ── updateQuestBook ────────────────────────────────────────────────────────
describe("updateQuestBook", () => {
  it("updates the title of an existing book", () => {
    const book = createQuestBook("Original", "desc");
    updateQuestBook(book.id, { title: "Updated" });
    const books = loadQuestBooks();
    expect(books.find(b => b.id === book.id).title).toBe("Updated");
  });

  it("updates the description of an existing book", () => {
    const book = createQuestBook("Title", "old desc");
    updateQuestBook(book.id, { description: "new desc" });
    const books = loadQuestBooks();
    expect(books.find(b => b.id === book.id).description).toBe("new desc");
  });

  it("updates both title and description", () => {
    const book = createQuestBook("T", "D");
    updateQuestBook(book.id, { title: "T2", description: "D2" });
    const books = loadQuestBooks();
    const updated = books.find(b => b.id === book.id);
    expect(updated.title).toBe("T2");
    expect(updated.description).toBe("D2");
  });

  it("preserves other fields such as createdAt and id", () => {
    const book = createQuestBook("Keep", "");
    updateQuestBook(book.id, { title: "New" });
    const books = loadQuestBooks();
    const updated = books.find(b => b.id === book.id);
    expect(updated.id).toBe(book.id);
    expect(updated.createdAt).toBe(book.createdAt);
  });

  it("returns the updated book", () => {
    const book = createQuestBook("Ret", "");
    const result = updateQuestBook(book.id, { title: "RetNew" });
    expect(result.title).toBe("RetNew");
    expect(result.id).toBe(book.id);
  });

  it("does not affect other books", () => {
    const a = createQuestBook("A", "");
    const b = createQuestBook("B", "");
    updateQuestBook(a.id, { title: "A2" });
    const books = loadQuestBooks();
    expect(books.find(bk => bk.id === b.id).title).toBe("B");
  });

  it("returns undefined when id does not exist", () => {
    const result = updateQuestBook("nonexistent-id", { title: "X" });
    expect(result).toBeUndefined();
  });

  it("does not mutate the store when id does not exist", () => {
    const book = createQuestBook("Safe", "");
    updateQuestBook("bad-id", { title: "Injected" });
    const books = loadQuestBooks();
    expect(books.find(b => b.id === book.id).title).toBe("Safe");
  });
});

// ── createQuest questNumber ────────────────────────────────────────────────
describe("createQuest questNumber", () => {
  it("defaults questNumber to null when not provided", () => {
    const quest = createQuest({ title: "Q" });
    expect(quest.questNumber).toBeNull();
  });

  it("stores questNumber when provided", () => {
    const quest = createQuest({ title: "Q", questNumber: 3 });
    expect(quest.questNumber).toBe(3);
    const stored = loadQuests().find(q => q.id === quest.id);
    expect(stored.questNumber).toBe(3);
  });

  it("stores questNumber: 0 as 0", () => {
    const quest = createQuest({ title: "Q", questNumber: 0 });
    expect(quest.questNumber).toBe(0);
  });
});

// ── migrateQuests ──────────────────────────────────────────────────────────
describe("migrateQuests", () => {
  it("adds questNumber: null to quests that lack the field", () => {
    // Manually write a quest without questNumber to localStorage
    const raw = [{ id: "q1", title: "Old", questBookId: null, placed: {}, doors: {} }];
    localStorage.setItem("hq_quests", JSON.stringify(raw));
    migrateQuests();
    const quests = loadQuests();
    expect(quests[0].questNumber).toBeNull();
  });

  it("does not overwrite an existing questNumber", () => {
    const raw = [{ id: "q1", title: "Q", questNumber: 5 }];
    localStorage.setItem("hq_quests", JSON.stringify(raw));
    migrateQuests();
    const quests = loadQuests();
    expect(quests[0].questNumber).toBe(5);
  });

  it("is a no-op when all quests already have questNumber", () => {
    const raw = [{ id: "q1", title: "Q", questNumber: null }];
    localStorage.setItem("hq_quests", JSON.stringify(raw));
    const setItemCallsBefore = localStorageMock.setItem.mock.calls.length;
    migrateQuests();
    expect(localStorageMock.setItem.mock.calls.length).toBe(setItemCallsBefore);
  });
});

// ── exportQuestAsJson ──────────────────────────────────────────────────────
describe("exportQuestAsJson", () => {
  it("returns a JSON string", () => {
    const quest = {
      id: "abc123",
      questBookId: "book1",
      createdAt: 1000,
      updatedAt: 2000,
      title: "Test Quest",
      description: "A description",
      placed: { "2,3": { type: "goblin" } },
      doors: { "1,1": { rotation: 0 } },
    };
    const result = exportQuestAsJson(quest);
    expect(typeof result).toBe("string");
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("excludes id, questBookId, createdAt, updatedAt", () => {
    const quest = {
      id: "abc123",
      questBookId: "book1",
      createdAt: 1000,
      updatedAt: 2000,
      title: "Test Quest",
      description: "",
      placed: {},
      doors: {},
    };
    const parsed = JSON.parse(exportQuestAsJson(quest));
    expect(parsed).not.toHaveProperty("id");
    expect(parsed).not.toHaveProperty("questBookId");
    expect(parsed).not.toHaveProperty("createdAt");
    expect(parsed).not.toHaveProperty("updatedAt");
  });

  it("includes title, description, placed, doors", () => {
    const quest = {
      id: "abc123",
      questBookId: null,
      createdAt: 1000,
      updatedAt: 2000,
      title: "My Quest",
      description: "Details",
      placed: { "5,6": { type: "skeleton" } },
      doors: { "2,3": { rotation: 1 } },
    };
    const parsed = JSON.parse(exportQuestAsJson(quest));
    expect(parsed.title).toBe("My Quest");
    expect(parsed.description).toBe("Details");
    expect(parsed.placed).toEqual({ "5,6": { type: "skeleton" } });
    expect(parsed.doors).toEqual({ "2,3": { rotation: 1 } });
  });

  it("includes searchMarkers and searchNotes when present", () => {
    const quest = {
      id: "x",
      questBookId: null,
      createdAt: 1,
      updatedAt: 2,
      title: "Q",
      description: "",
      placed: {},
      doors: {},
      searchMarkers: { R1: [2, 3] },
      searchNotes: { R1: "A key" },
    };
    const parsed = JSON.parse(exportQuestAsJson(quest));
    expect(parsed.searchMarkers).toEqual({ R1: [2, 3] });
    expect(parsed.searchNotes).toEqual({ R1: "A key" });
  });
});

// ── createQuest placementMessage ──────────────────────────────────────────
describe("createQuest placementMessage", () => {
  it("includes placementMessage as empty string by default", () => {
    const quest = createQuest({ title: "Q" });
    expect(quest.placementMessage).toBe("");
  });

  it("stores the provided placementMessage", () => {
    const quest = createQuest({ title: "Q", placementMessage: "Place heroes at the stairs" });
    expect(quest.placementMessage).toBe("Place heroes at the stairs");
    const stored = loadQuests().find(q => q.id === quest.id);
    expect(stored.placementMessage).toBe("Place heroes at the stairs");
  });
});

// ── importQuestFromJson ────────────────────────────────────────────────────
describe("importQuestFromJson", () => {
  it("saves the quest and returns it with a fresh id", () => {
    const json = JSON.stringify({
      title: "Imported Quest",
      description: "desc",
      placed: {},
      doors: {},
    });
    const quest = importQuestFromJson(json, null);
    expect(quest.id).toBeTruthy();
    expect(quest.title).toBe("Imported Quest");
    expect(quest.description).toBe("desc");
  });

  it("assigns questBookId from the second argument", () => {
    const json = JSON.stringify({ title: "Q", description: "", placed: {}, doors: {} });
    const quest = importQuestFromJson(json, "bookXYZ");
    expect(quest.questBookId).toBe("bookXYZ");
  });

  it("assigns null questBookId when none provided", () => {
    const json = JSON.stringify({ title: "Q", description: "", placed: {}, doors: {} });
    const quest = importQuestFromJson(json);
    expect(quest.questBookId).toBeNull();
  });

  it("preserves placed and doors", () => {
    const placed = { "3,4": { type: "zombie" } };
    const doors = { "1,2": { rotation: 2 } };
    const json = JSON.stringify({ title: "Q", description: "", placed, doors });
    const quest = importQuestFromJson(json, null);
    expect(quest.placed).toEqual(placed);
    expect(quest.doors).toEqual(doors);
  });

  it("preserves searchMarkers and searchNotes", () => {
    const json = JSON.stringify({
      title: "Q",
      description: "",
      placed: {},
      doors: {},
      searchMarkers: { R2: [1] },
      searchNotes: { R2: "Gold coin" },
    });
    const quest = importQuestFromJson(json, null);
    expect(quest.searchMarkers).toEqual({ R2: [1] });
    expect(quest.searchNotes).toEqual({ R2: "Gold coin" });
  });

  it("throws on malformed JSON", () => {
    expect(() => importQuestFromJson("not json", null)).toThrow();
  });

  it("throws when title is missing", () => {
    const json = JSON.stringify({ description: "", placed: {}, doors: {} });
    expect(() => importQuestFromJson(json, null)).toThrow("Invalid quest file");
  });

  it("throws when placed is missing", () => {
    const json = JSON.stringify({ title: "Q", description: "", doors: {} });
    expect(() => importQuestFromJson(json, null)).toThrow("Invalid quest file");
  });

  it("throws when doors is missing", () => {
    const json = JSON.stringify({ title: "Q", description: "", placed: {} });
    expect(() => importQuestFromJson(json, null)).toThrow("Invalid quest file");
  });

  it("generates a new id each time (no collisions)", () => {
    const json = JSON.stringify({ title: "Q", description: "", placed: {}, doors: {} });
    const q1 = importQuestFromJson(json, null);
    const q2 = importQuestFromJson(json, null);
    expect(q1.id).not.toBe(q2.id);
  });
});
