import test from 'node:test';
import assert from 'node:assert/strict';
import snapshot from '../src/data/courseMarkingSnapshot.json' with { type: 'json' };
import { canonicalCourseReference } from '../src/utils/canonicalCourseReference.js';
import { computeObjectiveScore } from '../src/utils/objectiveMarking.js';
import { mergeObjectiveScore } from '../src/utils/markingReview.js';

const james = 'TEIL 1 1. Falsch 2. Wahr 3. Falsch 4. Wahr 5. Wahr 6. Falsch 7. Wahr 8. Falsch 9. Wahr 10. Falsch  TEIL 2 1. B 2. C 3. B 4. B 5. B';
for (const text of [james, james.replace(/ (\d+\.)/g, '\n$1').replace('  TEIL', '\nTEIL')]) {
  test('James: 13/15 and 87%, including flattened report formatting', () => {
    const objective = computeObjectiveScore(canonicalCourseReference('A1-10'), text);
    assert.equal(objective.correctCount, 13);
    assert.equal(objective.totalCount, 15);
    assert.deepEqual(Object.entries(objective.details).filter(([, d]) => !d.correct).map(([q]) => q), ['9', '13']);
    const result = mergeObjectiveScore({ writingScore: null, writingScorePercent: null }, objective);
    assert.equal(result.finalScore ?? result.score, 87);
  });
}
test('Every A1–B1 key counts each part/question once in normalized and raw form', () => {
  for (const [title, source] of Object.entries(snapshot.answerKeys)) {
    const canonical = canonicalCourseReference(source.assignment_id);
    const normalized = computeObjectiveScore(canonical, '');
    const raw = computeObjectiveScore({ ...source, assignmentKey: source.assignment_id }, '');
    assert.equal(normalized.totalCount, Object.keys(normalized.details).length, title);
    assert.equal(normalized.totalCount, raw.totalCount, title);
  }
});
test('Current A2 writing task uses Jan and all three current task points', () => {
  const task = canonicalCourseReference('A2-6.15').questionAwareWritingTask;
  assert.match(task.taskSituationDe, /Jan/);
  assert.match(task.taskPointsDe[2], /Samstag/);
  assert.doesNotMatch(task.taskSituationDe, /Sportverein|Fitnessstudio/);
});

test('Every B1 writing contract retains current instructions and source opinion', async () => {
  const { resolveQuestionAwareWritingTask } = await import('../src/utils/questionAwareWritingMarking.js');
  assert.equal(Object.keys(snapshot.b1WritingTasks).length, 28);
  const task = resolveQuestionAwareWritingTask({ referenceEntry: canonicalCourseReference('B1-5.16') });
  assert.equal(task.source, 'learner-coursebook');
  assert.match(task.taskText, /Julias Meinung|Julia:/);
  assert.equal(task.taskPoints.length, 5);
  assert.match(task.taskPoints[2], /zwei Strategien/);
});

test('Current A1 Day 20 invitation and course enquiry meet the six current points', async () => {
  const { resolveQuestionAwareWritingTask } = await import('../src/utils/questionAwareWritingMarking.js');
  const { evaluateA1WritingTaskEvidence } = await import('../src/utils/a1WritingTaskEvidence.js');
  const task = resolveQuestionAwareWritingTask({ referenceEntry: canonicalCourseReference('A1-12.3') });
  assert.equal(task.taskVersion, 'A1-12.3-INVITATION-COURSE-V2');
  assert.match(task.taskText, /Julia/);
  assert.doesNotMatch(task.taskPoints.join(' '), /congratulate|family can come|pay online/i);
  const text = `Teil 1
Liebe Julia,
ich lade dich zu meiner Party ein. Sie ist am Samstag um 18 Uhr bei mir. Bitte bring Getränke mit.
Liebe Grüße
Felix
Teil 2
Sehr geehrte Damen und Herren,
ich möchte mich für einen Deutschkurs anmelden. Wann findet der Kurs statt und wie viel kostet er? Ich möchte im Juli beginnen.
Mit freundlichen Grüßen
Felix`;
  assert.deepEqual(evaluateA1WritingTaskEvidence(task, text).map(row => row.status), Array(6).fill('met'));
});

test('B1 Day 24 marks all 12 updated objectives and uses Laura four-point writing task', () => {
  const reference = canonicalCourseReference('B1-8.24');
  const writing = reference.questionAwareWritingTask;
  assert.match(writing.taskSituationDe, /Laura|neue Kleidung und Plastikprodukte/);
  assert.equal(writing.taskPointsDe.length, 4);
  assert.doesNotMatch(writing.taskSituationDe, /Pauls Meinung/);
  const text = 'TEIL 3\n1. A\n2. B\n3. B\n4. A\n5. B\n6. C\n7. B\nTEIL 4\n1. Falsch\n2. Richtig\n3. Richtig\n4. Falsch\n5. Richtig';
  const result = computeObjectiveScore(reference, text);
  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  const wrong = computeObjectiveScore(reference, text.replace('6. C', '6. A').replace('1. Falsch', '1. Richtig'));
  assert.equal(wrong.correctCount, 10);
});

test('B1 Day 25 grades seven consumer-rights choices and five delivery statements with the ElectroWorld writing task', () => {
 const reference = canonicalCourseReference('B1-8.25');
 assert.match(reference.questionAwareWritingTask.taskSituationDe, /ElectroWorld/);
 assert.match(reference.questionAwareWritingTask.taskSituationDe, /40–50 Wörter/);
 assert.equal(reference.questionAwareWritingTask.taskPointsDe.length, 3);
 assert.doesNotMatch(reference.questionAwareWritingTask.taskSituationDe, /Tims Meinung|Diskussionssendung/);
 const text = 'TEIL 3\n1. B\n2. C\n3. B\n4. B\n5. B\n6. C\n7. B\nTEIL 4\n1. Richtig\n2. Falsch\n3. Richtig\n4. Falsch\n5. Richtig';
 const score = computeObjectiveScore(reference, text);
 assert.equal(score.totalCount, 12);
 assert.equal(score.correctCount, 12);
 assert.equal(computeObjectiveScore(reference, text.replace('2. C', '2. A')).correctCount, 11);
});
