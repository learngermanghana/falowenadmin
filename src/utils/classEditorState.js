export function hasUnsavedClassEditorChanges(current = {}, saved = {}) {
  return JSON.stringify(current) !== JSON.stringify(saved);
}

export function isSuccessfulClassEditorMessage(message = "") {
  return String(message).startsWith("Class updated.") || String(message).startsWith("Sessions rebuilt.");
}
