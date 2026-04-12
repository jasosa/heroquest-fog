import { useState, useRef } from "react";
import { T, FONT_HEADING } from "../../shared/theme.js";

export function EditQuestBookDialog({ initialTitle, initialDescription = "", initialCoverImage = null, onSave, onCancel }) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [coverImage, setCoverImage] = useState(initialCoverImage ?? null);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const fileInputRef = useRef(null);

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
    if (!title.trim()) return;
    onSave(title.trim(), description.trim(), coverImage);
  }

  return (
    <div
      className="hq-modal-backdrop"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 320 }}>
        <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.accentGold}` }}>
          <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
            <h6 className="modal-title m-0" style={{ color: T.sidebarTitle, letterSpacing: 2, textTransform: "uppercase", fontFamily: FONT_HEADING, fontSize: 13 }}>
              Edit Quest Book
            </h6>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel} />
          </div>
          <div className="modal-body px-3 py-3 d-flex flex-column gap-2">
            <input
              placeholder="Book title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              className="form-control form-control-sm hq-input-dark"
              autoFocus
            />
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-control form-control-sm hq-input-dark"
            />
            {/* Cover image */}
            <div>
              <label
                htmlFor="edit-book-cover-input"
                style={{ fontSize: 11, color: T.sidebarTextMuted, display: "block", marginBottom: 4 }}
              >
                {coverImage ? "Replace image" : "Cover image (optional)"}
              </label>
              {coverImage && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <img
                    src={coverImage}
                    alt="Cover image preview"
                    style={{ width: 40, height: 40, objectFit: "cover", border: `1px solid ${T.sidebarBtnBorder}`, borderRadius: 2 }}
                  />
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
                className="form-control form-control-sm hq-input-dark"
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
