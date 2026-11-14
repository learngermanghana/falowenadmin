import { assignmentTitle } from './assignmentTitle.js';
import { automaticPublicationLabel, automaticReviewReasons, isAutomaticResultPublished } from './automaticReviewStatus.js';
import { a1LaterTeachingSlides } from '../data/a1LaterTeachingSlides.js';

export function markingReviewCopy(detail) {
  const { row, submission, audit } = detail;
  const result = audit?.result || row.result || {};
  const score = result.finalScore ?? result.score;
  const key = row.assignmentId || result.assignmentKey;
  const title = assignmentTitle(row.assignmentTitle, row.assignment, key);
  const writing = audit?.referenceEntry?.questionAwareWritingTask;
  const task = writing?.taskSituationDe || writing?.taskText || submission.taskPrompt;
  const speaking = key === 'A1-5.9' && a1LaterTeachingSlides.find(slide => slide.assignmentId === key);
  const instructions = typeof task === 'string' && task || (speaking && speaking.workbookConnection.parts.map(part => part.label + ' — ' + part.detailEn).join('\n'));
  return [
    [title, key !== title && key].filter(Boolean).join(' · '),
    'Status: ' + automaticPublicationLabel(row),
    instructions && 'Task instructions\n' + instructions,
    !isAutomaticResultPublished(row) && 'Why review is needed\n' + automaticReviewReasons(detail).join('\n'),
    'Submitted work\n' + (submission.submissionText || submission.text || submission.answer || submission.workContent || 'No text available'),
    score == null ? 'No AI score' : [
      'Original AI score: ' + score + '/100',
      result.confidence != null && 'Confidence: ' + result.confidence,
      result.feedback,
    ].filter(Boolean).join('\n'),
  ].filter(Boolean).join('\n\n');
}
