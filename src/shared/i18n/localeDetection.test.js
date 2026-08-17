// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import {
  detectBrowserLocale,
  readStoredLocale,
  writeStoredLocale,
  resolveInitialLocale,
  ALLOWED_LOCALES,
} from "./localeDetection.js";

afterEach(() => {
  localStorage.clear();
});

describe("ALLOWED_LOCALES", () => {
  it("exports the closed locale set [\"en\", \"es\"], reusable as the content-locale set", () => {
    expect(ALLOWED_LOCALES).toEqual(["en", "es"]);
  });
});

describe("detectBrowserLocale", () => {
  it('returns "es" for "es-ES"', () => {
    expect(detectBrowserLocale("es-ES")).toBe("es");
  });

  it('returns "es" for "es"', () => {
    expect(detectBrowserLocale("es")).toBe("es");
  });

  it("is case-insensitive", () => {
    expect(detectBrowserLocale("ES-mx")).toBe("es");
  });

  it('returns "en" for "en-US"', () => {
    expect(detectBrowserLocale("en-US")).toBe("en");
  });

  it('returns "en" for other languages (e.g. "fr-FR")', () => {
    expect(detectBrowserLocale("fr-FR")).toBe("en");
  });

  it('returns "en" for undefined', () => {
    expect(detectBrowserLocale(undefined)).toBe("en");
  });

  it('returns "en" for an empty string', () => {
    expect(detectBrowserLocale("")).toBe("en");
  });

  it('returns "en" for garbage input', () => {
    expect(detectBrowserLocale("!!!garbage###")).toBe("en");
  });
});

describe("readStoredLocale", () => {
  it("returns null when hq_locale is absent", () => {
    expect(readStoredLocale()).toBeNull();
  });

  it('returns "es" when hq_locale is "es"', () => {
    localStorage.setItem("hq_locale", "es");
    expect(readStoredLocale()).toBe("es");
  });

  it('returns "en" when hq_locale is "en"', () => {
    localStorage.setItem("hq_locale", "en");
    expect(readStoredLocale()).toBe("en");
  });

  it("returns null when hq_locale holds a value outside the allow-list", () => {
    localStorage.setItem("hq_locale", "fr");
    expect(readStoredLocale()).toBeNull();
  });

  it("never throws even if localStorage.getItem throws", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error("boom"); };
    expect(() => readStoredLocale()).not.toThrow();
    expect(readStoredLocale()).toBeNull();
    Storage.prototype.getItem = original;
  });
});

describe("writeStoredLocale", () => {
  it("writes hq_locale to localStorage", () => {
    writeStoredLocale("es");
    expect(localStorage.getItem("hq_locale")).toBe("es");
  });

  it("never throws even if localStorage.setItem throws", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("boom"); };
    expect(() => writeStoredLocale("en")).not.toThrow();
    Storage.prototype.setItem = original;
  });
});

describe("resolveInitialLocale", () => {
  it("returns the stored locale when present, ignoring navigator.language", () => {
    localStorage.setItem("hq_locale", "es");
    const originalValue = window.navigator.language;
    Object.defineProperty(window.navigator, "language", { value: "en-US", configurable: true });
    expect(resolveInitialLocale()).toBe("es");
    Object.defineProperty(window.navigator, "language", { value: originalValue, configurable: true });
  });

  it("falls back to detectBrowserLocale(navigator.language) when nothing stored", () => {
    const originalValue = window.navigator.language;
    Object.defineProperty(window.navigator, "language", { value: "es-MX", configurable: true });
    expect(resolveInitialLocale()).toBe("es");
    Object.defineProperty(window.navigator, "language", { value: originalValue, configurable: true });
  });

  it("does not write to localStorage as a side effect", () => {
    resolveInitialLocale();
    expect(localStorage.getItem("hq_locale")).toBeNull();
  });
});
