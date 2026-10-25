import { isAutomaticResultPublished } from './automaticReviewStatus.js';

export function markingInboxCategory(row = {}) {
  if (isAutomaticResultPublished(row)) return 'published';
  const result = row.result || {};
  const score = row.finalScore ?? result.finalScore ?? result.score;
  const validScore = score !== null && score !== undefined && score !== '' && Number.isFinite(Number(score));
  return validScore && (Number(score) < 60 || result.passed === false || result.writingMinimumMet === false) ? 'failed' : 'issues';
}

export function filterMarkingInbox(rows = [], { view = 'review', search = '', level = '' } = {}) {
  const needle = search.trim().toLowerCase();
  return rows.filter(row => {
    const category = markingInboxCategory(row);
    if (view === 'review' ? category === 'published' : view !== 'all' && category !== view) return false;
    if (level && String(row.level || row.assignmentId?.split('-')[0] || '').toUpperCase() !== level) return false;
    return !needle || [row.studentName, row.studentEmail, row.studentCode, row.studentId, row.assignmentId, row.assignmentTitle]
      .some(value => String(value || '').toLowerCase().includes(needle));
  }).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}
