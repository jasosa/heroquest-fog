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
  function handleCreateBook() {
    if (!newBookTitle.trim()) return;
    const book = createQuestBook(newBookTitle.trim(), newBookDesc.trim());
    setBooks(prev => [...prev, book]);
    setNewBookTitle(""); setNewBookDesc(""); setShowNewBook(false);
  }

  function handleDeleteBook(id) {
    if (!window.confirm("Delete this book and all its quests?")) return;
    deleteQuestBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    setQuests(prev => prev.filter(q => q.questBookId !== id));
    if (selectedBookId === id) setSelectedBookId(null);
  }

  function handleSaveEditBook(title, description) {
    updateQuestBook(editingBook.id, { title, description });
    setBooks(prev => prev.map(b => b.id === editingBook.id ? { ...b, title, description } : b));
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

  const isNew = selectedQuest
    ? Date.now() - selectedQuest.createdAt < 7 * 24 * 3600 * 1000
    : false;

  const selectedQuestBookName = selectedQuest
    ? books.find(b => b.id === selectedQuest.questBookId)?.title ?? null
    : null;

  return (
    <div className="d-flex vh-100 overflow-hidden" style={{ background: T.pageBg, fontFamily: FONT_BODY, color: T.text }}>
      {editingBook && (
        <EditQuestBookDialog
          initialTitle={editingBook.title}
          initialDescription={editingBook.description}
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
        width: 220, flexShrink: 0,
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
              <div className="d-flex gap-1">
                <button onClick={handleCreateBook} className="btn btn-hq-dark active flex-grow-1" style={{ fontSize: 10 }}>
                  Create
                </button>
                <button
                  onClick={() => { setShowNewBook(false); setNewBookTitle(""); setNewBookDesc(""); }}
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

      {/* ── Right main — Showcase layout ────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: T.pageBg,
      }}>

        {/* Top bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px 8px 24px",
          borderBottom: `1px solid ${T.sidebarDivider}`,
          flexShrink: 0,
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
          <div>
            {!showNewQuest && (
              <button onClick={() => setShowNewQuest(true)} className="btn btn-hq-light active">
                ＋ New Quest
              </button>
            )}
          </div>
        </div>

        {/* New quest form (below top bar) */}
        {showNewQuest && (
          <div style={{ padding: "12px 24px", flexShrink: 0, borderBottom: `1px solid ${T.sidebarDivider}` }}>
            <div style={{
              background: T.panelBg, border: `1px solid ${T.panelBorder}`,
              maxWidth: 480, padding: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: "bold", color: T.sidebarTitle, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
                New Quest
              </div>
              <div style={{ marginBottom: 8 }}>
                <input
                  placeholder="Quest title"
                  value={newQuestTitle}
                  onChange={e => setNewQuestTitle(e.target.value)}
                  className="form-control form-control-sm"
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <textarea
                  placeholder="Description (optional)"
                  value={newQuestDesc}
                  onChange={e => setNewQuestDesc(e.target.value)}
                  rows={3}
                  className="form-control form-control-sm"
                  style={{ resize: "vertical" }}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <select
                  value={newQuestBookId ?? ""}
                  onChange={e => setNewQuestBookId(e.target.value || null)}
                  className="form-select form-select-sm"
                >
                  <option value="">— No book —</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="number"
                  placeholder="Quest number (optional)"
                  value={newQuestNumber}
                  onChange={e => setNewQuestNumber(e.target.value)}
                  min={0}
                  className="form-control form-control-sm"
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCreateQuest} className="btn btn-hq-light active">
                  Create &amp; Edit
                </button>
                <button
                  onClick={() => { setShowNewQuest(false); setNewQuestTitle(""); setNewQuestDesc(""); setNewQuestBookId(null); setNewQuestNumber(""); }}
                  className="btn btn-hq-light"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Showcase panel + thumbnail strip */}
        {visibleQuests.length === 0 ? (
          <div
            data-testid="showcase-empty"
            style={{ color: T.sidebarTextFaint, fontSize: 14, letterSpacing: 2, textAlign: "center", marginTop: 60, fontFamily: FONT_BODY }}
          >
            No quests yet. Create one to get started.
          </div>
        ) : (
          <>
            {/* Showcase panel */}
            <div
              data-testid="showcase-panel"
              style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden" }}
            >
              {/* Left detail column */}
              <div
                data-testid="showcase-detail"
                style={{
                  width: "40%",
                  background: "#1a1408",
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  overflow: "hidden",
                }}
              >
                <h2
                  data-testid="showcase-title"
                  style={{
                    margin: 0,
                    fontFamily: FONT_HEADING,
                    fontSize: "clamp(16px, 2.5vw, 26px)",
                    color: T.sidebarTitle,
                    fontWeight: "normal",
                    overflowWrap: "break-word",
                  }}
                >
                  {selectedQuest.title}
                </h2>

                {/* Meta line */}
                <div style={{ fontSize: 12, color: T.sidebarTextMuted, fontFamily: FONT_BODY, fontStyle: "italic" }}>
                  {selectedQuestBookName && <span>{selectedQuestBookName}</span>}
                  {selectedQuest.questNumber != null && (
                    <span>{selectedQuestBookName ? " · " : ""}Quest #{selectedQuest.questNumber}</span>
                  )}
                </div>

                {/* Description */}
                <div style={{
                  fontSize: 14, fontFamily: FONT_BODY, color: T.sidebarText,
                  lineHeight: 1.7, overflowY: "auto", maxHeight: "calc(100% - 200px)",
                }}>
                  {selectedQuest.description
                    ? selectedQuest.description
                    : <span style={{ color: T.sidebarTextFaint, fontStyle: "italic" }}>No description.</span>
                  }
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
                  <button
                    data-testid="action-play"
                    onClick={() => onPlay(selectedQuest)}
                    style={{
                      minHeight: 44,
                      background: T.accent,
                      border: `1px solid ${T.accentGold}`,
                      color: "#fff",
                      fontFamily: FONT_HEADING,
                      fontSize: 12,
                      padding: "8px 16px",
                      cursor: "pointer",
                    }}
                  >
                    ⚔ Play
                  </button>
                  <button
                    data-testid="action-edit"
                    onClick={() => onEdit(selectedQuest)}
                    style={{
                      minHeight: 44,
                      background: T.sidebarBtnBg,
                      border: `1px solid ${T.sidebarBtnBorder}`,
                      color: T.sidebarBtnText,
                      fontFamily: FONT_HEADING,
                      fontSize: 12,
                      padding: "8px 16px",
                      cursor: "pointer",
                    }}
                  >
                    ✎ Edit
                  </button>
                  <button
                    data-testid="action-delete"
                    onClick={() => handleDeleteQuest(selectedQuest.id)}
                    style={{
                      minHeight: 44,
                      background: T.sidebarBtnBg,
                      border: `1px solid ${T.sidebarBtnBorder}`,
                      color: T.accent,
                      fontFamily: FONT_HEADING,
                      fontSize: 12,
                      padding: "8px 16px",
                      cursor: "pointer",
                    }}
                  >
                    × Delete
                  </button>
                  <button
                    data-testid="action-export"
                    onClick={() => handleExportQuest(selectedQuest)}
                    style={{
                      minHeight: 44,
                      background: T.sidebarBtnBg,
                      border: `1px solid ${T.sidebarBtnBorder}`,
                      color: T.sidebarBtnText,
                      fontFamily: FONT_HEADING,
                      fontSize: 11,
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                  >
                    ⬇ Export
                  </button>
                  <button
                    data-testid="action-assign"
                    onClick={() => setAssigningQuest(selectedQuest)}
                    style={{
                      minHeight: 44,
                      background: T.sidebarBtnBg,
                      border: `1px solid ${T.sidebarBtnBorder}`,
                      color: T.sidebarBtnText,
                      fontFamily: FONT_HEADING,
                      fontSize: 11,
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                  >
                    ☰ Assign Book
                  </button>
                </div>
              </div>

              {/* Right artwork column */}
              <div style={{
                flex: 1,
                position: "relative",
                background: "#0d0b07",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
              }}>
                <div style={{ fontSize: 64, color: T.accentGold, opacity: 0.2 }}>⚔</div>
                <div style={{ fontSize: 12, color: T.sidebarTextFaint, fontFamily: FONT_BODY, opacity: 0.5 }}>
                  No artwork
                </div>
                {/* Vignette overlay */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at center, transparent 40%, #00000088 100%)",
                  pointerEvents: "none",
                }} />
              </div>

              {/* "New" ribbon badge */}
              {isNew && (
                <div
                  data-testid="new-badge"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 80,
                    height: 80,
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{
                    position: "absolute",
                    top: 18,
                    right: -22,
                    width: 100,
                    padding: "3px 0",
                    background: T.accentGold,
                    color: "#12100e",
                    fontFamily: FONT_HEADING,
                    fontSize: 9,
                    textAlign: "center",
                    transform: "rotate(45deg)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}>
                    New
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            <div style={{
              height: 110,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 8px",
              background: "#0d0b07",
              borderTop: `1px solid ${T.sidebarDivider}`,
            }}>
              {/* Prev button */}
              <button
                data-testid="nav-prev"
                onClick={handlePrev}
                disabled={visibleQuests.length <= 1}
                style={{
                  width: 32,
                  height: 80,
                  background: T.sidebarBtnBg,
                  border: `1px solid ${T.sidebarBtnBorder}`,
                  color: T.sidebarTitle,
                  fontSize: 16,
                  cursor: visibleQuests.length <= 1 ? "default" : "pointer",
                  opacity: visibleQuests.length <= 1 ? 0.3 : 1,
                  flexShrink: 0,
                }}
              >
                ◀
              </button>

              {/* Scrollable thumbs row */}
              <div style={{
                flex: 1,
                display: "flex",
                gap: 8,
                overflowX: "auto",
                scrollbarWidth: "none",
                alignItems: "center",
              }}>
                {visibleQuests.map(quest => {
                  const isActive = quest.id === selectedQuest?.id;
                  return (
                    <button
                      key={quest.id}
                      data-testid={`thumb-${quest.id}`}
                      ref={el => { thumbRefs.current[quest.id] = el; }}
                      onClick={() => setSelectedQuestId(quest.id)}
                      style={{
                        width: 120,
                        height: 80,
                        flexShrink: 0,
                        background: "#1a1408",
                        border: isActive
                          ? `2px solid ${T.accentGold}`
                          : `1px solid ${T.sidebarPanelBorder}`,
                        boxShadow: isActive ? `0 0 8px ${T.accentGold}44` : "none",
                        color: T.sidebarText,
                        fontFamily: FONT_HEADING,
                        fontSize: 10,
                        padding: "6px 8px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {quest.title}
                    </button>
                  );
                })}
              </div>

              {/* Next button */}
              <button
                data-testid="nav-next"
                onClick={handleNext}
                disabled={visibleQuests.length <= 1}
                style={{
                  width: 32,
                  height: 80,
                  background: T.sidebarBtnBg,
                  border: `1px solid ${T.sidebarBtnBorder}`,
                  color: T.sidebarTitle,
                  fontSize: 16,
                  cursor: visibleQuests.length <= 1 ? "default" : "pointer",
                  opacity: visibleQuests.length <= 1 ? 0.3 : 1,
                  flexShrink: 0,
                }}
              >
                ▶
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
