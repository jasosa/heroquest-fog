// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { EditQuestBookDialog } from "./EditQuestBookDialog.jsx";

afterEach(cleanup);

describe("EditQuestBookDialog — ContentLocaleTabs (FEAT-041)", () => {
  it("renders ContentLocaleTabs pills above the title input", () => {
    const { getByText, container } = render(
      <EditQuestBookDialog initialTitle="T" onSave={() => {}} onCancel={() => {}} />
    );
    const originalPill = getByText("Original");
    const titleInput = container.querySelector('input[placeholder="Book title"]');
    expect(originalPill).toBeTruthy();
    expect(titleInput).toBeTruthy();
    // Original pill precedes the title input in DOM order.
    expect(
      originalPill.compareDocumentPosition(titleInput) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("EN tab starts empty with a no-translation-yet placeholder", () => {
    const { getByText, container } = render(
      <EditQuestBookDialog initialTitle="Original Title" onSave={() => {}} onCancel={() => {}} />
    );
    fireEvent.click(getByText("en"));
    const titleInput = container.querySelector('.form-control.form-control-sm.hq-input-dark');
    expect(titleInput.value).toBe("");
    expect(titleInput.placeholder).toContain("English");
  });

  it("ES tab starts empty with a no-translation-yet placeholder", () => {
    const { getByText, container } = render(
      <EditQuestBookDialog initialTitle="Original Title" onSave={() => {}} onCancel={() => {}} />
    );
    fireEvent.click(getByText("es"));
    const titleInput = container.querySelector('.form-control.form-control-sm.hq-input-dark');
    expect(titleInput.value).toBe("");
    expect(titleInput.placeholder).toContain("Spanish");
  });

  it("non-destructive tab switching: EN input survives a round trip through ES and back", () => {
    const { getByText, container } = render(
      <EditQuestBookDialog initialTitle="Original Title" onSave={() => {}} onCancel={() => {}} />
    );
    const titleInput = () => container.querySelector('.form-control.form-control-sm.hq-input-dark');
    fireEvent.click(getByText("en"));
    fireEvent.change(titleInput(), { target: { value: "EN Book Title" } });
    fireEvent.click(getByText("es"));
    expect(titleInput().value).toBe("");
    fireEvent.change(titleInput(), { target: { value: "ES Book Title" } });
    fireEvent.click(getByText("en"));
    expect(titleInput().value).toBe("EN Book Title");
  });

  it("switching back to Original shows the untouched Original title", () => {
    const { getByText, container } = render(
      <EditQuestBookDialog initialTitle="Original Title" onSave={() => {}} onCancel={() => {}} />
    );
    const titleInput = () => container.querySelector('.form-control.form-control-sm.hq-input-dark');
    fireEvent.click(getByText("en"));
    fireEvent.change(titleInput(), { target: { value: "EN Book Title" } });
    fireEvent.click(getByText("Original"));
    expect(titleInput().value).toBe("Original Title");
  });

  it("onSave is called with a 4th translations argument reflecting edits across both locales", () => {
    const onSave = vi.fn();
    const { getByText, container } = render(
      <EditQuestBookDialog initialTitle="Original Title" onSave={onSave} onCancel={() => {}} />
    );
    const titleInput = () => container.querySelector('.form-control.form-control-sm.hq-input-dark');
    fireEvent.click(getByText("en"));
    fireEvent.change(titleInput(), { target: { value: "EN Book Title" } });
    fireEvent.click(getByText("es"));
    fireEvent.change(titleInput(), { target: { value: "ES Book Title" } });
    fireEvent.click(getByText("Original"));
    fireEvent.click(container.querySelector("button.btn-hq-light.active"));
    expect(onSave).toHaveBeenCalledWith(
      "Original Title", "", null,
      { en: { title: "EN Book Title" }, es: { title: "ES Book Title" } }
    );
  });

  it("Save button disabled state checks the Original title specifically, not whichever tab is active", () => {
    const { getByText, container } = render(
      <EditQuestBookDialog initialTitle="" onSave={() => {}} onCancel={() => {}} />
    );
    const titleInput = () => container.querySelector('.form-control.form-control-sm.hq-input-dark');
    fireEvent.click(getByText("en"));
    fireEvent.change(titleInput(), { target: { value: "EN Book Title" } });
    const saveBtn = container.querySelector("button.btn-hq-light.active");
    expect(saveBtn.disabled).toBe(true);
  });

  it("Save button is enabled once the Original title is non-empty, regardless of active tab", () => {
    const { getByText, container } = render(
      <EditQuestBookDialog initialTitle="Original Title" onSave={() => {}} onCancel={() => {}} />
    );
    fireEvent.click(getByText("en"));
    const saveBtn = container.querySelector("button.btn-hq-light.active");
    expect(saveBtn.disabled).toBe(false);
  });
});
