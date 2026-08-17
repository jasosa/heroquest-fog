import { useState, useEffect, useMemo, useCallback } from "react";
import { LocaleContext } from "./LocaleContext.js";
import { t } from "./t.js";
import { resolveInitialLocale, readStoredLocale, writeStoredLocale } from "./localeDetection.js";
import enDict from "./en.json";
import esDict from "./es.json";

const DICTS = { en: enDict, es: esDict };

export function I18nProvider({ children }) {
  // Lazy init — pure read, no write side effect. Safe under StrictMode's
  // double-invoke since resolveInitialLocale() never writes to localStorage.
  const [locale, setLocaleState] = useState(() => resolveInitialLocale());

  // Persist the resolved default exactly once on first mount, without
  // fighting StrictMode (StrictMode double-invokes effects too, but the
  // guard below makes the second invocation a no-op).
  useEffect(() => {
    if (readStoredLocale() == null) writeStoredLocale(locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback(next => {
    setLocaleState(next);
    writeStoredLocale(next);
  }, []);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key, vars) => t(DICTS[locale] ?? enDict, key, vars),
  }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}
