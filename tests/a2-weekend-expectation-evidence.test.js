import test from 'node:test';
import assert from 'node:assert/strict';
import { getA2WritingTaskSpec } from '../src/data/a2WritingTaskSpecs.js';
import { evaluateWritingTaskEvidence } from '../src/utils/writingTaskEvidence.js';
import { applyQuestionAwareWritingGuard } from '../src/utils/questionAwareWritingMarking.js';
const task = getA2WritingTaskSpec('A2-8.21');
const expectation = text => evaluateWritingTaskEvidence(task, text)[2];
test('weekend expectation accepts concrete exhibition details despite A2 inversion', () => {
  for (const text of ['Es gibt dort viele historische Ausstellungen.', 'Gibt es dort viele historische Ausstellungen.', 'Dort sind interessante Bilder.']) {
    assert.equal(expectation(text).status, 'met');
    assert.equal(expectation(text).evidence, text);
  }
});
test('bring-along alternative remains valid', () => {
  for (const text of ['Bring bitte eine Kamera mit.', 'Kannst du Wasser mitbringen?']) assert.equal(expectation(text).status, 'met');
});
test('fragments, unrelated modal verbs and questions do not establish expectations', () => {
  for (const text of ['Wenn man Kamera hast,', 'Du kannst am Freitag kommen.', 'Gibt es dort historische Ausstellungen?', 'Es gibt dort keine Ausstellungen.']) assert.equal(expectation(text).status, 'missing', text);
});
test('guard resolves false omission without increasing language score or removing examiner review', () => {
  const text = 'Teil 2\nLiebe Freundin, wir fahren am Samstag nach Hamburg ins Museum. Das ist besonders interessant. Gibt es dort viele historische Ausstellungen. Wenn man Kamera hast,';
  const result = applyQuestionAwareWritingGuard({writingScore: 50, objectiveScore: 100, score: 80, confidence: .98, status: 'review', missingTaskPoints: [task.taskPoints[2]], reviewReasons: [{code: 'examiner_disagreement', message: 'Independent examiners require tutor review.'}]}, {level: 'A2', assignmentKey: task.assignmentKey, referenceEntry: {questionAwareWritingTask: task}}, text);
  assert.deepEqual(result.missingTaskPoints, []);
  assert.equal(result.writingScore, 50);
  assert.ok(result.reviewReasons.some(reason => reason.code === 'examiner_disagreement'));
});
