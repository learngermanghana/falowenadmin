import answersDictionary from '../data/answers_dictionary.json' with { type: 'json' };
import { normalizeAnswerKeyEntry } from './answerKeyNormalizer.js';

// Exact, bundled version of the same key registry used by the Admin marking UI.
// This prevents a stale Firestore answerKeyRegistry entry from grading new work.
const entries = new Map();
for (const [title, source] of Object.entries(answersDictionary)) {
  const key = String(source?.assignment_id || source?.assignmentId || source?.assignmentKey || '').trim().toUpperCase();
  if (!key) continue;
  if (entries.has(key)) throw new Error('Duplicate canonical marking key: ' + key);
  entries.set(key, { title, source });
}
export function canonicalCourseReference(assignmentKey) {
  const row = entries.get(String(assignmentKey || '').trim().toUpperCase());
  return row ? normalizeAnswerKeyEntry(row.title, row.source) : null;
}
