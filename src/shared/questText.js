// Pure resolver helpers for DM-authored quest content translations
// (Quest.translations / QuestBook.translations — see docs/architecture/data-model.md).
//
// resolveText itself never treats an empty string as "missing" — it uses
// exact `??` semantics, so a stored empty-string translation is returned
// as-is rather than falling back to Original. The "empty means fall back"
// guarantee is enforced at WRITE time by setTranslationField, which omits
// (deletes) a field entirely when the incoming value is "".

export function resolveText(entity, field, locale) {
  return entity.translations?.[locale]?.[field] ?? entity[field];
}

export function hasTranslationContent(translations, locale) {
  const localeEntry = translations?.[locale];
  if (!localeEntry) return false;
  return Object.values(localeEntry).some(v => typeof v === "string" && v !== "");
}

export function setTranslationField(translations, locale, field, value) {
  const next = { ...translations };
  const localeEntry = { ...(next[locale] ?? {}) };
  if (value === "") {
    delete localeEntry[field];
  } else {
    localeEntry[field] = value;
  }
  next[locale] = localeEntry;
  return next;
}
