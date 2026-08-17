import { describe, it, expect } from "vitest";
import { resolveText, hasTranslationContent, setTranslationField } from "./questText.js";

describe("resolveText", () => {
  it("falls back to the Original field when no translations exist at all", () => {
    const entity = { title: "Original Title" };
    expect(resolveText(entity, "title", "en")).toBe("Original Title");
  });

  it("falls back to the Original field when translations exist for a different locale only", () => {
    const entity = { title: "Original Title", translations: { es: { title: "Título ES" } } };
    expect(resolveText(entity, "title", "en")).toBe("Original Title");
  });

  it("returns the translated value when present for the requested locale/field", () => {
    const entity = { title: "Original Title", translations: { es: { title: "Título ES" } } };
    expect(resolveText(entity, "title", "es")).toBe("Título ES");
  });

  it("falls back to Original when locale is 'original'", () => {
    const entity = { title: "Original Title", translations: { es: { title: "Título ES" } } };
    expect(resolveText(entity, "title", "original")).toBe("Original Title");
  });

  it("does NOT treat an empty-string translation as missing — the resolver itself has no empty-check; write-time omission (setTranslationField) is what guarantees fallback", () => {
    const entity = { title: "Original Title", translations: { es: { title: "" } } };
    expect(resolveText(entity, "title", "es")).toBe("");
  });
});

describe("hasTranslationContent", () => {
  it("returns false when translations is undefined", () => {
    expect(hasTranslationContent(undefined, "en")).toBe(false);
  });

  it("returns false when translations is an empty object", () => {
    expect(hasTranslationContent({}, "en")).toBe(false);
  });

  it("returns false when the locale has an empty object with no non-empty fields", () => {
    expect(hasTranslationContent({ en: {} }, "en")).toBe(false);
  });

  it("returns false when the locale's fields are all empty strings", () => {
    expect(hasTranslationContent({ en: { title: "", description: "" } }, "en")).toBe(false);
  });

  it("returns true when any field for the locale is a non-empty string", () => {
    expect(hasTranslationContent({ en: { title: "Hello" } }, "en")).toBe(true);
  });

  it("returns false for a different locale even if the requested one has content", () => {
    expect(hasTranslationContent({ en: { title: "Hello" } }, "es")).toBe(false);
  });
});

describe("setTranslationField", () => {
  it("sets a field on an empty translations object", () => {
    const result = setTranslationField({}, "en", "title", "Hello");
    expect(result).toEqual({ en: { title: "Hello" } });
  });

  it("does not mutate the input object (immutable)", () => {
    const input = {};
    setTranslationField(input, "en", "title", "Hello");
    expect(input).toEqual({});
  });

  it("preserves sibling fields on the same locale", () => {
    const input = { en: { title: "Hello" } };
    const result = setTranslationField(input, "en", "description", "World");
    expect(result).toEqual({ en: { title: "Hello", description: "World" } });
  });

  it("preserves other-locale data untouched", () => {
    const input = { es: { title: "Hola" } };
    const result = setTranslationField(input, "en", "title", "Hello");
    expect(result).toEqual({ es: { title: "Hola" }, en: { title: "Hello" } });
  });

  it("omits (deletes) the key when value is an empty string, rather than storing an empty string", () => {
    const input = { en: { title: "Hello" } };
    const result = setTranslationField(input, "en", "title", "");
    expect(result).toEqual({ en: {} });
    expect(Object.prototype.hasOwnProperty.call(result.en, "title")).toBe(false);
  });

  it("leaves sibling fields intact when omitting one field via empty string", () => {
    const input = { en: { title: "Hello", description: "World" } };
    const result = setTranslationField(input, "en", "title", "");
    expect(result).toEqual({ en: { description: "World" } });
  });

  it("handles omitting a field for a locale that has no existing entry (no-op-ish, produces empty locale object)", () => {
    const result = setTranslationField({}, "en", "title", "");
    expect(result).toEqual({ en: {} });
  });
});
