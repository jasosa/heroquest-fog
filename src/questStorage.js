// ─── Quest Storage (localStorage CRUD) ───────────────────────────────────────
const BOOKS_KEY  = "hq_quest_books";
const QUESTS_KEY = "hq_quests";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Books ────────────────────────────────────────────────────────────────────

export function loadQuestBooks() {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQuestBooks(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function createQuestBook(title, description = "") {
  const book = { id: uid(), title, description, createdAt: Date.now() };
  const books = loadQuestBooks();
  books.push(book);
  saveQuestBooks(books);
  return book;
}

export function updateQuestBook(id, changes) {
  const books = loadQuestBooks().map(b => b.id === id ? { ...b, ...changes } : b);
  saveQuestBooks(books);
  return books.find(b => b.id === id);
}

export function deleteQuestBook(id) {
  // Remove the book
  const books = loadQuestBooks().filter(b => b.id !== id);
  saveQuestBooks(books);
  // Also remove all quests that belong to this book
  const quests = loadQuests().filter(q => q.questBookId !== id);
  saveQuests(quests);
}

// ── Quests ────────────────────────────────────────────────────────────────────

export function loadQuests() {
  try {
    const raw = localStorage.getItem(QUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQuests(quests) {
  localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
}

export function migrateQuests() {
  const quests = loadQuests();
  const needsMigration = quests.some(q => !("questNumber" in q));
  if (!needsMigration) return;
  const migrated = quests.map(q => "questNumber" in q ? q : { ...q, questNumber: null });
  saveQuests(migrated);
}

export function createQuest({ title, description = "", questBookId = null, questNumber = null }) {
  const quest = {
    id: uid(),
    title,
    description,
    questBookId,
    questNumber,
    placed: {},
    doors: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const quests = loadQuests();
  quests.push(quest);
  saveQuests(quests);
  return quest;
}

export function persistQuest(quest) {
  const updated = { ...quest, updatedAt: Date.now() };
  const quests = loadQuests();
  const idx = quests.findIndex(q => q.id === updated.id);
  if (idx >= 0) {
    quests[idx] = updated;
  } else {
    quests.push(updated);
  }
  saveQuests(quests);
  return updated;
}

export function deleteQuest(id) {
  const quests = loadQuests().filter(q => q.id !== id);
  saveQuests(quests);
}

// ── Export / Import ───────────────────────────────────────────────────────────

// Returns a JSON string safe to download (strips runtime-only fields).
export function exportQuestAsJson(quest) {
  const { id, questBookId, createdAt, updatedAt, ...content } = quest;
  return JSON.stringify(content, null, 2);
}

// Parses a JSON string and saves as a new quest under questBookId.
// Returns the saved quest, or throws if the JSON is invalid / missing required fields.
export function importQuestFromJson(jsonString, questBookId = null) {
  const data = JSON.parse(jsonString); // throws on malformed JSON
  if (!data.title || typeof data.placed !== "object" || typeof data.doors !== "object") {
    throw new Error("Invalid quest file — missing required fields.");
  }
  return persistQuest({
    id: uid(),
    questBookId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: data.title,
    description: data.description ?? "",
    questNumber: data.questNumber ?? null,
    placed: data.placed ?? {},
    doors: data.doors ?? {},
    searchMarkers: data.searchMarkers ?? null,
    searchNotes: data.searchNotes ?? {},
    secretDoorMarkers: data.secretDoorMarkers ?? {},
  });
}

// ── Calibration ───────────────────────────────────────────────────────────────

const CALIBRATION_KEY = "hq_calibration";

export function loadCalibration() {
  try {
    const raw = localStorage.getItem(CALIBRATION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCalibration(data) {
  localStorage.setItem(CALIBRATION_KEY, JSON.stringify(data));
}
