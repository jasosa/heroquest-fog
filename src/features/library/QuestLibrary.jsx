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
    setQuests(prev => prev.filter(q => q.id !== id));
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

      {/* ── Right main — Quest Cards ─────────────────────────────────────────── */}
      <main className="flex-grow-1 overflow-y-auto p-4">

        {/* Header */}
        <div className="mb-4">
          <h1 style={{
            margin: 0, fontSize: 24, letterSpacing: 4, color: T.sidebarTitle,
            textTransform: "uppercase", fontWeight: "normal",
            fontFamily: FONT_TITLE, textShadow: "0 2px 8px #c4a87066",
          }}>
            HeroQuest — Quest Library
          </h1>
          <div style={{ marginTop: 4, fontSize: 12, color: T.textMuted, letterSpacing: 2 }}>
            {selectedBookId === null
              ? "All Quests"
              : books.find(b => b.id === selectedBookId)?.title ?? ""}
          </div>
        </div>

        {/* New Quest button / form */}
        <div className="mb-4">
          {showNewQuest ? (
            <div className="p-3" style={{
              background: T.panelBg, border: `1px solid ${T.panelBorder}`,
              maxWidth: 480,
            }}>
              <div className="mb-2" style={{ fontSize: 12, fontWeight: "bold", color: T.title, letterSpacing: 2, textTransform: "uppercase" }}>
                New Quest
              </div>
              <div className="mb-2">
                <input
                  placeholder="Quest title"
                  value={newQuestTitle}
                  onChange={e => setNewQuestTitle(e.target.value)}
                  className="form-control form-control-sm"
                  autoFocus
                />
              </div>
              <div className="mb-2">
                <textarea
                  placeholder="Description (optional)"
                  value={newQuestDesc}
                  onChange={e => setNewQuestDesc(e.target.value)}
                  rows={3}
                  className="form-control form-control-sm"
                  style={{ resize: "vertical" }}
                />
              </div>
              <div className="mb-2">
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
              <div className="mb-3">
                <input
                  type="number"
                  placeholder="Quest number (optional)"
                  value={newQuestNumber}
                  onChange={e => setNewQuestNumber(e.target.value)}
                  min={0}
                  className="form-control form-control-sm"
                />
              </div>
              <div className="d-flex gap-2">
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
          ) : (
            <button onClick={() => setShowNewQuest(true)} className="btn btn-hq-light active">
              ＋ New Quest
            </button>
          )}
        </div>

        {/* Quest cards */}
        {visibleQuests.length === 0 ? (
          <div style={{ color: T.sidebarTextFaint, fontSize: 14, letterSpacing: 2, textAlign: "center", marginTop: 60 }}>
            No quests yet. Create one to get started.
          </div>
        ) : (
          <div className="hq-card-grid">
            {visibleQuests.map(quest => {
              const bookName = books.find(b => b.id === quest.questBookId)?.title;
              return (
                <div key={quest.id} className="card" style={{ boxShadow: "0 1px 4px #c4a87022", background: T.panelBg }}>
                  <div className="card-body d-flex flex-column gap-2 p-3">
                    <div style={{ fontSize: 14, fontWeight: "bold", color: T.sidebarTitle, letterSpacing: 1, fontFamily: FONT_HEADING }}>
                      {quest.title}
                    </div>
                    {quest.description && (
                      <div style={{
                        fontSize: 11, color: T.sidebarText, lineHeight: 1.5,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        fontFamily: FONT_BODY,
                      }}>
                        {quest.description}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: T.sidebarTextMuted, display: "flex", flexDirection: "column", gap: 2 }}>
                      {bookName && <span>Book: {bookName}</span>}
                      {quest.questNumber != null && <span>Quest #{quest.questNumber}</span>}
                      <span>Updated: {fmtDate(quest.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="card-footer d-flex gap-1 p-2" style={{ background: "transparent", borderTop: `1px solid ${T.sidebarPanelBorder}` }}>
                    <button onClick={() => onPlay(quest)} className="btn btn-hq-dark flex-grow-1" style={{ fontSize: 10 }}>
                      ⚔ Play
                    </button>
                    <button onClick={() => onEdit(quest)} className="btn btn-hq-dark flex-grow-1" style={{ fontSize: 10 }}>
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => setAssigningQuest(quest)}
                      title="Assign to quest book"
                      className="btn btn-hq-dark"
                      style={{ padding: "7px 10px", fontSize: 11 }}
                    >
                      ☰
                    </button>
                    <button
                      onClick={() => handleExportQuest(quest)}
                      title="Export quest as JSON"
                      className="btn btn-hq-dark"
                      style={{ padding: "7px 10px", fontSize: 11 }}
                    >
                      ⬇
                    </button>
                    <button
                      onClick={() => handleDeleteQuest(quest.id)}
                      className="btn btn-hq-dark"
                      style={{ padding: "7px 10px", fontSize: 11, color: T.accent }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
