import test from 'node:test';
import assert from 'node:assert/strict';
import { markingReviewCopy } from '../src/utils/markingReviewCopy.js';

test('stopped speaking review copies instructions and submission without internal identifiers or spurious confidence', () => {
  const text = markingReviewCopy({ row: { assignmentId: 'A1-5.9', studentEmail: 'private@example.test',
    errorKind: 'marking_validation', result: { confidence: 0 }, publicationReviewReasons: ['Key unavailable'] }, submission: { text: 'Was kostet das?' } });
  for (const phrase of ['A1-5.9', 'Teil 3', 'Key unavailable', 'Was kostet das?', 'No AI score']) assert.ok(text.includes(phrase));
  assert.doesNotMatch(text, /confidence|private@example/i);
});

test('scored review copies original zero score, unabridged feedback and audited prompt', () => {
  const text = markingReviewCopy({ row: { finalScore: 65 }, submission: { answer: 'Mein Brief' },
    audit: { referenceEntry: { questionAwareWritingTask: { taskSituationDe: 'Write two letters.' } },
      result: { finalScore: 0, feedback: 'Explain the date.\nAsk for a reply.', confidence: 0.9 } } });
  for (const phrase of ['Write two letters.', '0/100', '0.9', 'Mein Brief', 'Explain the date.\nAsk for a reply.']) assert.ok(text.includes(phrase));
});
