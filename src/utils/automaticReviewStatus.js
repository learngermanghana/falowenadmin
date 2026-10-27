export const isAutomaticResultPublished = row => row?.sentToStudent === true;
export const automaticPublicationLabel = row => !isAutomaticResultPublished(row)
  ? 'Tutor review required' : row.tutorReview?.action === 'approve' ? 'Published to student'
    : row.tutorReview ? 'Tutor corrected' : 'Published to student';
export function automaticReviewReasons(detail) {
  const row = detail.row || {};
  const result = detail.audit?.result || row.result || {};
  const text = value => typeof value === 'string' ? value : value?.message || value?.reason || value?.code || '';
  const reasons = [...(row.publicationReviewReasons || []), ...(detail.job?.publicationReviewReasons || []), ...(result.reviewReasons || []),
    ...(result.consistencyWarnings || []), detail.job?.error].map(text).filter(value => value && !/^none$/i.test(value));
  if (Number.isFinite(Number(result.confidence)) && Number(result.confidence) < 0.8) reasons.push('AI confidence is below 0.8.');
  if (result.secondExaminer?.requiresTutorReview) reasons.push('The second examiner requested tutor review.');
  if (!isAutomaticResultPublished(row) && !reasons.length) reasons.push('No review reason was recorded for this older result. Inspect the original AI evidence before approving.');
  return [...new Set(reasons)];
}
