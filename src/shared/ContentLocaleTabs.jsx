import { T, FONT_BODY } from "./theme.js";

// Shared 3-pill "Original | EN | ES" control for switching the quest-content
// locale being viewed/edited — used in Sidebar (play + edit) and
// EditQuestBookDialog. See docs/architecture/data-model.md (translations)
// and CLAUDE.md's i18n conventions (FEAT-040's useI18n()/t() pattern).
//
// This is distinct from the app-chrome EN/ES language switcher (which flips
// useI18n().locale, changing UI copy) — this control instead switches which
// DM-authored quest text (Original vs a translation) is being shown/edited.
// en/es pill labels are DOM lowercase ("en"/"es"), visually uppercased via
// CSS text-transform — this deliberately keeps their DOM text distinct from
// the app-chrome EN/ES language switcher's literal "EN"/"ES" text nodes
// (Sidebar/QuestLibrary render both controls in the same tree), so the two
// switchers stay independently and unambiguously queryable while looking
// visually identical.
const PILLS = [
  { value: "original", labelKey: "contentLocale.original" },
  { value: "en", label: "en", hasContentKey: "hasEnContent", languageKey: "languageNameEn" },
  { value: "es", label: "es", hasContentKey: "hasEsContent", languageKey: "languageNameEs" },
];

function captionKey(mode, value) {
  if (mode === "edit") return value === "original" ? "contentLocale.editingOriginal" : "contentLocale.editingTranslation";
  return value === "original" ? "contentLocale.showingOriginal" : "contentLocale.showingTranslation";
}

export function ContentLocaleTabs({ value, onChange, mode, hasEnContent, hasEsContent, t }) {
  const hasContent = { hasEnContent, hasEsContent };
  const language = value === "en" ? t("contentLocale.languageNameEn") : value === "es" ? t("contentLocale.languageNameEs") : null;
  const caption = t(captionKey(mode, value), language ? { language } : undefined);

  return (
    <div>
      <div className="btn-group w-100" role="group" aria-label={t("library.contentLocaleSwitcherLabel")}>
        {PILLS.map(pill => (
          <button
            key={pill.value}
            type="button"
            onClick={() => onChange(pill.value)}
            className={`btn btn-hq-dark${value === pill.value ? " active" : ""}`}
            style={{ flex: 1, padding: "5px 0", fontSize: 10, letterSpacing: 1, position: "relative" }}
          >
            <span style={pill.value === "original" ? undefined : { textTransform: "uppercase" }}>
              {pill.value === "original" ? t(pill.labelKey) : pill.label}
            </span>
            {pill.hasContentKey && hasContent[pill.hasContentKey] && (
              <span
                data-testid="content-locale-dot"
                aria-hidden="true"
                style={{
                  display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                  background: T.accentGold, marginLeft: 4, verticalAlign: "middle",
                }}
              />
            )}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: T.sidebarTextMuted, marginTop: 3, fontFamily: FONT_BODY, fontStyle: "italic" }}>
        {caption}
      </div>
    </div>
  );
}
