/**
 * Returns a new quest object with questBookId and questNumber updated.
 * Does not mutate the input. Does not touch updatedAt (persistQuest handles that).
 */
export function assignQuestToBook(quest, questBookId, questNumber) {
  return { ...quest, questBookId, questNumber };
}
