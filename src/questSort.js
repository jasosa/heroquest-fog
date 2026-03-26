// ─── Quest Sorting ────────────────────────────────────────────────────────────

/**
 * Sort quests: primary by book order (insertion order of books array),
 * secondary by questNumber ascending (null sorts after numbers),
 * tertiary by title alphabetically.
 *
 * Quests whose questBookId is not found in books (null or deleted) sort last.
 *
 * Returns a new array — does not mutate the input.
 */
export function sortQuests(quests, books) {
  const bookIndex = new Map(books.map((b, i) => [b.id, i]));

  function bookOrder(q) {
    if (q.questBookId == null) return Infinity;
    const idx = bookIndex.get(q.questBookId);
    return idx !== undefined ? idx : Infinity;
  }

  return [...quests].sort((a, b) => {
    const ao = bookOrder(a);
    const bo = bookOrder(b);
    if (ao !== bo) return ao - bo;

    const aNum = a.questNumber ?? null;
    const bNum = b.questNumber ?? null;

    if (aNum !== null && bNum !== null) return aNum - bNum;
    if (aNum !== null) return -1;
    if (bNum !== null) return 1;

    return a.title.localeCompare(b.title);
  });
}
