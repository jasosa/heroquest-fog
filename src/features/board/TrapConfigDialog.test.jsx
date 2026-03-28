// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { TrapConfigDialog } from "./TrapConfigDialog.jsx";

afterEach(() => cleanup());

describe("TrapConfigDialog", () => {
  it("renders textarea labelled 'Spring effect message' pre-filled from initialSpringMessage", () => {
    const { getByLabelText } = render(
      <TrapConfigDialog initialSpringMessage="Loses 1 BP" initialRemoveAfterSpring={true} onSave={() => {}} onCancel={() => {}} />
    );
    expect(getByLabelText(/spring effect message/i).value).toBe("Loses 1 BP");
  });

  it("renders checkbox labelled 'Remove from board after spring' checked by default when initialRemoveAfterSpring is undefined", () => {
    const { getByLabelText } = render(
      <TrapConfigDialog initialSpringMessage="" onSave={() => {}} onCancel={() => {}} />
    );
    expect(getByLabelText(/remove from board after spring/i).checked).toBe(true);
  });

  it("Save calls onSave({ springMessage, removeAfterSpring }) with current values", () => {
    const onSave = vi.fn();
    const { getByText } = render(
      <TrapConfigDialog initialSpringMessage="hit" initialRemoveAfterSpring={false} onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({ springMessage: "hit", removeAfterSpring: false });
  });

  it("editing textarea then Save sends updated springMessage", () => {
    const onSave = vi.fn();
    const { getByLabelText, getByText } = render(
      <TrapConfigDialog initialSpringMessage="" initialRemoveAfterSpring={true} onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.change(getByLabelText(/spring effect message/i), { target: { value: "updated note" } });
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({ springMessage: "updated note", removeAfterSpring: true });
  });

  it("toggling checkbox then Save sends updated removeAfterSpring", () => {
    const onSave = vi.fn();
    const { getByLabelText, getByText } = render(
      <TrapConfigDialog initialSpringMessage="" initialRemoveAfterSpring={true} onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.click(getByLabelText(/remove from board after spring/i));
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({ springMessage: "", removeAfterSpring: false });
  });

  it("Cancel calls onCancel, does NOT call onSave", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { getByText } = render(
      <TrapConfigDialog initialSpringMessage="x" initialRemoveAfterSpring={true} onSave={onSave} onCancel={onCancel} />
    );
    fireEvent.click(getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("Backdrop click calls onCancel", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <TrapConfigDialog initialSpringMessage="" initialRemoveAfterSpring={true} onSave={() => {}} onCancel={onCancel} />
    );
    fireEvent.mouseDown(container.firstChild);
    expect(onCancel).toHaveBeenCalled();
  });
});
