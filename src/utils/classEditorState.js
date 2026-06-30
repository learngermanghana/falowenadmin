const normalizedRules = (value = {}) => (Array.isArray(value.scheduleRules) ? value.scheduleRules : []).map((rule) => [
  String(rule.day || rule.weekday || "").slice(0, 3).toLowerCase(),
  String(rule.startTime || rule.time || ""),
  Number(rule.durationMinutes || 120),
]);

export function liveClassRebuildSettings(value = {}) {
  return JSON.stringify([
    String(value.name || ""),
    String(value.levelId || value.level || "").toUpperCase(),
    String(value.startDate || ""),
    String(value.endDate || ""),
    String(value.timezone || "Africa/Accra"),
    normalizedRules(value),
  ]);
}

export function hasUnsavedClassEditorChanges(current = {}, saved = {}) {
  return liveClassRebuildSettings(current) !== liveClassRebuildSettings(saved);
}

export function isSuccessfulClassEditorMessage(message = "") {
  const text = String(message);
  return text.startsWith("Class updated.") || text.startsWith("Sessions rebuilt successfully:");
}
