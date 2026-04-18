import { useState, useRef, useEffect } from "react";
import { T, FONT_TITLE, FONT_HEADING, FONT_BODY } from "../../shared/theme.js";
import {
  loadQuestBooks,
  loadQuests,
  createQuestBook,
  updateQuestBook,
  deleteQuestBook,
  createQuest,
  deleteQuest,
  persistQuest,
  exportQuestAsJson,
  importQuestFromJson,
  migrateQuests,
} from "../../shared/questStorage.js";
import { sortQuests } from "../../shared/questSort.js";
import { EditQuestBookDialog } from "./EditQuestBookDialog.jsx";
import { AssignQuestBookDialog } from "./AssignQuestBookDialog.jsx";
import { assignQuestToBook } from "./assignQuestBook.js";

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function QuestLibrary({ onPlay, onEdit, onCalibrate }) {
  const [books, setBooks]           = useState(() => loadQuestBooks());
  const [quests, setQuests]         = useState(() => loadQuests());
  const [selectedBookId, setSelectedBookId] = useState(null);

  useEffect(() => { migrateQuests(); }, []);

  const importInputRef = useRef(null);
  const thumbRefs = useRef({});
  const [importError, setImportError] = useState("");

  const [editingBook, setEditingBook]   = useState(null);
  const [assigningQuest, setAssigningQuest] = useState(null);

  const [showNewBook, setShowNewBook]   = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookDesc, setNewBookDesc]   = useState("");
  const [newBookCoverImage, setNewBookCoverImage] = useState(null);
  const [newBookSizeWarning, setNewBookSizeWarning] = useState(false);
  const newBookFileInputRef = useRef(null);

  const [showNewQuest, setShowNewQuest]     = useState(false);
  const [newQuestTitle, setNewQuestTitle]   = useState("");
  const [newQuestDesc, setNewQuestDesc]     = useState("");
  const [newQuestBookId, setNewQuestBookId] = useState(null);
  const [newQuestNumber, setNewQuestNumber] = useState("");

  const filteredQuests = selectedBookId === null
    ? quests
    : quests.filter(q => q.questBookId === selectedBookId);
  const visibleQuests = sortQuests(filteredQuests, books);

  // ── Showcase selection state ───────────────────────────────────────────────
  const [selectedQuestId, setSelectedQuestId] = useState(() => visibleQuests[0]?.id ?? null);

  const selectedQuestIndex = visibleQuests.findIndex(q => q.id === selectedQuestId);
  const selectedQuest = selectedQuestIndex >= 0 ? visibleQuests[selectedQuestIndex] : visibleQuests[0] ?? null;

  function handlePrev() {
    if (!visibleQuests.length) return;
    const n = visibleQuests.length;
    const idx = selectedQuestIndex >= 0 ? selectedQuestIndex : 0;
    setSelectedQuestId(visibleQuests[(idx - 1 + n) % n].id);
  }

  function handleNext() {
    if (!visibleQuests.length) return;
    const n = visibleQuests.length;
    const idx = selectedQuestIndex >= 0 ? selectedQuestIndex : 0;
    setSelectedQuestId(visibleQuests[(idx + 1) % n].id);
  }

  // Reset selection when book filter changes
  useEffect(() => {
    setSelectedQuestId(visibleQuests[0]?.id ?? null);
  }, [selectedBookId]); // NOT visibleQuests — would infinite loop

  // Keyboard nav — guard against text input focus
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedQuestId, selectedBookId]); // re-register when deps change

  // Scroll active thumb into view
  useEffect(() => {
    if (!selectedQuestId) return;
    const el = thumbRefs.current[selectedQuestId];
    if (el && typeof el.scrollIntoView === "function") {
      try { el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); } catch {}
    }
  }, [selectedQuestId]);

  function bookQuestCount(bookId) {
    return quests.filter(q => q.questBookId === bookId).length;
  }

  // ── Book actions ────────────────────────────────────────────────────────────
  function handleNewBookImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewBookSizeWarning(file.size > 512 * 1024);
    const reader = new FileReader();
    reader.onload = ev => setNewBookCoverImage(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleCreateBook() {
    if (!newBookTitle.trim()) return;
    const book = createQuestBook(newBookTitle.trim(), newBookDesc.trim(), newBookCoverImage);
    setBooks(prev => [...prev, book]);
    setNewBookTitle(""); setNewBookDesc(""); setNewBookCoverImage(null);
    setNewBookSizeWarning(false); setShowNewBook(false);
  }

  function handleDeleteBook(id) {
    if (!window.confirm("Delete this book and all its quests?")) return;
    deleteQuestBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    setQuests(prev => prev.filter(q => q.questBookId !== id));
    if (selectedBookId === id) setSelectedBookId(null);
  }

  function handleSaveEditBook(title, description, coverImage) {
    updateQuestBook(editingBook.id, { title, description, coverImage });
    setBooks(prev => prev.map(b => b.id === editingBook.id ? { ...b, title, description, coverImage } : b));
    setEditingBook(null);
  }

  function handleSaveAssignment(questBookId, questNumber) {
    const updated = assignQuestToBook(assigningQuest, questBookId, questNumber);
    const saved = persistQuest(updated);
    setQuests(prev => prev.map(q => q.id === saved.id ? saved : q));
    setAssigningQuest(null);
  }

  // ── Quest actions ───────────────────────────────────────────────────────────
  function handleCreateQuest() {
    if (!newQuestTitle.trim()) return;
    const quest = createQuest({
      title: newQuestTitle.trim(),
      description: newQuestDesc.trim(),
      questBookId: newQuestBookId,
      questNumber: newQuestNumber === "" ? null : Number(newQuestNumber),
    });
    setQuests(prev => [...prev, quest]);
    setNewQuestTitle(""); setNewQuestDesc(""); setNewQuestBookId(null); setNewQuestNumber("");
    setShowNewQuest(false);
    onEdit(quest);
  }

  function handleDeleteQuest(id) {
    if (!window.confirm("Delete this quest?")) return;
    deleteQuest(id);
    setQuests(prev => {
      const next = prev.filter(q => q.id !== id);
      const nextVisible = sortQuests(
        selectedBookId === null ? next : next.filter(q => q.questBookId === selectedBookId),
        books
      );
      const deletedIdx = visibleQuests.findIndex(q => q.id === id);
      const newSelected = nextVisible[Math.min(deletedIdx, nextVisible.length - 1)]?.id ?? null;
      setSelectedQuestId(newSelected);
      return next;
    });
  }

  // ── Export / Import ─────────────────────────────────────────────────────────
  function handleExportQuest(quest) {
    const json = exportQuestAsJson(quest);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${quest.title.replace(/\s+/g, "_")}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const quest = importQuestFromJson(ev.target.result, selectedBookId);
        setQuests(prev => [...prev, quest]);
        setImportError("");
      } catch (err) {
        setImportError(err.message ?? "Failed to import quest.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const selectedBookName = selectedBookId === null
    ? "All Quests"
    : books.find(b => b.id === selectedBookId)?.title ?? "";

  const selectedQuestBook = selectedQuest
    ? books.find(b => b.id === selectedQuest.questBookId) ?? null
    : null;

  // Panel background: use filter book when one is selected, else fall back to selected quest's book
  const filterBook = selectedBookId ? books.find(b => b.id === selectedBookId) ?? null : null;
  const panelBook  = filterBook ?? selectedQuestBook;

  return (
    <div className="d-flex vh-100 overflow-hidden" style={{ background: T.pageBg, fontFamily: FONT_BODY, color: T.text }}>
      {editingBook && (
        <EditQuestBookDialog
          initialTitle={editingBook.title}
          initialDescription={editingBook.description}
          initialCoverImage={editingBook.coverImage ?? null}
          onSave={handleSaveEditBook}
          onCancel={() => setEditingBook(null)}
        />
      )}
      {assigningQuest && (
        <AssignQuestBookDialog
          quest={assigningQuest}
          books={books}
          onSave={handleSaveAssignment}
          onCancel={() => setAssigningQuest(null)}
        />
      )}

      {/* ── Left sidebar — Quest Books ───────────────────────────────────────── */}
      <nav className="hq-sidebar d-flex flex-column overflow-y-auto" style={{
        width: "clamp(280px, 22vw, 420px)", flexShrink: 0,
        background: T.sidebarBg,
        borderRight: `1px solid ${T.sidebarBorder}`,
        padding: "18px 12px",
        gap: 6,
      }}>
        <div style={{
          fontSize: 11, letterSpacing: 4, color: T.sidebarTitle,
          textTransform: "uppercase", textAlign: "center",
          fontFamily: FONT_HEADING,
          borderBottom: `1px solid ${T.sidebarDivider}`, paddingBottom: 12, marginBottom: 4,
          textShadow: `0 0 10px ${T.accentGold}55`,
        }}>
          Quest Books
        </div>

        {/* All Quests */}
        <button
          onClick={() => setSelectedBookId(null)}
          className={`btn btn-hq-dark w-100 text-start d-flex justify-content-between align-items-center${selectedBookId === null ? " active" : ""}`}
          style={{ fontWeight: selectedBookId === null ? "bold" : "normal" }}
        >
          <span>All Quests</span>
          <span style={{ fontSize: 10, opacity: 0.7 }}>({quests.length})</span>
        </button>

        {/* Book list */}
        {books.map(book => (
          <div key={book.id} className="d-flex align-items-center gap-1">
            <button
              onClick={() => setSelectedBookId(book.id)}
              className={`btn btn-hq-dark flex-grow-1 text-start d-flex justify-content-between align-items-center${selectedBookId === book.id ? " active" : ""}`}
              style={{ fontWeight: selectedBookId === book.id ? "bold" : "normal", overflow: "hidden" }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {book.title}
              </span>
              <span style={{ fontSize: 10, opacity: 0.7, flexShrink: 0 }}>
                ({bookQuestCount(book.id)})
              </span>
            </button>
            <button
              onClick={() => setEditingBook(book)}
              title="Edit book"
              className="btn btn-hq-dark"
              style={{ padding: "5px 7px", fontSize: 12, flexShrink: 0 }}
            >
              ✎
            </button>
            <button
              onClick={() => handleDeleteBook(book.id)}
              title="Delete book"
              className="btn btn-hq-dark"
              style={{ padding: "5px 7px", fontSize: 12, flexShrink: 0, color: T.accent }}
            >
              ×
            </button>
          </div>
        ))}

        {/* Bottom actions */}
        <div className="mt-auto pt-2" style={{ borderTop: `1px solid ${T.sidebarDivider}` }}>
          {onCalibrate && (
            <button
              onClick={onCalibrate}
              title="Open map calibration tool"
              className="btn btn-hq-dark w-100 mb-2"
              style={{ fontSize: 9, color: T.sidebarTextFaint }}
            >
              ⚙ Calibrate Maps
            </button>
          )}
          <input type="file" accept=".json" ref={importInputRef} className="d-none" onChange={handleImportFile} />
          <button
            onClick={() => { setImportError(""); importInputRef.current.click(); }}
            className="btn btn-hq-dark w-100 mb-2"
          >
            ⬆ Import Quest
          </button>
          {importError && (
            <div className="alert alert-danger py-1 px-2 mb-2" style={{ fontSize: 10 }}>
              {importError}
            </div>
          )}

          {showNewBook ? (
            <div className="d-flex flex-column gap-2">
              <input
                placeholder="Book title"
                value={newBookTitle}
                onChange={e => setNewBookTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateBook()}
                className="form-control form-control-sm hq-input-dark"
                autoFocus
              />
              <input
                placeholder="Description (optional)"
                value={newBookDesc}
                onChange={e => setNewBookDesc(e.target.value)}
                className="form-control form-control-sm hq-input-dark"
              />
              <div>
                <label
                  htmlFor="new-book-cover-input"
                  style={{ fontSize: 10, color: T.sidebarTextMuted, display: "block", marginBottom: 3 }}
                >
                  {newBookCoverImage ? "Replace image" : "Cover image (optional)"}
                </label>
                {newBookCoverImage && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <img
                      src={newBookCoverImage}
                      alt="Cover image preview"
                      style={{ width: 32, height: 32, objectFit: "cover",
                        border: `1px solid ${T.sidebarBtnBorder}`, borderRadius: 2 }}
                    />
                    <button
                      type="button"
                      aria-label="Remove cover image"
                      onClick={() => { setNewBookCoverImage(null); setNewBookSizeWarning(false); newBookFileInputRef.current?.focus(); }}
                      style={{ background: T.sidebarBtnBg, border: `1px solid ${T.sidebarBtnBorder}`,
                        color: T.accent, fontSize: 10, padding: "3px 8px",
                        minHeight: 32, minWidth: 44, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      × Remove
                    </button>
                  </div>
                )}
                <input
                  id="new-book-cover-input"
                  ref={newBookFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleNewBookImageChange}
                  className="form-control form-control-sm hq-input-dark"
                />
                {newBookSizeWarning && (
                  <div role="alert" style={{ fontSize: 10, color: T.accent, marginTop: 3 }}>
                    Large images may slow the app.
                  </div>
                )}
              </div>
              <div className="d-flex gap-1">
                <button onClick={handleCreateBook} className="btn btn-hq-dark active flex-grow-1" style={{ fontSize: 10 }}>
                  Create
                </button>
                <button
                  onClick={() => { setShowNewBook(false); setNewBookTitle(""); setNewBookDesc(""); setNewBookCoverImage(null); setNewBookSizeWarning(false); }}
                  className="btn btn-hq-dark flex-grow-1"
                  style={{ fontSize: 10 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewBook(true)} className="btn btn-hq-dark w-100 text-center">
              ＋ New Book
            </button>
          )}
        </div>
      </nav>

      {/* ── Right main — background + floating card grid ────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", background: T.pageBg }}>

        {/* Full-panel background layer */}
        {panelBook?.coverImage
          ? <>
              <img
                data-testid="showcase-cover-img"
                src={panelBook.coverImage}
                alt="Cover image preview"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, pointerEvents: "none", opacity: 0.7 }}
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
              <div style={{ position: "absolute", inset: 0, background: "rgba(6,4,2,0.68)", zIndex: 1, pointerEvents: "none" }} />
            </>
          : <div data-testid="showcase-placeholder" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 120, color: T.accentGold, opacity: 0.04 }}>⚔</div>
            </div>
        }

        {/* All interactive content sits above background */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px 8px 24px",
          borderBottom: `1px solid ${panelBook?.coverImage ? "rgba(80,55,15,0.5)" : T.sidebarDivider}`,
          flexShrink: 0,
          background: panelBook?.coverImage ? "rgba(8,5,2,0.55)" : "transparent",
        }}>
          <div>
            <h1
              data-testid="library-heading"
              style={{
                margin: 0, fontSize: 24, letterSpacing: 4, color: T.sidebarTitle,
                textTransform: "uppercase", fontWeight: "normal",
                fontFamily: FONT_TITLE, textShadow: "0 2px 8px #c4a87066",
              }}
            >
              HeroQuest — Quest Library
            </h1>
            <div style={{ marginTop: 4, fontSize: 12, color: T.textMuted, fontFamily: FONT_BODY, fontStyle: "italic" }}>
              {selectedBookName}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Sequential navigation */}
            <button
              data-testid="nav-prev"
              onClick={handlePrev}
              disabled={visibleQuests.length <= 1}
              style={{
                width: 30, height: 30, background: T.sidebarBtnBg,
                border: `1px solid ${T.sidebarBtnBorder}`, color: T.sidebarTitle,
                fontSize: 13, cursor: visibleQuests.length <= 1 ? "default" : "pointer",
                opacity: visibleQuests.length <= 1 ? 0.3 : 1, flexShrink: 0,
              }}
            >◀</button>
            <button
              data-testid="nav-next"
              onClick={handleNext}
              disabled={visibleQuests.length <= 1}
              style={{
                width: 30, height: 30, background: T.sidebarBtnBg,
                border: `1px solid ${T.sidebarBtnBorder}`, color: T.sidebarTitle,
                fontSize: 13, cursor: visibleQuests.length <= 1 ? "default" : "pointer",
                opacity: visibleQuests.length <= 1 ? 0.3 : 1, flexShrink: 0,
              }}
            >▶</button>
            {!showNewQuest && (
              <button onClick={() => setShowNewQuest(true)} className="btn btn-hq-light active">
                ＋ New Quest
              </button>
            )}
          </div>
        </div>

        {/* New quest form (below top bar) */}
        {showNewQuest && (
          <div style={{ padding: "12px 24px", flexShrink: 0, borderBottom: `1px solid ${panelBook?.coverImage ? "rgba(80,55,15,0.4)" : T.sidebarDivider}` }}>
            <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, maxWidth: 480, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: "bold", color: T.sidebarTitle, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>New Quest</div>
              <div style={{ marginBottom: 8 }}>
                <input placeholder="Quest title" value={newQuestTitle} onChange={e => setNewQuestTitle(e.target.value)} className="form-control form-control-sm" autoFocus />
              </div>
              <div style={{ marginBottom: 8 }}>
                <textarea placeholder="Description (optional)" value={newQuestDesc} onChange={e => setNewQuestDesc(e.target.value)} rows={3} className="form-control form-control-sm" style={{ resize: "vertical" }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <select value={newQuestBookId ?? ""} onChange={e => setNewQuestBookId(e.target.value || null)} className="form-select form-select-sm">
                  <option value="">— No book —</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <input type="number" placeholder="Quest number (optional)" value={newQuestNumber} onChange={e => setNewQuestNumber(e.target.value)} min={0} className="form-control form-control-sm" />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCreateQuest} className="btn btn-hq-light active">Create &amp; Edit</button>
                <button onClick={() => { setShowNewQuest(false); setNewQuestTitle(""); setNewQuestDesc(""); setNewQuestBookId(null); setNewQuestNumber(""); }} className="btn btn-hq-light">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Card grid or empty state */}
        {visibleQuests.length === 0 ? (
          <div
            data-testid="showcase-empty"
            style={{ color: T.sidebarTextFaint, fontSize: 14, letterSpacing: 2, textAlign: "center", marginTop: 60, fontFamily: FONT_BODY }}
          >
            No quests yet. Create one to get started.
          </div>
        ) : (
          <div
            data-testid="showcase-panel"
            style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
              alignContent: "start",
            }}>
              {visibleQuests.map(quest => {
                const isActive = quest.id === selectedQuestId;
                const thumbBook = books.find(b => b.id === quest.questBookId) ?? null;
                const thumbIsNew = quest.createdAt && Date.now() - quest.createdAt < 7 * 24 * 3600 * 1000;
                const hasBg = !!panelBook?.coverImage;
                return (
                  <div
                    key={quest.id}
                    data-testid={`thumb-${quest.id}`}
                    ref={el => { thumbRefs.current[quest.id] = el; }}
                    onClick={() => setSelectedQuestId(quest.id)}
                    style={{
                      background: hasBg ? "rgba(15,10,4,0.86)" : T.panelBg,
                      backdropFilter: hasBg ? "blur(6px)" : "none",
                      border: isActive
                        ? `2px solid ${T.accentGold}`
                        : `1px solid ${hasBg ? "rgba(120,85,25,0.35)" : T.sidebarPanelBorder}`,
                      boxShadow: isActive
                        ? `0 0 22px ${T.accentGold}44, 0 6px 28px rgba(0,0,0,0.85)`
                        : `0 4px 18px rgba(0,0,0,${hasBg ? "0.6" : "0.25"})`,
                      transform: isActive ? "translateY(-3px)" : "none",
                      transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
                      cursor: "pointer",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Inner content — gets showcase-detail testid only on the active card */}
                    <div
                      {...(isActive ? { "data-testid": "showcase-detail" } : {})}
                      style={{
                        background: isActive ? "#1a1408" : "transparent",
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        flex: 1,
                      }}
                    >
                      {/* Title row + badges */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div
                          {...(isActive ? { "data-testid": "showcase-title" } : {})}
                          style={{
                            fontFamily: FONT_HEADING,
                            fontSize: 13,
                            color: isActive ? T.accentGold : T.sidebarTitle,
                            lineHeight: 1.3,
                            flex: 1,
                            transition: "color 0.15s",
                          }}
                        >
                          {quest.title}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {quest.questNumber != null && (
                            <span style={{ background: T.accentGold, color: "#12100e", fontFamily: FONT_HEADING, fontSize: 8, padding: "2px 5px", letterSpacing: 1 }}>
                              #{quest.questNumber}
                            </span>
                          )}
                          {isActive && thumbIsNew && (
                            <span data-testid="new-badge" style={{ background: T.accentGold, color: "#12100e", fontFamily: FONT_HEADING, fontSize: 8, padding: "2px 5px", letterSpacing: 1, textTransform: "uppercase" }}>
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {quest.description
                        ? <div style={{ fontSize: 11, fontFamily: FONT_BODY, color: T.sidebarText, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                            {quest.description}
                          </div>
                        : <div style={{ fontSize: 11, fontFamily: FONT_BODY, color: T.sidebarTextFaint, fontStyle: "italic" }}>No description.</div>
                      }

                      {/* Book name */}
                      {thumbBook && (
                        <div style={{ fontSize: 10, color: T.sidebarTextMuted, fontFamily: FONT_BODY, fontStyle: "italic", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          {thumbBook.title}
                        </div>
                      )}

                      {/* Divider */}
                      <div style={{ borderTop: `1px solid ${isActive ? T.sidebarDivider : "rgba(80,55,15,0.25)"}`, paddingTop: 8, marginTop: "auto" }} />

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          data-testid="action-play"
                          onClick={e => { e.stopPropagation(); onPlay(quest); }}
                          style={{ minHeight: 34, background: T.accent, border: `1px solid ${T.accentGold}`, color: "#fff", fontFamily: FONT_HEADING, fontSize: 10, padding: "4px 12px", cursor: "pointer" }}
                        >⚔ Play</button>
                        <button
                          data-testid="action-edit"
                          onClick={e => { e.stopPropagation(); onEdit(quest); }}
                          style={{ minHeight: 34, background: T.sidebarBtnBg, border: `1px solid ${T.sidebarBtnBorder}`, color: T.sidebarBtnText, fontFamily: FONT_HEADING, fontSize: 10, padding: "4px 10px", cursor: "pointer" }}
                        >✎ Edit</button>
                        <button
                          data-testid="action-delete"
                          onClick={e => { e.stopPropagation(); handleDeleteQuest(quest.id); }}
                          style={{ minHeight: 34, background: T.sidebarBtnBg, border: `1px solid ${T.sidebarBtnBorder}`, color: T.accent, fontFamily: FONT_HEADING, fontSize: 10, padding: "4px 8px", cursor: "pointer" }}
                          title="Delete quest"
                        >× Delete</button>
                        <button
                          data-testid="action-export"
                          onClick={e => { e.stopPropagation(); handleExportQuest(quest); }}
                          style={{ minHeight: 34, background: T.sidebarBtnBg, border: `1px solid ${T.sidebarBtnBorder}`, color: T.sidebarBtnText, fontFamily: FONT_HEADING, fontSize: 10, padding: "4px 8px", cursor: "pointer" }}
                          title="Export quest as JSON"
                        >⬇</button>
                        <button
                          data-testid="action-assign"
                          onClick={e => { e.stopPropagation(); setAssigningQuest(quest); }}
                          style={{ minHeight: 34, background: T.sidebarBtnBg, border: `1px solid ${T.sidebarBtnBorder}`, color: T.sidebarBtnText, fontFamily: FONT_HEADING, fontSize: 10, padding: "4px 8px", cursor: "pointer" }}
                          title="Assign to quest book"
                        >☰</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        </div>{/* end zIndex:2 content wrapper */}
      </main>
    </div>
  );
}
