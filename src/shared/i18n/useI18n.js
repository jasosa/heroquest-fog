import { useContext } from "react";
import { LocaleContext } from "./LocaleContext.js";
import { t } from "./t.js";
import enDict from "./en.json";

// Required fallback: several existing tests render HeroQuestFog directly,
// bypassing App.jsx's <I18nProvider> mount point. Those trees have zero
// provider, so useI18n() must degrade gracefully to English + a no-op setter.
export function useI18n() {
  const ctx = useContext(LocaleContext);
  return ctx ?? {
    locale: "en",
    setLocale: () => {},
    t: (key, vars) => t(enDict, key, vars),
  };
}
