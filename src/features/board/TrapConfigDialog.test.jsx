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

  it("Save calls onSave({ springMessage, removeAfterSpring, applyToAll }) with current values", () => {
    const onSave = vi.fn();
    const { getByText } = render(
      <TrapConfigDialog initialSpringMessage="hit" initialRemoveAfterSpring={false} onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({ springMessage: "hit", removeAfterSpring: false, applyToAll: false });
  });

  it("editing textarea then Save sends updated springMessage", () => {
    const onSave = vi.fn();
    const { getByLabelText, getByText } = render(
      <TrapConfigDialog initialSpringMessage="" initialRemoveAfterSpring={true} onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.change(getByLabelText(/spring effect message/i), { target: { value: "updated note" } });
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({ springMessage: "updated note", removeAfterSpring: true, applyToAll: false });
  });

  it("toggling checkbox then Save sends updated removeAfterSpring", () => {
    const onSave = vi.fn();
    const { getByLabelText, getByText } = render(
      <TrapConfigDialog initialSpringMessage="" initialRemoveAfterSpring={true} onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.click(getByLabelText(/remove from board after spring/i));
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({ springMessage: "", removeAfterSpring: false, applyToAll: false });
  });

  it("when trapTypeLabel='Pit Trap', checkbox 'Apply to all Pit Trap traps in this quest' renders unchecked by default", () => {
    const { getByLabelText } = render(
      <TrapConfigDialog initialSpringMessage="" initialRemoveAfterSpring={true} trapTypeLabel="Pit Trap" onSave={() => {}} onCancel={() => {}} />
    );
    expect(getByLabelText(/apply to all pit trap traps in this quest/i).checked).toBe(false);
  });

  it("when trapTypeLabel is undefined, apply-to-all checkbox does not render", () => {
    const { queryByLabelText } = render(
      <TrapConfigDialog initialSpringMessage="" initialRemoveAfterSpring={true} onSave={() => {}} onCancel={() => {}} />
    );
    expect(queryByLabelText(/apply to all/i)).toBeNull();
  });

  it("checking apply-to-all checkbox then clicking Save calls onSave with applyToAll: true", () => {
    const onSave = vi.fn();
    const { getByLabelText, getByText } = render(
      <TrapConfigDialog initialSpringMessage="" initialRemoveAfterSpring={true} trapTypeLabel="Pit Trap" onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.click(getByLabelText(/apply to all pit trap traps in this quest/i));
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({ springMessage: "", removeAfterSpring: true, applyToAll: true });
  });

  it("leaving apply-to-all unchecked → applyToAll: false in onSave payload", () => {
    const onSave = vi.fn();
    const { getByText } = render(
      <TrapConfigDialog initialSpringMessage="" initialRemoveAfterSpring={true} trapTypeLabel="Pit Trap" onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({ springMessage: "", removeAfterSpring: true, applyToAll: false });
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
