import answersDictionary from '../data/answers_dictionary.json' with { type: 'json' };
import snapshot from '../data/courseMarkingSnapshot.json' with { type: 'json' };
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
// The learner coursebook owns current answers and part metadata. Retain local
// tutor rubrics only where the learner contract does not specify a field.
for (const [title, source] of Object.entries(snapshot.answerKeys)) {
  const key = source.assignment_id;
  const prior = entries.get(key)?.source || {};
  entries.set(key, { title, source: { ...prior, ...source } });
}
export function canonicalCourseReference(assignmentKey) {
  const row = entries.get(String(assignmentKey || '').trim().toUpperCase());
  if (!row) return null;
  const reference = normalizeAnswerKeyEntry(row.title, row.source);
  const writing = snapshot.writingTasks[reference.assignmentKey] || snapshot.b1WritingTasks?.[reference.assignmentKey] || snapshot.a1WritingTasks?.[reference.assignmentKey];
  if (writing) reference.questionAwareWritingTask = {
    assignmentKey: writing.assignmentKey, level: reference.level, title: writing.title,
    taskVersion: writing.taskVersion, taskSituationDe: writing.situation, taskPointsDe: writing.points.length ? writing.points : [writing.situation],
    taskText: [writing.situation, ...writing.points, writing.submissionNote].filter(Boolean).join(' '),
    source: 'learner-coursebook', sourceVersion: snapshot.revision,
  };
  reference.coursebookRevision = snapshot.revision;
  return reference;
}
