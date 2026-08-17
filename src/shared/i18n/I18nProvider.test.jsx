// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { I18nProvider } from "./I18nProvider.jsx";
import { useI18n } from "./useI18n.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function setNavigatorLanguage(value) {
  const originalValue = window.navigator.language;
  Object.defineProperty(window.navigator, "language", { value, configurable: true });
  return () => {
    Object.defineProperty(window.navigator, "language", { value: originalValue, configurable: true });
  };
}

function Consumer() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="text">{t("common.cancel")}</span>
      <button onClick={() => setLocale("es")}>go-es</button>
      <button onClick={() => setLocale("en")}>go-en</button>
    </div>
  );
}

describe("useI18n — no provider in tree", () => {
  it("falls back to English with a harmless no-op setLocale", () => {
    const { getByTestId, getByText } = render(<Consumer />);
    expect(getByTestId("locale").textContent).toBe("en");
    expect(getByTestId("text").textContent).toBe("Cancel");
    expect(() => fireEvent.click(getByText("go-es"))).not.toThrow();
  });
});

describe("I18nProvider — first-load detection", () => {
  it('detects "es" locale from navigator.language when hq_locale is absent', () => {
    const restore = setNavigatorLanguage("es-ES");
    const { getByTestId } = render(
      <I18nProvider><Consumer /></I18nProvider>
    );
    expect(getByTestId("locale").textContent).toBe("es");
    restore();
  });

  it('defaults to "en" when navigator.language is not Spanish', () => {
    const restore = setNavigatorLanguage("fr-FR");
    const { getByTestId } = render(
      <I18nProvider><Consumer /></I18nProvider>
    );
    expect(getByTestId("locale").textContent).toBe("en");
    restore();
  });

  it("stored value wins over navigator.language when both present", () => {
    localStorage.setItem("hq_locale", "en");
    const restore = setNavigatorLanguage("es-ES");
    const { getByTestId } = render(
      <I18nProvider><Consumer /></I18nProvider>
    );
    expect(getByTestId("locale").textContent).toBe("en");
    restore();
  });
});

describe("I18nProvider — setLocale", () => {
  it("updates state, persists to localStorage, and re-renders consumer with new text", () => {
    const { getByTestId, getByText } = render(
      <I18nProvider><Consumer /></I18nProvider>
    );
    expect(getByTestId("text").textContent).toBe("Cancel");
    fireEvent.click(getByText("go-es"));
    expect(getByTestId("locale").textContent).toBe("es");
    expect(getByTestId("text").textContent).toBe("Cancelar");
    expect(localStorage.getItem("hq_locale")).toBe("es");
  });
});

describe("I18nProvider — localStorage failures", () => {
  it("never crashes when localStorage.getItem throws, falls back to in-memory English", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error("boom"); };
    let result;
    expect(() => {
      result = render(<I18nProvider><Consumer /></I18nProvider>);
    }).not.toThrow();
    expect(result.getByTestId("locale").textContent).toBe("en");
    Storage.prototype.getItem = original;
  });

  it("never crashes when localStorage.setItem throws", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("boom"); };
    const { getByText, getByTestId } = render(
      <I18nProvider><Consumer /></I18nProvider>
    );
    expect(() => fireEvent.click(getByText("go-es"))).not.toThrow();
    expect(getByTestId("locale").textContent).toBe("es");
    Storage.prototype.setItem = original;
  });
});
