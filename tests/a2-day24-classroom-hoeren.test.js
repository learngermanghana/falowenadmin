import test from 'node:test';
import assert from 'node:assert/strict';
import { getTeachingSlideById } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getInteractiveLessonOpening } from '../src/data/interactiveLessonOpenings.js';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';
import {
  A2_DAY24_CLASSROOM_AUDIO_KEY,
  A2_DAY24_CLASSROOM_TRANSCRIPT,
  A2_DAY24_CLASSROOM_QUESTIONS,
} from '../src/data/a2Day24ClassroomListening.js';

const slide = getTeachingSlideById('a2-day-24-urlaub-planen');
const stages = buildTeachingPresenterStages(slide, slide.topic);

test('A2 Day 24 teacher permalink keeps lesson music followed by private classroom Hören', () => {
  assert.equal(slide.assignmentId, 'A2-9.24');
  assert.equal(slide.dayNumber, 24);
  assert.equal(getInteractiveLessonOpening('A2-9.24').listening.audioKey, A2_DAY24_CLASSROOM_AUDIO_KEY);
  assert.equal(stages[1].id, 'warmup');
  assert.equal(stages[1].variant, 'interactive-music-video');
  assert.equal(stages[2].id, 'knowledge');
  assert.equal(stages[2].variant, 'interactive-listening');
  assert.equal(stages[2].audioLevel, 'A2');
  assert.equal(stages[2].audioDay, 24);
  assert.equal(stages[2].audioKey, 'a2/day-24/einen-urlaub-planen.mp3');
  assert.equal(stages[2].listeningItems.length, 5);
  assert.equal(stages[2].transcript.length, 9);
  assert.equal(new Set(stages.map(stage => stage.id)).size, stages.length);
  assert.equal(getCuratedMusicByAssignment('A2-9.24').objectKey, 'music/a2/day-24/Endlich Urlaub.mp3');
});

test('Day 24 Hören questions and answer key are grounded in the supplied Anna/Lukas script', () => {
  assert.deepEqual(A2_DAY24_CLASSROOM_TRANSCRIPT.map(([speaker]) => speaker),
    ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A']);
  const dialogue = A2_DAY24_CLASSROOM_TRANSCRIPT.map(([, words]) => words).join(' ');
  assert.match(dialogue, /nach Spanien reisen/);
  assert.match(dialogue, /Anfang Juli/);
  assert.match(dialogue, /in einem ruhigen Hotel am Meer/);
  assert.match(dialogue, /Meine Schwester kommt mit/);
  assert.match(dialogue, /den Reisepass zu prüfen/);
  assert.deepEqual(A2_DAY24_CLASSROOM_QUESTIONS.map(item => item.correctIndex), [0, 1, 2, 0, 1]);
  for (const question of A2_DAY24_CLASSROOM_QUESTIONS) {
    assert.equal(question.options.length, 3);
    assert.equal(question.answer, question.options[question.correctIndex]);
    assert.ok(dialogue.includes(question.evidence), 'Every answer must cite the supplied script');
  }
  assert.match(slide.workbookConnection.parts.find(item => item.label.includes('Hören')).detailEn, /graded/i,
    'The existing workbook Hören remains separate and graded');
});
