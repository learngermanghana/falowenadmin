import { normalizeAnswerKeyEntry } from './answerKeyNormalizer.js';

// The Admin bundle can differ from the Firebase worker deployed to production.
// The saved audit reference is the only evidence of what a completed AI job saw.
export function bundledReferenceForAssignment(dictionary, assignmentId) {
  const id = String(assignmentId || '').trim().toUpperCase().replace(/_/g, '.');
  if (!id) return null;
  const match = Object.entries(dictionary || {}).find(([, value]) =>
    String(value?.assignment_id || value?.assignmentId || value?.assignmentKey || '')
      .trim().toUpperCase().replace(/_/g, '.') === id);
  return match ? normalizeAnswerKeyEntry(match[0], match[1]) : null;
}

export function referenceAnswerRows(reference) {
  if (!reference) return [];
  const parts = reference.parts || {};
  if (Object.keys(parts).length) {
    return Object.entries(parts).flatMap(([part, group]) =>
      (Array.isArray(group?.answers) ? group.answers : []).map((answer, index) => ({
        key: String(part) + ':' + String(answer.questionKey || answer.questionNumber || index + 1),
        answer: String(answer.rawCorrectAnswer ?? answer.raw ?? answer.correctText ?? answer.correctLetter ?? '')
      })));
  }
  const raw = reference.rawAnswers || reference.answers || {};
  const rows = [];
  function walk(value, trail = []) {
    if (value === null || value === undefined) return;
    if (typeof value !== 'object') {
      rows.push({ key: trail.join(':'), answer: String(value) });
    } else {
      Object.entries(value).forEach(([key, next]) => walk(next, [...trail, key]));
    }
  }
  walk(raw);
  return rows;
}

export function compareMarkingReferences(usedReference, currentReference) {
  const used = referenceAnswerRows(usedReference);
  const current = referenceAnswerRows(currentReference);
  if (!usedReference || !currentReference) {
    return { status: 'unavailable', rows: [], usedAvailable: !!usedReference, currentAvailable: !!currentReference };
  }
  const before = new Map(used.map(item => [item.key.toLowerCase(), item]));
  const after = new Map(current.map(item => [item.key.toLowerCase(), item]));
  const keys = [...new Set([...before.keys(), ...after.keys()])];
  const rows = keys.map(key => ({
    key: after.get(key)?.key || before.get(key)?.key || key,
    used: before.get(key)?.answer ?? null,
    current: after.get(key)?.answer ?? null,
    changed: before.get(key)?.answer !== after.get(key)?.answer
  }));
  return { status: rows.some(row => row.changed) ? 'different' : 'matching', rows,
    usedAvailable: true, currentAvailable: true };
}

const privateField = /^(?:email|phone|whatsapp|address|name|fullname|firstname|lastname|studentname|studentemail|studentcode|studentid|uid|userid|tutoruid|ipaddress|deviceid|password|secret|token|authorization|apikey|keyid|accesskey)$/i;
export function sanitizeMarkingEvidence(value, depth = 0) {
  if (depth > 14) return '[truncated]';
  if (Array.isArray(value)) return value.map(item => sanitizeMarkingEvidence(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) =>
      [key, privateField.test(key.replace(/[_\s-]+/g, '')) ? '[redacted]' : sanitizeMarkingEvidence(nested, depth + 1)]));
  }
  if (typeof value === 'string') return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email redacted]')
    .replace(/(?:\+233|0)(?:[\s-]?\d){9}\b/g, '[phone redacted]');
  return value;
}
function json(value) {
  return JSON.stringify(sanitizeMarkingEvidence(value ?? null), null, 2);
}
export function buildAutomaticMarkingReport(detail, currentReference) {
  if (!detail) return '';
  const row = detail.row || {};
  const submission = detail.submission || {};
  const audit = detail.audit || {};
  const original = audit.result || row.result || {};
  const usedReference = audit.referenceEntry || null;
  const comparison = compareMarkingReferences(usedReference, currentReference);
  const submittedWork = submission.submissionText || submission.text || submission.answer ||
    submission.workContent || audit.submission?.submissionText || '(No plain-text submission stored)';
  return [
    'FALOWEN - AUTOMATIC MARKING DEBUG REPORT',
    'This report is for tutor debugging. Review student free text for personal details before sharing.',
    'Generated at: ' + new Date().toISOString(),
    'Assignment: ' + (row.assignmentId || row.result?.assignmentKey || 'Unknown'),
    'Title: ' + (row.assignmentTitle || row.assignment || 'Unknown'),
    'Level: ' + (row.level || 'Unknown'),
    'Attempt: ' + (submission.attempt || row.attempt || 'Not recorded'),
    'Submitted: ' + (submission.submittedAt || row.submittedAt || row.createdAt || 'Unknown'),
    'Submission path structure: ' + (row.submissionPath ? String(row.submissionPath).split('/').map((part, index) => index % 2 ? '[record]' : part).join('/') : 'Unknown'),
    'Publication: ' + (row.publicationStatus || row.status || 'Unknown'),
    'Reported score: ' + (row.finalScore ?? 'Unavailable'),
    '',
    'REFERENCE DIAGNOSIS',
    'Reference actually stored in AI audit: ' + (usedReference ? 'Available' : 'Not saved / not found'),
    'Audit reference version: ' + (audit.referenceVersion || usedReference?.version || 'Not recorded'),
    'Student reference version: ' + (submission.answerKeyVersion || submission.markingReferenceVersion || 'Not recorded'),
    'Admin bundled reference version: ' + (currentReference?.version || 'Not recorded'),
    'Admin bundle vs saved audit reference: ' + comparison.status,
    'Important: the current Admin bundle is NOT proof of the currently deployed Firebase marking key.',
    'Reference changes: ' + (comparison.status === 'unavailable' ? 'Cannot compare missing evidence' : comparison.rows.filter(item => item.changed).length),
    json(comparison.rows.filter(item => item.changed)),
    '',
    'STUDENT WORK (ORIGINAL)',
    json(submittedWork),
    'Structured response fields, if stored:',
    json({ answers: submission.answers, responses: submission.responses,
      submittedAnswers: submission.submittedAnswers, files: submission.files }),
    '',
    'REFERENCE SAVED WITH THE MARKING JOB',
    json(usedReference || 'Unavailable - do not reconstruct as if it were original'),
    '',
    'CURRENT ADMIN BUNDLED REFERENCE',
    json(currentReference || 'No matching reference in the Admin bundle'),
    '',
    'ORIGINAL AI RESULT AND QUESTION EVIDENCE',
    json(original),
    '',
    'SAVED SCORE AND TUTOR CORRECTIONS',
    json({ currentScore: detail.score?.score, comments: detail.score?.comments,
      tutorReview: row.tutorReview, reviews: detail.reviews || [] }),
    '',
    'MARKING JOB DIAGNOSTICS',
    json({ status: detail.job?.status, error: detail.job?.error,
      errorKind: detail.job?.errorKind, attempts: detail.job?.attempts,
      assignmentKey: detail.job?.assignmentKey, referenceVersion: detail.job?.referenceVersion,
      publicationReviewReasons: row.publicationReviewReasons }),
    '',
    'Check for: stale deployed worker dictionary, mistaken assignment mapping, changed answer keys,',
    'objective mismatches, writing score exceeding its maximum, and Sheet synchronization issues.'
  ].join('\n');
}
