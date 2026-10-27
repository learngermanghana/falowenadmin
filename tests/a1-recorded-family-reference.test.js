import test from 'node:test';
import assert from 'node:assert/strict';
import dictionary from '../src/data/answers_dictionary.json' with { type: 'json' };
import { normalizeAnswerKeyEntry } from '../src/utils/answerKeyNormalizer.js';
import { computeObjectiveScore } from '../src/utils/objectiveMarking.js';
import { resolveQuestionAwareWritingTask } from '../src/utils/questionAwareWritingMarking.js';
import { REVISION, familyRecordingReference } from '../src/utils/a1FamilyRecordingReference.js';
import { createRequire } from 'node:module';
const workerAdapter = createRequire(import.meta.url)('../functions/a1FamilyRecordingReference.js');
const entry = Object.values(dictionary).find(item => item.assignment_id === 'A1-3');
const reference = normalizeAnswerKeyEntry('A1 Asking About Prices 3', entry);
const transcript = 'Meine Mutter heißt Ama. Sie kocht gern.';
const text = `TEIL 1\n1. Es kostet 20 Euro.\n2. Sie kostet 15 Euro.\n3. Es kostet 25.000 Euro.\n4. Er kostet 50 Euro.\n\nTEIL 2\n${transcript}`;
const recorded = { workbookRevision: REVISION, submissionText: text, recordings: [{ sectionKey: 'teil-2', transcript, audioUrl: 'https://example.com/recording.webm' }] };
test('the real shared manifest preserves all legacy objective answers and writing requirements', () => {
  const legacy = familyRecordingReference(reference, { text: 'old answer' }, 'A1-3');
  assert.equal(legacy, reference);
  assert.deepEqual(legacy.expectedParts, ['teil1', 'teil2', 'teil3']);
  assert.equal(legacy.totalAnswers, 12);
  assert.equal(resolveQuestionAwareWritingTask({ referenceEntry: legacy }).taskText.includes('Write one short connected text'), true);
});
test('tutor-normalized submissions retain revision metadata in raw and select the spoken task', () => {
  const tutorSubmission = { text, assignmentKey: 'A1-3', raw: recorded };
  const spoken = familyRecordingReference(reference, tutorSubmission);
  assert.equal(computeObjectiveScore(spoken, text).totalCount, 4);
  assert.equal(computeObjectiveScore(spoken, text).correctCount, 4);
  const task = resolveQuestionAwareWritingTask({ referenceEntry: spoken, submission: tutorSubmission });
  assert.equal(task.modality, 'spoken_transcript');
  assert.equal(task.rubricVersion, REVISION);
  assert.equal(task.taskPoints.length, 2);
  assert.match(task.gradingInstruction, /do not require a letter/);
  assert.doesNotMatch(task.taskText, /connected text/);
});
test('worker and tutor adapters produce identical versioned references from the same manifest', () => {
  assert.deepEqual(workerAdapter.familyRecordingReference(reference, recorded, 'A1-3'), familyRecordingReference(reference, { raw: recorded }, 'A1-3'));
  assert.deepEqual(reference.expectedParts, ['teil1', 'teil2', 'teil3']);
});

test('new grammar revision scores all six blanks and retains the recorded family rubric', () => {
  const revision = 'a1-3-recorded-family-grammar-v2';
  const grammarText = `${text}\n\nTEIL 3\n1. gern\n2. Magst\n3. gern\n4. mögen\n5. gern\n6. mag`;
  const submission = { ...recorded, workbookRevision: revision, submissionText: grammarText };
  const current = familyRecordingReference(reference, submission, 'A1-3');
  assert.deepEqual(current.expectedParts, ['teil1', 'teil2', 'teil3']);
  assert.equal(current.parts.teil3.answerCount, 6);
  assert.equal(current.totalAnswers, 10);
  const score = computeObjectiveScore(current, grammarText);
  assert.equal(score.totalCount, 10);
  assert.equal(score.correctCount, 10);
  const wrong = computeObjectiveScore(current, grammarText.replace('6. mag', '6. gern'));
  assert.equal(wrong.correctCount, 9);
  assert.equal(resolveQuestionAwareWritingTask({ referenceEntry: current, submission }).modality, 'spoken_transcript');
  assert.deepEqual(workerAdapter.familyRecordingReference(reference, submission, 'A1-3'), current);
});
