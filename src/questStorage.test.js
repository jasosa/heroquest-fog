import { describe, it, expect, beforeEach, vi } from "vitest";
import { exportQuestAsJson, importQuestFromJson } from "./questStorage.js";

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
