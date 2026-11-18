import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getTeachingSlideById } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from '../src/data/interactiveLessonOpenings.js';
import { A2_DAY7_LISTENING, A2_DAY7_AUDIO_KEY } from '../src/data/a2Day7ClassroomListening.js';
import supplied from '../src/data/a2Day7ListeningQuestions.json' with { type: 'json' };

test('A2 Day 7 keeps music followed immediately by the separate Hören stage', () => {
  const slide = getTeachingSlideById('a2-day-7-wohnung-suchen');
  assert.equal(slide.assignmentId, 'A2-3.7');
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.equal(stages[1].variant, 'interactive-music-video');
  assert.equal(stages[2].id, 'knowledge');
  assert.equal(stages[2].variant, 'interactive-listening');
  assert.equal(stages[2].audioKey, A2_DAY7_AUDIO_KEY);
  assert.equal(stages[2].listeningItems.length, 5);
  assert.equal(isInteractiveOpeningStage('A2-3.7', 'knowledge'), true);
  assert.equal(getInteractiveLessonOpening('A2-3.7')?.listening, A2_DAY7_LISTENING);
  assert.equal(stages[2].transcript.length, 0);
});

test('classroom audio and all five Richtig/Falsch statements preserve teacher key', () => {
  assert.equal(A2_DAY7_AUDIO_KEY, 'a2/day-07/eine-wohnung-suchen.mp3');
  assert.equal(supplied.kind, 'richtig-falsch');
  assert.deepEqual(A2_DAY7_LISTENING.questions.map(x => x.correctIndex), [1, 0, 0, 1, 0]);
  A2_DAY7_LISTENING.questions.forEach((q, i) => {
    assert.equal(q.prompt, supplied.questions[i].question);
    assert.equal(q.evidence, supplied.questions[i].evidence);
    assert.equal(q.answer, supplied.questions[i].answer);
    assert.deepEqual(q.options, ['Richtig', 'Falsch']);
  });
});

test('A2 Day 7 requests the authenticated classroom signer', () => {
  const source = readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx', import.meta.url), 'utf8');
  assert.match(source, /\[1, 2, 3, 4, 5, 7, 18, 19, 20, 21, 23, 24, 25, 26\]\.includes\(lesson\.listening\.day\)/);
  assert.match(source, /https:\/\/www\.falowen\.app\/api\/course-media\/a2\/classroom-audio-url/);
});
