export function normalizeDictionaryId(value) {
  return String(value || "").trim().toUpperCase();
}

export function canonicalDictionaryId(entries = [], assignmentId = "") {
  const normalized = normalizeDictionaryId(assignmentId);
  if (!normalized) return "";
  return entries.find((entry) => normalizeDictionaryId(entry?.assignment_id) === normalized)?.assignment_id || "";
}

export function canonicalDictionarySelection(entries = [], assignmentIds = []) {
  const source = Array.isArray(assignmentIds) ? assignmentIds : [assignmentIds];
  const selected = [];
  const seen = new Set();

  source.forEach((assignmentId) => {
    const canonical = canonicalDictionaryId(entries, assignmentId);
    const key = normalizeDictionaryId(canonical);
    if (!canonical || seen.has(key)) return;
    seen.add(key);
    selected.push(canonical);
  });

  return selected;
}

export function toggleDictionarySelection(entries = [], assignmentIds = [], assignmentId = "") {
  const canonical = canonicalDictionaryId(entries, assignmentId);
  const selected = canonicalDictionarySelection(entries, assignmentIds);
  if (!canonical) return selected;

  const target = normalizeDictionaryId(canonical);
  const exists = selected.some((id) => normalizeDictionaryId(id) === target);
  return exists
    ? selected.filter((id) => normalizeDictionaryId(id) !== target)
    : [...selected, canonical];
}

export function dictionaryEntriesForSelection(entries = [], assignmentIds = []) {
  const selected = new Set(canonicalDictionarySelection(entries, assignmentIds).map(normalizeDictionaryId));
  return entries.filter((entry) => selected.has(normalizeDictionaryId(entry?.assignment_id)));
}

export function buildDictionarySelectionTopic({
  entries = [],
  assignmentIds = [],
  levelId = "",
  existingTopic = "",
} = {}) {
  const selectedEntries = dictionaryEntriesForSelection(entries, assignmentIds);
  if (!selectedEntries.length) return String(existingTopic || "").trim();

  const language = String(levelId || "").trim().toUpperCase() === "A1" ? "en" : "de";
  const titles = selectedEntries
    .map((entry) => String(entry?.[language] || entry?.en || entry?.de || "").trim())
    .filter(Boolean);
  const prefix = String(existingTopic || "").match(/^\s*((?:Day|Lesson)\s+\d+)\s*:/i)?.[1] || "";
  return `${prefix ? `${prefix}: ` : ""}${titles.join(" + ")}`.trim();
}
