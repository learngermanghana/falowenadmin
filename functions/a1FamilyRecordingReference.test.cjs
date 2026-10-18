const { test } = require('node:test');
const assert = require('node:assert/strict');
const { REVISION, familyRecordingReference } = require('./a1FamilyRecordingReference');
const reference = { parts: { teil1: { answerCount: 4 }, teil3: { answerCount: 8 } }, expectedParts: ['teil1','teil2','teil3'], partGrading: {} };
const transcript = 'Meine Familie ist klein.';
const submission = { workbookRevision: REVISION, submissionText: `TEIL 1\n1. Es\n\nTEIL 2\n${transcript}`, recordings: [{ sectionKey: 'teil-2', transcript, audioUrl: 'https://example.com/audio.webm' }] };
test('recorded submissions use two parts even before the live registry is synced', () => {
  const result = familyRecordingReference(reference, submission, 'A1-3');
  assert.deepEqual(result.expectedParts, ['teil1','teil2']);
  assert.deepEqual(Object.keys(result.parts), ['teil1']);
  assert.match(result.partGrading.teil2.instruction, /spoken work/);
});
test('legacy submissions keep their original reference', () => {
  assert.equal(familyRecordingReference(reference, {}, 'A1-3'), reference);
});
test('missing audio and mismatched transcripts cannot be automatically graded as recorded work', () => {
  assert.throws(() => familyRecordingReference(reference, { ...submission, recordings: [] }, 'A1-3'), /matching transcript/);
  assert.throws(() => familyRecordingReference(reference, { ...submission, submissionText: 'TEIL 2\nDifferent' }, 'A1-3'), /matching transcript/);
});
