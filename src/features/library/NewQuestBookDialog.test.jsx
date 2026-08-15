// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { NewQuestBookDialog } from "./NewQuestBookDialog.jsx";
afterEach(cleanup);

describe("NewQuestBookDialog skeleton", () => {
  it("renders header 'New Quest Book' and a title input, Create disabled until title typed", () => {
    const { container, getByPlaceholderText, getByText } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const heading = container.querySelector("h6.modal-title");
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe("New Quest Book");

    const titleInput = getByPlaceholderText("Book title");
    expect(titleInput).toBeTruthy();

    const createBtn = getByText("Create");
    expect(createBtn.disabled).toBe(true);

    fireEvent.change(titleInput, { target: { value: "My Book" } });
    expect(createBtn.disabled).toBe(false);
  });
});

describe("NewQuestBookDialog create", () => {
  it("clicking Create calls onCreate with trimmed title, trimmed description, and null coverImage by default", () => {
    const onCreate = vi.fn();
    const { getByPlaceholderText, getByText } = render(
      <NewQuestBookDialog onCreate={onCreate} onCancel={() => {}} />
    );
    fireEvent.change(getByPlaceholderText("Book title"), { target: { value: "  My Book  " } });
    fireEvent.click(getByText("Create"));
    expect(onCreate).toHaveBeenCalledWith("My Book", "", null);
  });

  it("pressing Enter in the title field triggers Create", () => {
    const onCreate = vi.fn();
    const { getByPlaceholderText } = render(
      <NewQuestBookDialog onCreate={onCreate} onCancel={() => {}} />
    );
    const titleInput = getByPlaceholderText("Book title");
    fireEvent.change(titleInput, { target: { value: "Enter Book" } });
    fireEvent.keyDown(titleInput, { key: "Enter" });
    expect(onCreate).toHaveBeenCalledWith("Enter Book", "", null);
  });
});

