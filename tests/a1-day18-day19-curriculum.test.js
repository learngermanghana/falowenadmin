import test from 'node:test';
import assert from 'node:assert/strict';
import dictionary from '../src/data/answers_dictionary.json' with { type: 'json' };
import { getSlidesByCourse, getTeachingSlideByAssignmentId } from '../src/data/teachingSlides.js';
import { getA1LearningPath } from '../src/data/a1LearningPath.js';
import { normalizeAnswerKeyEntry } from '../src/utils/answerKeyNormalizer.js';
test('12.1 exercises and retired 12.2 historical marking references retain 15 answers each', () => {
  for (const key of ['A1-12.1', 'A1-12.2']) {
    const row = Object.values(dictionary).find(item => item.assignment_id === key);
    assert.equal(normalizeAnswerKeyEntry(key, row).totalAnswers, 15);
  }
});
test('active Day 18 contains 12.1 only, with both preposition grammars and no new exercise', () => {
  const active = getSlidesByCourse('A1').filter(item => item.dayNumber === 18);
  assert.deepEqual(active.map(item => item.assignmentId), ['A1-12.1']);
  assert.match(active[0].workbookConnection.subtitle, /existing 12.1 exercise.*unchanged/i);
  assert.match(active[0].teacherNotesEn.join(' '), /mit, bei and zu/);
  assert.ok(getTeachingSlideByAssignmentId('A1-12.2'));
});
test('Day 19 is a required graded speaking assessment with three parts', () => {
  const slide = getTeachingSlideByAssignmentId('A1-5.9');
  assert.match(slide.workbookConnection.subtitle, /19 required assignments/);
  assert.equal(getA1LearningPath(slide).kind, 'graded-speaking');
  for (const n of [1,2,3]) assert.ok(slide.workbookConnection.parts.some(part => part.label.startsWith(`Teil ${n}`)));
});
