export function hasUnsavedClassEditorChanges(current = {}, saved = {}) {
  return JSON.stringify(current) !== JSON.stringify(saved);
}

export function isSuccessfulClassEditorMessage(message = "") {
  const text = String(message);
  return text.startsWith("Class updated.") || text.startsWith("Sessions rebuilt.");
}
