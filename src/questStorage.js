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

export function createQuest({ title, description = "", questBookId = null }) {
  const quest = {
    id: uid(),
    title,
    description,
    questBookId,
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
