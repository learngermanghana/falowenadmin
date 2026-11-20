import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getTeachingSlideById } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getInteractiveLessonOpening } from '../src/data/interactiveLessonOpenings.js';
import { A2_DAY28_CLASSROOM_LISTENING, A2_DAY28_AUDIO_KEY } from '../src/data/a2Day28ClassroomListening.js';
import supplied from '../src/data/a2Day28ListeningQuestions.json' with { type: 'json' };

test('A2 Day 28 shows the classroom Hören after music, separately from graded workbook', () => {
  const slide = getTeachingSlideById('a2-day-28-zukunft');
  assert.equal(slide.assignmentId, 'A2-10.28');
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.equal(stages[1].type, 'teacher-lecture');
  assert.equal(stages[1].videoId, 'sXdXv5dreN0');
  assert.equal(stages[2].variant, 'interactive-music-video');
  assert.equal(stages[3].variant, 'interactive-listening');
  assert.equal(stages[3].audioKey, A2_DAY28_AUDIO_KEY);
  assert.equal(stages[3].listeningItems.length, 5);
  assert.equal(getInteractiveLessonOpening('A2-10.28')?.listening, A2_DAY28_CLASSROOM_LISTENING);
});

test('A2 Day 28 retains all five teacher-supplied options, evidence and correct answers', () => {
  assert.equal(A2_DAY28_AUDIO_KEY, 'a2/day-28/uber-die-zukunft-sprechen.mp3');
  assert.equal(supplied.kind, 'multiple-choice');
  assert.deepEqual(A2_DAY28_CLASSROOM_LISTENING.questions.map(q => q.correctIndex), [1, 0, 1, 2, 0]);
  A2_DAY28_CLASSROOM_LISTENING.questions.forEach((q, i) => {
    assert.equal(q.prompt, supplied.questions[i].question);
    assert.deepEqual(q.options, supplied.questions[i].options);
    assert.equal(q.evidence, supplied.questions[i].evidence);
    assert.equal(q.answer, q.options[q.correctIndex]);
  });
});

test('A2 Day 28 uses the staff-authenticated classroom audio route', () => {
  const source = readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx', import.meta.url), 'utf8');
  assert.match(source, /25, 26, 27, 28\]\.includes\(lesson\.listening\.day\)/);
  assert.match(source, /\/api\/course-media\/a2\/classroom-audio-url/);
});
