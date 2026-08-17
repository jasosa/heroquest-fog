import { render } from "@testing-library/react";
import { I18nProvider } from "../shared/i18n/I18nProvider.jsx";

// Test helper used only by the three migrated components' locale-switching
// tests. Seeds localStorage with the requested locale before mounting the
// provider, so the component renders with a deterministic starting locale.
export function renderWithI18n(ui, { locale } = {}) {
  if (locale) localStorage.setItem("hq_locale", locale);
  return render(<I18nProvider>{ui}</I18nProvider>);
}
