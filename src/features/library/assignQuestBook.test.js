import { describe, it, expect } from "vitest";
import { assignQuestToBook } from "./assignQuestBook.js";

const baseQuest = {
  id: "q1",
  title: "My Quest",
  description: "desc",
  questBookId: "b1",
  questNumber: 2,
  placed: { "1,2": { type: "goblin" } },
  doors: { "3,4": { rotation: 0 } },
  createdAt: 1000,
  updatedAt: 2000,
};

describe("assignQuestToBook", () => {
  it("returns a new object and does not mutate the input", () => {
    const result = assignQuestToBook(baseQuest, "b2", 3);
    expect(result).not.toBe(baseQuest);
    expect(baseQuest.questBookId).toBe("b1");
  });

  it("sets questBookId to the provided book id", () => {
    const result = assignQuestToBook(baseQuest, "b2", null);
    expect(result.questBookId).toBe("b2");
  });

  it("sets questBookId to null when passed null", () => {
    const result = assignQuestToBook(baseQuest, null, null);
    expect(result.questBookId).toBeNull();
  });

  it("sets questNumber to the provided integer", () => {
    const result = assignQuestToBook(baseQuest, "b1", 7);
    expect(result.questNumber).toBe(7);
  });

  it("sets questNumber to null when passed null", () => {
    const result = assignQuestToBook(baseQuest, "b1", null);
    expect(result.questNumber).toBeNull();
  });

  it("sets questNumber to 0 when passed 0 (not treated as falsy)", () => {
    const result = assignQuestToBook(baseQuest, "b1", 0);
    expect(result.questNumber).toBe(0);
  });

  it("preserves all other quest fields", () => {
    const result = assignQuestToBook(baseQuest, "b2", 5);
    expect(result.id).toBe("q1");
    expect(result.title).toBe("My Quest");
    expect(result.description).toBe("desc");
    expect(result.placed).toEqual(baseQuest.placed);
    expect(result.doors).toEqual(baseQuest.doors);
    expect(result.createdAt).toBe(1000);
  });

  it("does not set or overwrite updatedAt", () => {
    const result = assignQuestToBook(baseQuest, "b2", 5);
    expect(result.updatedAt).toBe(2000);
  });
});
