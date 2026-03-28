export function isSessionDirty(fog, openedChests, revealedTraps, revealedSecretDoors, searchedCounts) {
  return fog.size > 0
    || openedChests.size > 0
    || revealedTraps.size > 0
    || revealedSecretDoors.size > 0
    || Object.keys(searchedCounts).length > 0;
}

export function stableStringify(obj) {
  if (typeof obj !== "object" || obj === null) return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(stableStringify).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

export function hasUnsavedChanges(snapshot, current) {
  return snapshot !== stableStringify(current);
}
