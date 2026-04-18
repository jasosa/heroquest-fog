// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { AssignQuestBookDialog } from "./AssignQuestBookDialog.jsx";
afterEach(cleanup);

const QUEST = { id: "q1", title: "Quest One", questBookId: null, questNumber: null };
const BOOKS = [{ id: "b1", title: "Book One" }];

describe("AssignQuestBookDialog quest number label", () => {
  it("renders a visible label for the quest number input", () => {
    const { getByText } = render(
      <AssignQuestBookDialog quest={QUEST} books={BOOKS} onSave={() => {}} onCancel={() => {}} />
    );
    expect(getByText(/Quest # in book/i)).toBeTruthy();
  });

  it("renders a helper text below the quest number input", () => {
    const { getByText } = render(
      <AssignQuestBookDialog quest={QUEST} books={BOOKS} onSave={() => {}} onCancel={() => {}} />
    );
    expect(getByText(/Position of this quest in the book/i)).toBeTruthy();
  });
});
