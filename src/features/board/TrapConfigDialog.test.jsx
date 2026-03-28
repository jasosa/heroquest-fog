// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { TrapConfigDialog } from "./TrapConfigDialog.jsx";

afterEach(() => cleanup());

describe("TrapConfigDialog", () => {
  it("renders a textarea with the initialTrapNote value", () => {
    const { getByRole } = render(
      <TrapConfigDialog initialTrapNote="a note" onSave={() => {}} onCancel={() => {}} />
    );
    expect(getByRole("textbox").value).toBe("a note");
  });

  it("Save calls onSave(trapNote) with current value", () => {
    const onSave = vi.fn();
    const { getByText } = render(
      <TrapConfigDialog initialTrapNote="spear note" onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledWith("spear note");
  });

  it("editing textarea then clicking Save calls onSave with updated value", () => {
    const onSave = vi.fn();
    const { getByRole, getByText } = render(
      <TrapConfigDialog initialTrapNote="" onSave={onSave} onCancel={() => {}} />
    );
    fireEvent.change(getByRole("textbox"), { target: { value: "updated note" } });
    fireEvent.click(getByText("Save"));
    expect(onSave).toHaveBeenCalledWith("updated note");
  });

  it("Cancel calls onCancel and does NOT call onSave", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { getByText } = render(
      <TrapConfigDialog initialTrapNote="x" onSave={onSave} onCancel={onCancel} />
    );
    fireEvent.click(getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("clicking backdrop calls onCancel", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <TrapConfigDialog initialTrapNote="" onSave={() => {}} onCancel={onCancel} />
    );
    fireEvent.mouseDown(container.firstChild);
    expect(onCancel).toHaveBeenCalled();
  });
});
