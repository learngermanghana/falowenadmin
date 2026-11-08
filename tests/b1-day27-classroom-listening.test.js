import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getSlidesByCourse } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages, isTeachingPresenterV2Slide } from '../src/utils/teachingPresenter.js';
import { B1_DAY27_AUDIO_KEY } from '../src/data/b1Day27Listening.js';

test('Day 27 route uses V2 with published music followed by the matching six-question audio', () => {
  const slide = getSlidesByCourse('B1').find(s => s.id === 'b1-day-27-umweltfreundlich-alltag');
  assert.equal(slide.assignmentId, 'B1-10.27');
  assert.equal(isTeachingPresenterV2Slide(slide), true);
  const stages = buildTeachingPresenterStages(slide);
  assert.equal(stages[1].variant, 'interactive-music-video');
  assert.equal(stages[1].musicVideo.musicLibraryUrl, 'https://music.falowen.app/?level=B1&day=27');
  assert.equal(stages[2].variant, 'interactive-listening');
  assert.equal(stages[2].audioKey, B1_DAY27_AUDIO_KEY);
  assert.equal(stages[2].audioLevel, 'B1');
  assert.equal(stages[2].audioDay, 27);
  assert.deepEqual(stages[2].listeningItems.map(q => q.correctIndex), [0,1,2,0,1,2]);
  assert.ok(stages[2].listeningItems.every(q => q.options.length === 3 && q.evidence && q.hint && q.answer));
  assert.ok(stages.some(s => s.id === 'reading'));
  assert.ok(stages.some(s => s.id === 'common-mistakes'));
});

test('Day 27 uses the configured staff-only exact-key gateway', () => {
  const source = readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('lesson.listening.day === 27'));
  assert.ok(source.includes(B1_DAY27_AUDIO_KEY));
  assert.ok(source.includes('|| isB1Day27Classroom'));
});

test('Day 27 presents three scenario role-plays before speaking questions, like Day 26', () => {
 const slide = getSlidesByCourse('B1').find(s => s.assignmentId === 'B1-10.27');
 const stages = buildTeachingPresenterStages(slide);
 const scenario = stages.findIndex(s => s.id === 'scenario-challenge');
 const speaking = stages.findIndex(s => s.id === 'questions');
 assert.ok(scenario >= 0 && speaking > scenario);
 assert.equal(stages[scenario].items.length, 3);
 assert.ok(stages[scenario].items.every(s => s.steps.length === 3));
});
