// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ChestConfigDialog } from "./ChestConfigDialog.jsx";

afterEach(() => cleanup());

describe("ChestConfigDialog", () => {
  it("shows unchecked checkbox and calls onSave(false, '') by default", () => {
    const onSave = vi.fn()
    const { getByText } = render(<ChestConfigDialog initialHasTrap={false} initialTrapNote="" onSave={onSave} onCancel={() => {}} />)
    fireEvent.click(getByText("Save"))
    expect(onSave).toHaveBeenCalledWith(false, "")
  });

  it("shows checked checkbox when initialHasTrap=true", () => {
    const { getByRole } = render(<ChestConfigDialog initialHasTrap={true} initialTrapNote="poison" onSave={() => {}} onCancel={() => {}} />)
    expect(getByRole("checkbox").checked).toBe(true)
  });

  it("calls onSave with updated values after editing", () => {
    const onSave = vi.fn()
    const { getByRole, getByText } = render(<ChestConfigDialog initialHasTrap={false} initialTrapNote="" onSave={onSave} onCancel={() => {}} />)
    fireEvent.click(getByRole("checkbox"))
    fireEvent.change(getByRole("textbox"), { target: { value: "poison dart" } })
    fireEvent.click(getByText("Save"))
    expect(onSave).toHaveBeenCalledWith(true, "poison dart")
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn()
    const { getByText } = render(<ChestConfigDialog initialHasTrap={false} initialTrapNote="" onSave={() => {}} onCancel={onCancel} />)
    fireEvent.click(getByText("Cancel"))
    expect(onCancel).toHaveBeenCalled()
  });
});
