// Pure helpers isolating navigator/localStorage access from React.

const STORAGE_KEY = "hq_locale";
export const ALLOWED_LOCALES = ["en", "es"];

export function detectBrowserLocale(navigatorLanguage) {
  if (typeof navigatorLanguage !== "string" || navigatorLanguage.length === 0) return "en";
  return navigatorLanguage.toLowerCase().startsWith("es") ? "es" : "en";
}

export function readStoredLocale() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return ALLOWED_LOCALES.includes(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore — locale persistence is best-effort
  }
}

export function resolveInitialLocale() {
  const stored = readStoredLocale();
  if (stored !== null) return stored;
  return detectBrowserLocale(navigator.language);
}
