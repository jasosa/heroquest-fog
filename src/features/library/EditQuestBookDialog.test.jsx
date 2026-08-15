// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { EditQuestBookDialog } from "./EditQuestBookDialog.jsx";
afterEach(cleanup);

describe("EditQuestBookDialog cover image", () => {
  it("shows existing cover image preview when initialCoverImage provided", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" initialCoverImage="data:image/png;base64,abc" onSave={() => {}} onCancel={() => {}} />
    );
    expect(container.querySelector('img[alt="Cover image preview"]')).toBeTruthy();
  });

  it("Remove button clears preview", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" initialCoverImage="data:image/png;base64,abc" onSave={() => {}} onCancel={() => {}} />
    );
    fireEvent.click(container.querySelector('[aria-label="Remove cover image"]'));
    expect(container.querySelector('img[alt="Cover image preview"]')).toBeNull();
  });

  it("onSave receives null coverImage after removal", () => {
    const onSave = vi.fn();
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" initialDescription="" initialCoverImage="data:image/png;base64,abc" onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.click(container.querySelector('[aria-label="Remove cover image"]'));
    fireEvent.click(container.querySelector('button.btn-hq-light.active'));
    expect(onSave).toHaveBeenCalledWith("T", "", null);
  });

  it("live region announces Image removed when Remove clicked", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" initialCoverImage="data:image/png;base64,abc" onSave={() => {}} onCancel={() => {}} />
    );
    fireEvent.click(container.querySelector('[aria-label="Remove cover image"]'));
    expect(container.querySelector('[aria-live="polite"]').textContent).toContain("Image removed");
  });

  it("shows size warning for file over 512KB", async () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    // Mock FileReader to call onload synchronously
    const mockResult = "data:image/png;base64,MOCK";
    const OriginalFileReader = globalThis.FileReader;
    globalThis.FileReader = class {
      readAsDataURL() { this.onload({ target: { result: mockResult } }); }
    };
    const bigFile = new File([new ArrayBuffer(600 * 1024)], "big.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(container.textContent).toContain("Large images may slow the app");
    globalThis.FileReader = OriginalFileReader;
  });

  it("does not show size warning for file at or below 512KB", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
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

  it("Remove button has aria-label", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" initialCoverImage="data:image/png;base64,abc" onSave={() => {}} onCancel={() => {}} />
    );
    const btn = container.querySelector('[aria-label="Remove cover image"]');
    expect(btn).toBeTruthy();
    expect(btn.tagName).toBe("BUTTON");
  });

  it("label is associated to file input via htmlFor", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    const label = container.querySelector('label[for="edit-book-cover-input"]');
    const input = container.querySelector('#edit-book-cover-input');
    expect(label).toBeTruthy();
    expect(input).toBeTruthy();
  });

  it("empty state renders upload prompt and helper text", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    expect(container.textContent).toContain("Click to upload cover image");
    expect(container.textContent).toContain("PNG/JPG, under 512KB recommended");
  });

  it("file input stays type=file, visually hidden but focusable", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    const input = container.querySelector('#edit-book-cover-input');
    expect(input.type).toBe("file");
    expect(input.style.display).not.toBe("none");
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it("filled state renders preview inside dropzone label and keeps Remove button outside the label", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" initialCoverImage="data:image/png;base64,abc" onSave={() => {}} onCancel={() => {}} />
    );
    const label = container.querySelector('label[for="edit-book-cover-input"]');
    const img = label.querySelector('img[alt="Cover image preview"]');
    expect(img).toBeTruthy();
    expect(container.textContent).toContain("Replace image");
    const removeBtn = container.querySelector('[aria-label="Remove cover image"]');
    expect(removeBtn).toBeTruthy();
    expect(removeBtn.closest('label[for="edit-book-cover-input"]')).toBeNull();
  });

  it("dropzone label has the hq-upload-dropzone styling hook", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    const label = container.querySelector('label[for="edit-book-cover-input"]');
    expect(label.classList.contains("hq-upload-dropzone")).toBe(true);
  });
});

describe("EditQuestBookDialog layout", () => {
  it("dialog is 420px wide", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    const dialog = container.querySelector(".modal-dialog");
    expect(dialog.style.width).toBe("420px");
  });

  it("modal body scrolls with a max height", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    const body = container.querySelector(".modal-body");
    expect(body.style.overflowY).toBe("auto");
    expect(body.style.maxHeight).toBe("60vh");
  });

  it("pressing Escape calls onCancel", () => {
    const onCancel = vi.fn();
    render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={onCancel} />
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("EditQuestBookDialog description label", () => {
  it("renders a visible label for the description field", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    const label = container.querySelector('label[for="edit-book-description-input"]');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain("Description");
  });

  it("description input is associated to label via id", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    expect(container.querySelector('#edit-book-description-input')).toBeTruthy();
  });
});
