import { useState, useRef, useEffect } from "react";
import { T } from "./theme.js";
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
} from "./questStorage.js";
import { sortQuests } from "./questSort.js";
import { EditQuestBookDialog } from "./features/library/EditQuestBookDialog.jsx";
import { AssignQuestBookDialog } from "./features/library/AssignQuestBookDialog.jsx";
import { assignQuestToBook } from "./features/library/assignQuestBook.js";

// ─── Small shared input style ─────────────────────────────────────────────────
const inputStyle = {
  background: T.btnBg,
  border: `1px solid ${T.btnBorder}`,
  color: T.text,
  fontFamily: "inherit",
  padding: "6px 8px",
  width: "100%",
  boxSizing: "border-box",
  fontSize: 12,
};

// ─── Helper to format a timestamp ────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ─── QuestLibrary ─────────────────────────────────────────────────────────────
export default function QuestLibrary({ onPlay, onEdit, onCalibrate }) {
  const [books, setBooks]           = useState(() => loadQuestBooks());
  const [quests, setQuests]         = useState(() => loadQuests());
  const [selectedBookId, setSelectedBookId] = useState(null); // null = "All"

  useEffect(() => { migrateQuests(); }, []);

  const importInputRef = useRef(null);
  const [importError, setImportError] = useState("");

  // Edit-book dialog
  const [editingBook, setEditingBook] = useState(null); // null | book object

  // Assign-quest-book dialog
  const [assigningQuest, setAssigningQuest] = useState(null); // null | quest object

  // New-book form
  const [showNewBook, setShowNewBook]   = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookDesc, setNewBookDesc]   = useState("");

  // New-quest form
  const [showNewQuest, setShowNewQuest]         = useState(false);
  const [newQuestTitle, setNewQuestTitle]       = useState("");
  const [newQuestDesc, setNewQuestDesc]         = useState("");
  const [newQuestBookId, setNewQuestBookId]     = useState(null);
  const [newQuestNumber, setNewQuestNumber]     = useState("");

  // ── Derived ──────────────────────────────────────────────────────────────
  const filteredQuests = selectedBookId === null
    ? quests
    : quests.filter(q => q.questBookId === selectedBookId);
  const visibleQuests = sortQuests(filteredQuests, books);

  function bookQuestCount(bookId) {
    return quests.filter(q => q.questBookId === bookId).length;
  }

  // ── Book actions ──────────────────────────────────────────────────────────
  function handleCreateBook() {
    if (!newBookTitle.trim()) return;
    const book = createQuestBook(newBookTitle.trim(), newBookDesc.trim());
    setBooks(prev => [...prev, book]);
    setNewBookTitle("");
    setNewBookDesc("");
    setShowNewBook(false);
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

  // ── Quest actions ─────────────────────────────────────────────────────────
  function handleCreateQuest() {
    if (!newQuestTitle.trim()) return;
    const quest = createQuest({
      title: newQuestTitle.trim(),
      description: newQuestDesc.trim(),
      questBookId: newQuestBookId,
      questNumber: newQuestNumber === "" ? null : Number(newQuestNumber),
    });
    setQuests(prev => [...prev, quest]);
    setNewQuestTitle("");
    setNewQuestDesc("");
    setNewQuestBookId(null);
    setNewQuestNumber("");
    setShowNewQuest(false);
    onEdit(quest);
  }

  function handleDeleteQuest(id) {
    if (!window.confirm("Delete this quest?")) return;
    deleteQuest(id);
    setQuests(prev => prev.filter(q => q.id !== id));
  }

  // ── Export / Import ───────────────────────────────────────────────────────
  function handleExportQuest(quest) {
    const json = exportQuestAsJson(quest);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quest.title.replace(/\s+/g, "_")}.json`;
    a.click();
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

  // ── Shared button style ───────────────────────────────────────────────────
  const btn = (active = false, extra = {}) => ({
    background: active ? T.btnActiveBg : T.btnBg,
    color: active ? T.btnActiveText : T.btnText,
    border: `1px solid ${active ? T.btnActiveBdr : T.btnBorder}`,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "7px 12px",
    fontSize: 11,
    letterSpacing: 1,
    transition: "all 0.15s",
    ...extra,
  });

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: T.pageBg,
      fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, serif",
      color: T.text,
    }}>
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

      {/* ── Left sidebar — Quest Books ───────────────────────────────────── */}
      <div style={{
        width: 220, flexShrink: 0,
        background: T.sidebarBg,
        borderRight: `1px solid ${T.sidebarBorder}`,
        display: "flex", flexDirection: "column",
        padding: "18px 12px",
        gap: 6,
        overflowY: "auto",
      }}>
        <div style={{
          fontSize: 13, letterSpacing: 4, color: T.title,
          textTransform: "uppercase", textAlign: "center",
          borderBottom: `1px solid ${T.divider}`, paddingBottom: 12, marginBottom: 4,
        }}>
          Quest Books
        </div>

        {/* All Quests button */}
        <button
          onClick={() => setSelectedBookId(null)}
          style={{
            ...btn(selectedBookId === null),
            width: "100%", textAlign: "left",
            fontWeight: selectedBookId === null ? "bold" : "normal",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span>All Quests</span>
          <span style={{ fontSize: 10, opacity: 0.7 }}>({quests.length})</span>
        </button>

        {/* Book list */}
        {books.map(book => (
          <div key={book.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setSelectedBookId(book.id)}
              style={{
                ...btn(selectedBookId === book.id),
                flex: 1, textAlign: "left",
                fontWeight: selectedBookId === book.id ? "bold" : "normal",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                overflow: "hidden",
              }}
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
              style={{ ...btn(false, { padding: "5px 7px", fontSize: 12, flexShrink: 0 }) }}
            >
              ✎
            </button>
            <button
              onClick={() => handleDeleteBook(book.id)}
              title="Delete book"
              style={{
                ...btn(false, { padding: "5px 7px", fontSize: 12, flexShrink: 0 }),
                color: T.accent,
              }}
            >
              ×
            </button>
          </div>
        ))}

        {/* New book form / button */}
        <div style={{ marginTop: "auto", paddingTop: 8, borderTop: `1px solid ${T.divider}` }}>
          {onCalibrate && (
            <button
              onClick={onCalibrate}
              title="Open map calibration tool"
              style={{
                ...btn(false, { width: "100%", textAlign: "center", fontSize: 9, marginBottom: 6 }),
                color: T.textFaint, letterSpacing: 1,
              }}
            >
              ⚙ Calibrate Maps
            </button>
          )}
          <input
            type="file"
            accept=".json"
            ref={importInputRef}
            style={{ display: "none" }}
            onChange={handleImportFile}
          />
          <button
            onClick={() => { setImportError(""); importInputRef.current.click(); }}
            style={{ ...btn(false), width: "100%", textAlign: "center", marginBottom: 6 }}
          >
            ⬆ Import Quest
          </button>
          {importError && (
            <div style={{ fontSize: 10, color: T.accent, marginBottom: 6, wordBreak: "break-word" }}>
              {importError}
            </div>
          )}
          {showNewBook ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                placeholder="Book title"
                value={newBookTitle}
                onChange={e => setNewBookTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateBook()}
                style={inputStyle}
                autoFocus
              />
              <input
                placeholder="Description (optional)"
                value={newBookDesc}
                onChange={e => setNewBookDesc(e.target.value)}
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={handleCreateBook} style={{ ...btn(true), flex: 1, fontSize: 10 }}>
                  Create
                </button>
                <button onClick={() => { setShowNewBook(false); setNewBookTitle(""); setNewBookDesc(""); }} style={{ ...btn(false), flex: 1, fontSize: 10 }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewBook(true)} style={{ ...btn(false), width: "100%", textAlign: "center" }}>
              ＋ New Book
            </button>
          )}
        </div>
      </div>

      {/* ── Right main — Quest Cards ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "24px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            margin: 0, fontSize: 26, letterSpacing: 6, color: T.title,
            textTransform: "uppercase", fontWeight: "normal",
            textShadow: "0 2px 4px #c4a87044",
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
        <div style={{ marginBottom: 20 }}>
          {showNewQuest ? (
            <div style={{
              background: T.panelBg, border: `1px solid ${T.panelBorder}`,
              padding: "16px", display: "flex", flexDirection: "column", gap: 10,
              maxWidth: 480,
            }}>
              <div style={{ fontSize: 12, fontWeight: "bold", color: T.title, letterSpacing: 2, textTransform: "uppercase" }}>
                New Quest
              </div>
              <input
                placeholder="Quest title"
                value={newQuestTitle}
                onChange={e => setNewQuestTitle(e.target.value)}
                style={inputStyle}
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={newQuestDesc}
                onChange={e => setNewQuestDesc(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
              <select
                value={newQuestBookId ?? ""}
                onChange={e => setNewQuestBookId(e.target.value || null)}
                style={{ ...inputStyle }}
              >
                <option value="">— No book —</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quest number (optional)"
                value={newQuestNumber}
                onChange={e => setNewQuestNumber(e.target.value)}
                min={0}
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCreateQuest} style={{ ...btn(true), fontSize: 12 }}>
                  Create &amp; Edit
                </button>
                <button onClick={() => { setShowNewQuest(false); setNewQuestTitle(""); setNewQuestDesc(""); setNewQuestBookId(null); setNewQuestNumber(""); }} style={{ ...btn(false), fontSize: 12 }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewQuest(true)} style={{ ...btn(true), fontSize: 12 }}>
              ＋ New Quest
            </button>
          )}
        </div>

        {/* Quest cards */}
        {visibleQuests.length === 0 ? (
          <div style={{
            color: T.textFaint, fontSize: 14, letterSpacing: 2,
            textAlign: "center", marginTop: 60,
          }}>
            No quests yet. Create one to get started.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
            alignContent: "start",
          }}>
            {visibleQuests.map(quest => {
              const bookName = books.find(b => b.id === quest.questBookId)?.title;
              return (
                <div key={quest.id} style={{
                  background: T.sidebarBg,
                  border: `1px solid ${T.panelBorder}`,
                  padding: "14px 16px",
                  display: "flex", flexDirection: "column", gap: 8,
                  boxShadow: "0 1px 4px #c4a87022",
                }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.title, letterSpacing: 1 }}>
                    {quest.title}
                  </div>
                  {quest.description && (
                    <div style={{
                      fontSize: 11, color: T.textMuted, lineHeight: 1.5,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {quest.description}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: T.textFaint, display: "flex", flexDirection: "column", gap: 2 }}>
                    {bookName && <span>Book: {bookName}</span>}
                    {quest.questNumber != null && <span>Quest #{quest.questNumber}</span>}
                    <span>Updated: {fmtDate(quest.updatedAt)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button onClick={() => onPlay(quest)} style={{ ...btn(false, { flex: 1, fontSize: 10 }) }}>
                      ⚔ Play
                    </button>
                    <button onClick={() => onEdit(quest)} style={{ ...btn(false, { flex: 1, fontSize: 10 }) }}>
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => setAssigningQuest(quest)}
                      title="Assign to quest book"
                      style={{ ...btn(false, { padding: "7px 10px", fontSize: 11 }) }}
                    >
                      ☰
                    </button>
                    <button
                      onClick={() => handleExportQuest(quest)}
                      title="Export quest as JSON"
                      style={{ ...btn(false, { padding: "7px 10px", fontSize: 11 }) }}
                    >
                      ⬇
                    </button>
                    <button
                      onClick={() => handleDeleteQuest(quest.id)}
                      style={{ ...btn(false, { padding: "7px 10px", fontSize: 11 }), color: T.accent }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
