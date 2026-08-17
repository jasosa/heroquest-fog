// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { ContentLocaleTabs } from "./ContentLocaleTabs.jsx";
import enDict from "./i18n/en.json";
import { t as translate } from "./i18n/t.js";

afterEach(cleanup);

const t = (key, vars) => translate(enDict, key, vars);

const defaultProps = {
  value: "original",
  onChange: () => {},
  mode: "edit",
  hasEnContent: false,
  hasEsContent: false,
  t,
};

describe("ContentLocaleTabs — pills", () => {
  it("renders three pills: Original, EN, ES", () => {
    const { getByText } = render(<ContentLocaleTabs {...defaultProps} />);
    expect(getByText("Original")).toBeTruthy();
    expect(getByText("en")).toBeTruthy();
    expect(getByText("es")).toBeTruthy();
  });

  it("fires onChange with 'en' when the EN pill is clicked", () => {
    const onChange = vi.fn();
    const { getByText } = render(<ContentLocaleTabs {...defaultProps} onChange={onChange} />);
    fireEvent.click(getByText("en"));
    expect(onChange).toHaveBeenCalledWith("en");
  });

  it("fires onChange with 'es' when the ES pill is clicked", () => {
    const onChange = vi.fn();
    const { getByText } = render(<ContentLocaleTabs {...defaultProps} onChange={onChange} />);
    fireEvent.click(getByText("es"));
    expect(onChange).toHaveBeenCalledWith("es");
  });

  it("fires onChange with 'original' when the Original pill is clicked", () => {
    const onChange = vi.fn();
    const { getByText } = render(<ContentLocaleTabs {...defaultProps} value="en" onChange={onChange} />);
    fireEvent.click(getByText("Original"));
    expect(onChange).toHaveBeenCalledWith("original");
  });

  it("pills are clickable in read mode too", () => {
    const onChange = vi.fn();
    const { getByText } = render(<ContentLocaleTabs {...defaultProps} mode="read" onChange={onChange} />);
    fireEvent.click(getByText("en"));
    expect(onChange).toHaveBeenCalledWith("en");
  });
});

describe("ContentLocaleTabs — content-indicator dots", () => {
  it("shows no dot markup content for EN/ES when hasEnContent/hasEsContent are false", () => {
    const { container } = render(<ContentLocaleTabs {...defaultProps} hasEnContent={false} hasEsContent={false} />);
    expect(container.querySelectorAll("[data-testid='content-locale-dot']").length).toBe(0);
  });

  it("shows a dot on the EN pill when hasEnContent is true", () => {
    const { container } = render(<ContentLocaleTabs {...defaultProps} hasEnContent={true} />);
    const dots = container.querySelectorAll("[data-testid='content-locale-dot']");
    expect(dots.length).toBe(1);
  });

  it("shows dots on both EN and ES pills when both have content", () => {
    const { container } = render(<ContentLocaleTabs {...defaultProps} hasEnContent={true} hasEsContent={true} />);
    const dots = container.querySelectorAll("[data-testid='content-locale-dot']");
    expect(dots.length).toBe(2);
  });
});

describe("ContentLocaleTabs — caption text", () => {
  it("shows 'Editing: Original text' when mode=edit, value=original", () => {
    const { getByText } = render(<ContentLocaleTabs {...defaultProps} mode="edit" value="original" />);
    expect(getByText("Editing: Original text")).toBeTruthy();
  });

  it("shows 'Editing: English translation' when mode=edit, value=en", () => {
    const { getByText } = render(<ContentLocaleTabs {...defaultProps} mode="edit" value="en" />);
    expect(getByText("Editing: English translation")).toBeTruthy();
  });

  it("shows 'Editing: Spanish translation' when mode=edit, value=es", () => {
    const { getByText } = render(<ContentLocaleTabs {...defaultProps} mode="edit" value="es" />);
    expect(getByText("Editing: Spanish translation")).toBeTruthy();
  });

  it("shows 'Showing: Original text' when mode=read, value=original", () => {
    const { getByText } = render(<ContentLocaleTabs {...defaultProps} mode="read" value="original" />);
    expect(getByText("Showing: Original text")).toBeTruthy();
  });

  it("shows 'Showing: Spanish translation' when mode=read, value=es", () => {
    const { getByText } = render(<ContentLocaleTabs {...defaultProps} mode="read" value="es" />);
    expect(getByText("Showing: Spanish translation")).toBeTruthy();
  });
});
