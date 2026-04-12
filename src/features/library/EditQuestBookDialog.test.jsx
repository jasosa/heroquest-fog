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
    const OriginalFileReader = global.FileReader;
    global.FileReader = class {
      readAsDataURL() { this.onload({ target: { result: mockResult } }); }
    };
    const bigFile = new File([new ArrayBuffer(600 * 1024)], "big.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(container.textContent).toContain("Large images may slow the app");
    global.FileReader = OriginalFileReader;
  });

  it("does not show size warning for file at or below 512KB", () => {
    const { container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    const OriginalFileReader = global.FileReader;
    global.FileReader = class {
      readAsDataURL() { this.onload({ target: { result: "data:image/png;base64,X" } }); }
    };
    const smallFile = new File([new ArrayBuffer(100 * 1024)], "small.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [smallFile] } });
    expect(container.textContent).not.toContain("Large images may slow the app");
    global.FileReader = OriginalFileReader;
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
});
