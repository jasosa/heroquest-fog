import { useState, useRef, useEffect } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";
import { useI18n } from "../../shared/i18n/useI18n.js";
import { ContentLocaleTabs } from "../../shared/ContentLocaleTabs.jsx";
import { hasTranslationContent, setTranslationField } from "../../shared/questText.js";

// NOTE: this file has zero pre-existing useI18n()/t() usage (a gap predating
// FEAT-040, out of scope to fix broadly here) — t() below is used ONLY for
// the new translation-editing strings/ContentLocaleTabs, not for this
// dialog's other pre-existing hardcoded English copy ("Edit Quest Book",
// "Book title", "Save", "Cancel", etc.), which stays untouched.
export function EditQuestBookDialog({ initialTitle, initialDescription = "", initialCoverImage = null, initialTranslations = {}, onSave, onCancel }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [coverImage, setCoverImage] = useState(initialCoverImage ?? null);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const fileInputRef = useRef(null);

  // FEAT-041: quest-book content translations. editTarget mirrors
  // useGameState's contentLocale, always starting at "original" — this
  // dialog manages its own local state rather than going through
  // useGameState, since quest-book editing isn't part of a game session.
  const [translations, setTranslations] = useState(() => initialTranslations ?? {});
  const [editTarget, setEditTarget] = useState("original");

  const displayedTitle = editTarget === "original" ? title : (translations[editTarget]?.title ?? "");
  const displayedDescription = editTarget === "original" ? description : (translations[editTarget]?.description ?? "");

  function handleTitleChange(value) {
    if (editTarget === "original") setTitle(value);
    else setTranslations(prev => setTranslationField(prev, editTarget, "title", value));
  }

  function handleDescriptionChange(value) {
    if (editTarget === "original") setDescription(value);
    else setTranslations(prev => setTranslationField(prev, editTarget, "description", value));
  }

  const translationLanguage = editTarget === "en"
    ? t("contentLocale.languageNameEn")
    : editTarget === "es"
      ? t("contentLocale.languageNameEs")
      : null;
  function translationAwarePlaceholder(defaultPlaceholder) {
    if (!translationLanguage) return defaultPlaceholder;
    return t("contentLocale.noTranslationYetPlaceholder", { language: translationLanguage });
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSizeWarning(file.size > 512 * 1024);
    const reader = new FileReader();
    reader.onload = ev => {
      setCoverImage(ev.target.result);
      setAnnouncement("Image selected");
    };
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    setCoverImage(null);
    setSizeWarning(false);
    setAnnouncement("Image removed");
    fileInputRef.current?.focus();
  }

  function handleSave() {
    // Disabled-state check (below) and this guard both look at the ORIGINAL
    // title specifically — a DM shouldn't be blocked from saving because a
    // translation tab happens to be empty.
    if (!title.trim()) return;
    // The translations argument is only appended when there's actual
    // translation content — keeps the call shape unchanged (3 args) for the
    // common case of a DM who never touches the EN/ES tabs, so existing
    // onSave consumers that don't expect a 4th argument are unaffected.
    const hasAnyTranslations = hasTranslationContent(translations, "en") || hasTranslationContent(translations, "es");
    if (hasAnyTranslations) onSave(title.trim(), description.trim(), coverImage, translations);
    else onSave(title.trim(), description.trim(), coverImage);
  }

  return (
    <div
      className="hq-modal-backdrop"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 420 }}>
        <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.accentGold}` }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
            <h6 className="modal-title m-0" style={{ color: T.sidebarTitle, letterSpacing: 2, textTransform: "uppercase", fontFamily: FONT_HEADING, fontSize: 13 }}>
              Edit Quest Book
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel} />
          </div>
          <div className="modal-body px-3 py-3 d-flex flex-column gap-2" style={{ overflowY: "auto", maxHeight: "60vh" }}>
            <ContentLocaleTabs
              value={editTarget}
              onChange={setEditTarget}
              mode="edit"
              hasEnContent={hasTranslationContent(translations, "en")}
              hasEsContent={hasTranslationContent(translations, "es")}
              t={t}
            />
            <input
              placeholder={translationAwarePlaceholder("Book title")}
              value={displayedTitle}
              onChange={e => handleTitleChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              className="form-control form-control-sm hq-input-dark"
              autoFocus
            />
            <div>
              <label
                htmlFor="edit-book-description-input"
                style={{ fontSize: 11, color: T.sidebarTextMuted, display: "block", marginBottom: 4 }}
              >
                Description
              </label>
              <input
                id="edit-book-description-input"
                placeholder={translationAwarePlaceholder("Optional")}
                value={displayedDescription}
                onChange={e => handleDescriptionChange(e.target.value)}
                className="form-control form-control-sm hq-input-dark"
              />
              <div style={{ fontSize: 10, color: T.sidebarTextMuted, marginTop: 3, opacity: 0.8 }}>
                Shown in the quest book showcase
              </div>
            </div>
            {/* Cover image */}
            <div>
              <label
                htmlFor="edit-book-cover-input"
                className="hq-upload-dropzone"
              >
                {coverImage ? (
                  <>
                    <img
                      src={coverImage}
                      alt="Cover image preview"
                      style={{ width: 40, height: 40, objectFit: "cover", border: `1px solid ${T.sidebarBtnBorder}`, borderRadius: 2 }}
                    />
                    <span style={{ fontSize: 11, color: T.sidebarTextMuted }}>Replace image</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true" style={{ fontSize: 22 }}>📤</span>
                    <span style={{ fontSize: 12, color: T.sidebarTextMuted }}>Click to upload cover image</span>
                    <span style={{ fontSize: 10, color: T.sidebarTextMuted, opacity: 0.8 }}>PNG/JPG, under 512KB recommended</span>
                  </>
                )}
              </label>
              {coverImage && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                  <button
                    type="button"
                    aria-label="Remove cover image"
                    onClick={handleRemove}
                    style={{
                      background: T.sidebarBtnBg, border: `1px solid ${T.sidebarBtnBorder}`,
                      color: T.accent, fontSize: 11, padding: "4px 10px",
                      minHeight: 32, minWidth: 44, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    × Remove
                  </button>
                </div>
              )}
              <input
                id="edit-book-cover-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
              />
              {sizeWarning && (
                <div role="alert" style={{ fontSize: 10, color: T.accent, marginTop: 4 }}>
                  Large images may slow the app.
                </div>
              )}
            </div>
            {/* sr-only live region */}
            <span aria-live="polite" className="visually-hidden">{announcement}</span>
          </div>
          <div className="modal-footer py-2 px-3 gap-2" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="btn btn-hq-light active flex-grow-1"
              style={{ fontSize: 11 }}
            >
              Save
            </button>
            <button onClick={onCancel} className="btn btn-hq-light flex-grow-1" style={{ fontSize: 11 }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
