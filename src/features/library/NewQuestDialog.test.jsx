// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { NewQuestDialog } from "./NewQuestDialog.jsx";

afterEach(cleanup);

const books = [
  { id: "b1", title: "Book One" },
  { id: "b2", title: "Book Two" },
];

describe("NewQuestDialog rendering", () => {
  it("renders a header reading 'New Quest' and all fields", () => {
    const { container, getByPlaceholderText } = render(
      <NewQuestDialog books={books} onCreate={() => {}} onCancel={() => {}} />
    );
    const heading = container.querySelector("h6.modal-title");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe("New Quest");

    expect(getByPlaceholderText("Quest title")).toBeTruthy();
    expect(getByPlaceholderText("Description (optional)")).toBeTruthy();
    expect(getByPlaceholderText("Quest number (optional)")).toBeTruthy();

    const select = container.querySelector("select");
    expect(select).toBeTruthy();
    expect(select.textContent).toContain("— No book —");
    expect(select.querySelectorAll("option").length).toBe(1 + books.length);
    expect(select.textContent).toContain("Book One");
    expect(select.textContent).toContain("Book Two");
  });
});

describe("NewQuestDialog Create button enablement", () => {
  it("disables Create & Edit when title is empty or whitespace, enables once typed", () => {
    const { getByPlaceholderText, getByText } = render(
      <NewQuestDialog books={books} onCreate={() => {}} onCancel={() => {}} />
    );
    const createBtn = getByText("Create & Edit");
    expect(createBtn.disabled).toBe(true);

    const titleInput = getByPlaceholderText("Quest title");
    fireEvent.change(titleInput, { target: { value: "   " } });
    expect(createBtn.disabled).toBe(true);

    fireEvent.change(titleInput, { target: { value: "My Quest" } });
    expect(createBtn.disabled).toBe(false);
  });
});

describe("NewQuestDialog onCreate call", () => {
  it("calls onCreate with trimmed title/description, null book, null number by default", () => {
    const onCreate = vi.fn();
    const { getByPlaceholderText, getByText } = render(
      <NewQuestDialog books={books} onCreate={onCreate} onCancel={() => {}} />
    );
    fireEvent.change(getByPlaceholderText("Quest title"), { target: { value: "  My Quest  " } });
    fireEvent.change(getByPlaceholderText("Description (optional)"), { target: { value: "  Desc  " } });
    fireEvent.click(getByText("Create & Edit"));
    expect(onCreate).toHaveBeenCalledWith("My Quest", "Desc", null, null);
  });

  it("calls onCreate with selected book id and numeric quest number, including 0", () => {
    const onCreate = vi.fn();
    const { getByPlaceholderText, getByText, container } = render(
      <NewQuestDialog books={books} onCreate={onCreate} onCancel={() => {}} />
    );
    fireEvent.change(getByPlaceholderText("Quest title"), { target: { value: "Quest" } });
    fireEvent.change(container.querySelector("select"), { target: { value: "b2" } });
    fireEvent.change(getByPlaceholderText("Quest number (optional)"), { target: { value: "0" } });
    fireEvent.click(getByText("Create & Edit"));
    expect(onCreate).toHaveBeenCalledWith("Quest", "", "b2", 0);
  });
});

describe("NewQuestDialog cancel", () => {
  it("clicking Cancel calls onCancel and not onCreate", () => {
    const onCancel = vi.fn();
    const onCreate = vi.fn();
    const { getByText } = render(
      <NewQuestDialog books={books} onCreate={onCreate} onCancel={onCancel} />
    );
    fireEvent.click(getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("clicking the header close button calls onCancel", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <NewQuestDialog books={books} onCreate={() => {}} onCancel={onCancel} />
    );
    fireEvent.click(container.querySelector("button.btn-close.btn-close-white"));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("NewQuestDialog backdrop dismiss", () => {
  it("mousedown on the backdrop itself calls onCancel", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <NewQuestDialog books={books} onCreate={() => {}} onCancel={onCancel} />
    );
    const backdrop = container.querySelector(".hq-modal-backdrop");
    fireEvent.mouseDown(backdrop);
    expect(onCancel).toHaveBeenCalled();
  });

  it("mousedown on inner modal-content does not call onCancel", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <NewQuestDialog books={books} onCreate={() => {}} onCancel={onCancel} />
    );
    const content = container.querySelector(".modal-content");
    fireEvent.mouseDown(content);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe("NewQuestDialog Escape key", () => {
  it("dispatching Escape on window calls onCancel", () => {
    const onCancel = vi.fn();
    render(<NewQuestDialog books={books} onCreate={() => {}} onCancel={onCancel} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("Escape works even when focus is on the title input", () => {
    const onCancel = vi.fn();
    const { getByPlaceholderText } = render(
      <NewQuestDialog books={books} onCreate={() => {}} onCancel={onCancel} />
    );
    getByPlaceholderText("Quest title").focus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("Escape works even when focus is on the select", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <NewQuestDialog books={books} onCreate={() => {}} onCancel={onCancel} />
    );
    container.querySelector("select").focus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("does not call onCancel again after unmount", () => {
    const onCancel = vi.fn();
    const { unmount } = render(
      <NewQuestDialog books={books} onCreate={() => {}} onCancel={onCancel} />
    );
    unmount();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe("NewQuestDialog modal-body scrolling", () => {
  it("modal-body has overflow-y auto inline style", () => {
    const { container } = render(
      <NewQuestDialog books={books} onCreate={() => {}} onCancel={() => {}} />
    );
    const body = container.querySelector(".modal-body");
    expect(body.style.overflowY).toBe("auto");
  });
});
