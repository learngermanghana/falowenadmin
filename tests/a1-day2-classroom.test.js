import test from 'node:test';
import assert from 'node:assert/strict';
import { A1_DAY2_LESSON_ID, A1_DAY2_CLASSROOM_STAGES, A1_DAY2_PRONOUNS, A1_DAY2_QUIZ } from '../src/data/a1Day2Classroom.js';
import { getTeachingSlideById } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
test('the combined A1 Day 2 curriculum uses exactly twelve approved teaching stages',()=>{
  assert.equal(A1_DAY2_LESSON_ID,'a1-0-2-1-1');
  assert.ok(getTeachingSlideById(A1_DAY2_LESSON_ID));
  assert.equal(A1_DAY2_CLASSROOM_STAGES.length,12);
  assert.deepEqual(A1_DAY2_CLASSROOM_STAGES.map(stage=>stage.step),[
    'welcome','alphabet','special','spell','pronouns','verbs','sentences',
    'practice','partners','music','music-challenge','recap',
  ]);
  assert.equal(new Set(A1_DAY2_CLASSROOM_STAGES.map(stage=>stage.id)).size,12);
  assert.ok(buildTeachingPresenterStages(getTeachingSlideById(A1_DAY2_LESSON_ID)).length>0);
});
test('Day 2 exclusively teaches singular pronouns and exact reviewed conjugations',()=>{
  assert.deepEqual(A1_DAY2_PRONOUNS.map(p=>p.de),['ich','du','er','sie','es']);
  for(const [verb,forms] of Object.entries({
    heißen:['heiße','heißt','heißt','heißt','heißt'],
    wohnen:['wohne','wohnst','wohnt','wohnt','wohnt'],
    kommen:['komme','kommst','kommt','kommt','kommt'],
  })) assert.deepEqual(A1_DAY2_PRONOUNS.map(p=>p[verb]),forms);
  assert.equal(A1_DAY2_QUIZ.length,5);
  assert.ok(A1_DAY2_QUIZ.every(q=>q.options[q.answer]));
});
