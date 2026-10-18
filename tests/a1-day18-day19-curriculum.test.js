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

test('canonical session groups cannot reintroduce retired 12.2 IDs', async () => {
  const { courseDictionary, retiredCourseDictionary } = await import('../src/data/courseDictionary.js');
  const { getCourseSessionGroups } = await import('../src/data/courseSessionGroups.js');
  const { buildDisplayedCurriculumPatch } = await import('../src/utils/liveClassCurriculumSync.js');
  assert.equal(courseDictionary.A1['A1-12.2'], undefined);
  assert.ok(retiredCourseDictionary.A1['A1-12.2']);
  const groups = getCourseSessionGroups('A1');
  const day18 = groups.find(group => group.day === 18);
  for (const field of ['assignmentIds', 'chapterIds', 'curriculumIds']) {
    assert.deepEqual(day18[field], ['A1-12.1']);
    assert.ok(groups.every(group => !group[field].includes('A1-12.2')));
  }
  const patch = buildDisplayedCurriculumPatch({ assignmentIds: ['A1-12.1', 'A1-12.2'] }, {
    ...day18, curriculumDay: 18, curriculumIndex: day18.index,
  });
  for (const field of ['assignmentIds', 'chapterIds', 'curriculumIds']) assert.deepEqual(patch[field], ['A1-12.1']);
});

test('active 12.1 teaches and practises mit, bei and zu in all teaching surfaces', async () => {
  const { buildTeacherSlideSupport } = await import('../src/data/teacherSlideSupport.js');
  const { getA1Days16To20UnderstandingChecks, getA1Days16To20QuickChecks, getA1Days16To20ApplicationChecks } = await import('../src/data/a1Days16To20Understanding.js');
  const { getA1GrammarChecks } = await import('../src/data/a1GrammarChecks.js');
  const { A1_EVERYDAY_SPEAKING } = await import('../src/data/a1EverydaySpeaking.js');
  const slide = getTeachingSlideByAssignmentId('A1-12.1');
  const groups = [slide.objective, slide.keyPhrasesDe, slide.studentQuestionsDe, slide.interactionFlow,
    buildTeacherSlideSupport(slide).modelExamplesDe,
    getA1Days16To20UnderstandingChecks('A1-12.1'), getA1Days16To20QuickChecks('A1-12.1'),
    getA1Days16To20ApplicationChecks('A1-12.1'), getA1GrammarChecks('A1-12.1', slide), A1_EVERYDAY_SPEAKING['A1-12.1']];
  for (const group of groups) assert.match(JSON.stringify(group), /mit|bei|zu/);
  const checks = JSON.stringify(getA1Days16To20UnderstandingChecks('A1-12.1'));
  for (const form of ['mit dem Bus', 'beim Arzt', 'zum Arzt', 'zur Arbeit']) assert.ok(checks.includes(form), form);
});
