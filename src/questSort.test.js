import { describe, it, expect } from "vitest";
import { sortQuests } from "./questSort.js";

const book1 = { id: "b1", title: "Book One" };
const book2 = { id: "b2", title: "Book Two" };
const books = [book1, book2];

function quest(overrides) {
  return { id: "q", title: "Quest", questBookId: null, questNumber: null, ...overrides };
}

describe("sortQuests", () => {
  it("returns empty array for empty input", () => {
    expect(sortQuests([], [])).toEqual([]);
  });

  it("returns same quests when books is empty", () => {
    const q1 = quest({ id: "q1", title: "B" });
    const q2 = quest({ id: "q2", title: "A" });
    const result = sortQuests([q1, q2], []);
    expect(result.map(q => q.id)).toEqual(["q2", "q1"]);
  });

  it("sorts quests in book1 before quests in book2", () => {
    const q1 = quest({ id: "q1", questBookId: "b2", title: "Alpha" });
    const q2 = quest({ id: "q2", questBookId: "b1", title: "Alpha" });
    const result = sortQuests([q1, q2], books);
    expect(result[0].id).toBe("q2");
    expect(result[1].id).toBe("q1");
  });

  it("sorts by questNumber ascending within the same book", () => {
    const q1 = quest({ id: "q1", questBookId: "b1", questNumber: 3 });
    const q2 = quest({ id: "q2", questBookId: "b1", questNumber: 1 });
    const q3 = quest({ id: "q3", questBookId: "b1", questNumber: 2 });
    const result = sortQuests([q1, q2, q3], books);
    expect(result.map(q => q.questNumber)).toEqual([1, 2, 3]);
  });

  it("sorts numbered quests before unnumbered quests within the same book", () => {
    const q1 = quest({ id: "q1", questBookId: "b1", questNumber: null, title: "Alpha" });
    const q2 = quest({ id: "q2", questBookId: "b1", questNumber: 5 });
    const result = sortQuests([q1, q2], books);
    expect(result[0].id).toBe("q2");
    expect(result[1].id).toBe("q1");
  });

  it("sorts unnumbered quests alphabetically by title within the same book", () => {
    const q1 = quest({ id: "q1", questBookId: "b1", title: "Zebra" });
    const q2 = quest({ id: "q2", questBookId: "b1", title: "Apple" });
    const q3 = quest({ id: "q3", questBookId: "b1", title: "Mango" });
    const result = sortQuests([q1, q2, q3], books);
    expect(result.map(q => q.title)).toEqual(["Apple", "Mango", "Zebra"]);
  });

  it("sorts numbered then alphabetical within the same book", () => {
    const q1 = quest({ id: "q1", questBookId: "b1", questNumber: null, title: "Zebra" });
    const q2 = quest({ id: "q2", questBookId: "b1", questNumber: 1 });
    const q3 = quest({ id: "q3", questBookId: "b1", questNumber: null, title: "Alpha" });
    const q4 = quest({ id: "q4", questBookId: "b1", questNumber: 2 });
    const result = sortQuests([q1, q2, q3, q4], books);
    expect(result.map(q => q.id)).toEqual(["q2", "q4", "q3", "q1"]);
  });

  it("sorts quests with no book last", () => {
    const q1 = quest({ id: "q1", questBookId: null, title: "Alpha" });
    const q2 = quest({ id: "q2", questBookId: "b1", title: "Zebra" });
    const result = sortQuests([q1, q2], books);
    expect(result[0].id).toBe("q2");
    expect(result[1].id).toBe("q1");
  });

  it("sorts bookless quests among themselves by number then title", () => {
    const q1 = quest({ id: "q1", questBookId: null, questNumber: null, title: "Beta" });
    const q2 = quest({ id: "q2", questBookId: null, questNumber: 1 });
    const q3 = quest({ id: "q3", questBookId: null, questNumber: null, title: "Alpha" });
    const result = sortQuests([q1, q2, q3], books);
    expect(result.map(q => q.id)).toEqual(["q2", "q3", "q1"]);
  });

  it("treats questNumber: 0 as a valid number that sorts before 1", () => {
    const q1 = quest({ id: "q1", questBookId: "b1", questNumber: 1 });
    const q2 = quest({ id: "q2", questBookId: "b1", questNumber: 0 });
    const result = sortQuests([q1, q2], books);
    expect(result[0].id).toBe("q2");
  });

  it("treats quest with deleted book's questBookId as no-book (sorts last)", () => {
    const q1 = quest({ id: "q1", questBookId: "deleted-book", title: "A" });
    const q2 = quest({ id: "q2", questBookId: "b1", title: "Z" });
    const result = sortQuests([q1, q2], books);
    expect(result[0].id).toBe("q2");
    expect(result[1].id).toBe("q1");
  });

  it("does not mutate the original array", () => {
    const q1 = quest({ id: "q1", questBookId: "b2" });
    const q2 = quest({ id: "q2", questBookId: "b1" });
    const original = [q1, q2];
    sortQuests(original, books);
    expect(original[0].id).toBe("q1");
  });
});
