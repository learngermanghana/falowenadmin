import { isAutomaticResultPublished } from './automaticReviewStatus.js';

export function markingInboxCategory(row = {}) {
  if (isAutomaticResultPublished(row)) return 'published';
  const result = row.result || {};
  const reasons = [...(row.publicationReviewReasons || []), ...(result.reviewReasons || []), ...(result.consistencyWarnings || [])];
  const unreliable = reasons.some(reason => !/^Failed assessment requires tutor review before publication\.$/.test(typeof reason === 'string' ? reason : reason?.message || ''))
    || result.status === 'needs_review' || result.secondExaminer?.requiresTutorReview
    || (result.confidence != null && (!Number.isFinite(Number(result.confidence)) || Number(result.confidence) < 0.8))
    || (result.score != null && result.finalScore != null && Math.abs(Number(result.score) - Number(result.finalScore)) > 0.5);
  if (unreliable) return 'issues';
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
