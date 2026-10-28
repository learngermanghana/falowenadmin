import test from 'node:test';
import assert from 'node:assert/strict';
import { A2_DAY19_LISTENING } from '../src/data/a2Day19Listening.js';
import { getSlidesByCourse } from '../src/data/teachingSlides.js';
import { getInteractiveLessonOpening } from '../src/data/interactiveLessonOpenings.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';

test('Day 19 classroom recording uses the uploaded script and evidence-backed questions', () => {
  const task = A2_DAY19_LISTENING;
  assert.equal(task.audioKey, 'a2/day-19/einkaufen-wo-und-wie.mp3');
  assert.equal(task.transcript.length, 8);
  const text = task.transcript.map(row => row[1]).join(' ');
  assert.deepEqual(task.questions.map(q => q.answer), ['Richtig','Richtig','Falsch','Richtig','Falsch']);
  for (const q of task.questions) {
    assert.ok(text.includes(q.evidence));
    assert.equal(q.options[q.correctIndex], q.answer);
  }
  assert.equal(task.questions[1].prompt, 'Anna fragt, ob der Wochenmarkt zu teuer ist.');
});

test('Day 19 adds only selected listening, preserving Lesen, correction and speaking', () => {
  const slide = getSlidesByCourse('A2').find(s => s.assignmentId === 'A2-7.19');
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.equal(getInteractiveLessonOpening(slide.assignmentId).listening, A2_DAY19_LISTENING);
  assert.deepEqual(stages.slice(0,6).map(s=>s.id), ['intro','warmup','knowledge','common-mistakes','reading','grammar-check']);
  assert.equal(stages[2].variant, 'interactive-listening');
  assert.equal(stages[2].audioKey, A2_DAY19_LISTENING.audioKey);
  assert.equal(stages[2].listeningItems.length, 5);
  assert.equal(stages[4].title, 'Günstig gekauft?');
  assert.equal(stages.find(s=>s.id==='questions').items.length, 3);
  assert.equal(stages[1].musicVideo, undefined);
  assert.equal(getCuratedMusicByAssignment('A2-7.18').objectKey, 'music/a2/day-18/die-karte-funktioniert-nicht.mp3');
});