describe("NewQuestBookDialog cover image", () => {
  it("empty state renders upload prompt and helper text", () => {
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    expect(container.textContent).toContain("Click to upload cover image");
    expect(container.textContent).toContain("PNG/JPG, under 512KB recommended");
  });

  it("label is associated to file input via htmlFor", () => {
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const label = container.querySelector('label[for="new-book-cover-input"]');
    const input = container.querySelector('#new-book-cover-input');
    expect(label).toBeTruthy();
    expect(input).toBeTruthy();
  });

  it("dropzone label has the hq-upload-dropzone styling hook", () => {
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const label = container.querySelector('label[for="new-book-cover-input"]');
    expect(label.classList.contains("hq-upload-dropzone")).toBe(true);
  });

  it("filled state renders preview inside dropzone label and keeps Remove button outside the label", () => {
    const OriginalFileReader = globalThis.FileReader;
    globalThis.FileReader = class {
      readAsDataURL() { this.onload({ target: { result: "data:image/png;base64,abc" } }); }
    };
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const file = new File([new ArrayBuffer(100)], "cover.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    globalThis.FileReader = OriginalFileReader;

    const label = container.querySelector('label[for="new-book-cover-input"]');
    const img = label.querySelector('img[alt="Cover image preview"]');
    expect(img).toBeTruthy();
    expect(container.textContent).toContain("Replace image");
    const removeBtn = container.querySelector('[aria-label="Remove cover image"]');
    expect(removeBtn).toBeTruthy();
    expect(removeBtn.closest('label[for="new-book-cover-input"]')).toBeNull();
  });

  it("Remove button clears preview and has aria-label", () => {
    const OriginalFileReader = globalThis.FileReader;
    globalThis.FileReader = class {
      readAsDataURL() { this.onload({ target: { result: "data:image/png;base64,abc" } }); }
    };
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const file = new File([new ArrayBuffer(100)], "cover.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    globalThis.FileReader = OriginalFileReader;

    const removeBtn = container.querySelector('[aria-label="Remove cover image"]');
    expect(removeBtn.tagName).toBe("BUTTON");
    fireEvent.click(removeBtn);
    expect(container.querySelector('img[alt="Cover image preview"]')).toBeNull();
  });

  it("onCreate receives null coverImage after removal", () => {
    const OriginalFileReader = globalThis.FileReader;
    globalThis.FileReader = class {
      readAsDataURL() { this.onload({ target: { result: "data:image/png;base64,abc" } }); }
    };
    const onCreate = vi.fn();
    const { container, getByPlaceholderText, getByText } = render(
      <NewQuestBookDialog onCreate={onCreate} onCancel={() => {}} />
    );
    const file = new File([new ArrayBuffer(100)], "cover.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    globalThis.FileReader = OriginalFileReader;
    fireEvent.click(container.querySelector('[aria-label="Remove cover image"]'));
    fireEvent.change(getByPlaceholderText("Book title"), { target: { value: "T" } });
    fireEvent.click(getByText("Create"));
    expect(onCreate).toHaveBeenCalledWith("T", "", null);
  });

  it("live region announces Image selected / Image removed", () => {
    const OriginalFileReader = globalThis.FileReader;
    globalThis.FileReader = class {
      readAsDataURL() { this.onload({ target: { result: "data:image/png;base64,abc" } }); }
    };
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const file = new File([new ArrayBuffer(100)], "cover.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    expect(container.querySelector('[aria-live="polite"]').textContent).toContain("Image selected");
    fireEvent.click(container.querySelector('[aria-label="Remove cover image"]'));
    expect(container.querySelector('[aria-live="polite"]').textContent).toContain("Image removed");
    globalThis.FileReader = OriginalFileReader;
  });

  it("shows size warning for file over 512KB", () => {
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const OriginalFileReader = globalThis.FileReader;
    globalThis.FileReader = class {
      readAsDataURL() { this.onload({ target: { result: "data:image/png;base64,MOCK" } }); }
    };
    const bigFile = new File([new ArrayBuffer(600 * 1024)], "big.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [bigFile] } });
    expect(container.textContent).toContain("Large images may slow the app");
    globalThis.FileReader = OriginalFileReader;
  });

  it("does not show size warning for file at or below 512KB", () => {
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const OriginalFileReader = globalThis.FileReader;
    globalThis.FileReader = class {
      readAsDataURL() { this.onload({ target: { result: "data:image/png;base64,X" } }); }
    };
    const smallFile = new File([new ArrayBuffer(100 * 1024)], "small.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [smallFile] } });
    expect(container.textContent).not.toContain("Large images may slow the app");
    globalThis.FileReader = OriginalFileReader;
  });

  it("file input stays type=file, visually hidden but focusable", () => {
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const input = container.querySelector('#new-book-cover-input');
    expect(input.type).toBe("file");
    expect(input.style.display).not.toBe("none");
    input.focus();
    expect(document.activeElement).toBe(input);
  });
});

describe("NewQuestBookDialog description label", () => {
  it("renders a visible label for the description field with helper caption", () => {
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const label = container.querySelector('label[for="new-book-description-input"]');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain("Description");
    expect(container.querySelector('#new-book-description-input')).toBeTruthy();
    expect(container.textContent).toContain("Shown in the quest book showcase");
  });

  it("onCreate receives the typed description text", () => {
    const onCreate = vi.fn();
    const { container, getByPlaceholderText, getByText } = render(
      <NewQuestBookDialog onCreate={onCreate} onCancel={() => {}} />
    );
    fireEvent.change(getByPlaceholderText("Book title"), { target: { value: "T" } });
    fireEvent.change(container.querySelector('#new-book-description-input'), { target: { value: "A cool book" } });
    fireEvent.click(getByText("Create"));
    expect(onCreate).toHaveBeenCalledWith("T", "A cool book", null);
  });
});

describe("NewQuestBookDialog layout", () => {
  it("dialog is 420px wide", () => {
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const dialog = container.querySelector(".modal-dialog");
    expect(dialog.style.width).toBe("420px");
  });

  it("modal body scrolls with a max height", () => {
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={() => {}} />
    );
    const body = container.querySelector(".modal-body");
    expect(body.style.overflowY).toBe("auto");
    expect(body.style.maxHeight).toBe("60vh");
  });

  it("pressing Escape calls onCancel", () => {
    const onCancel = vi.fn();
    render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={onCancel} />
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("after unmount, a further Escape keydown does not call onCancel again", () => {
    const onCancel = vi.fn();
    const { unmount } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={onCancel} />
    );
    unmount();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe("NewQuestBookDialog dismissal", () => {
  it("mousedown on the backdrop itself calls onCancel", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={onCancel} />
    );
    fireEvent.mouseDown(container.querySelector(".hq-modal-backdrop"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("mousedown on .modal-content does not call onCancel", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={onCancel} />
    );
    fireEvent.mouseDown(container.querySelector(".modal-content"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("clicking the header close button calls onCancel", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <NewQuestBookDialog onCreate={() => {}} onCancel={onCancel} />
    );
    fireEvent.click(container.querySelector(".btn-close"));
    expect(onCancel).toHaveBeenCalled();
  });
});
