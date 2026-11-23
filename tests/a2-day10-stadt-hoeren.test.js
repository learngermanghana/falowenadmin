import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import supplied from '../src/data/a2Day10StadtQuestions.json' with { type: 'json' };
import { getTeachingSlideById } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from '../src/data/interactiveLessonOpenings.js';
import { A2_DAY10_STADT_AUDIO_KEY } from '../src/data/a2Day10StadtListening.js';

const slide = getTeachingSlideById('a2-day-10-stadt-entdecken');
const stages = buildTeachingPresenterStages(slide, slide.topic);
const listening = getInteractiveLessonOpening('A2-4.10').listening;

test('A2 Day 10 keeps lesson music and adds ungraded city Hören as slide 3', () => {
  assert.equal(slide.assignmentId, 'A2-4.10');
  assert.equal(slide.dayNumber, 10);
  assert.equal(stages[1].id, 'warmup');
  assert.equal(stages[1].variant, 'interactive-music-video');
  assert.equal(stages[2].id, 'knowledge');
  assert.equal(stages[2].variant, 'interactive-listening');
  assert.equal(stages[2].audioKey, A2_DAY10_STADT_AUDIO_KEY);
  assert.equal(stages[2].audioLevel, 'A2');
  assert.equal(stages[2].audioDay, 10);
  assert.equal(stages[2].listeningItems.length, 5);
  assert.equal(isInteractiveOpeningStage('A2-4.10', 'knowledge'), true);
  assert.ok(stages.some(stage => stage.id === 'reading'));
  assert.ok(stages.some(stage => stage.id === 'workbook-presentation'));
  assert.ok(stages.some(stage => stage.id === 'workbook'));
  assert.ok(slide.workbookConnection.parts.some(part => part.label.includes('Schreiben')));
  assert.match(slide.workbookConnection.parts.find(part => part.label.includes('Hören')).detailEn, /Oktoberfest/i);
});

test('five original multiple-choice questions, correct choices and evidence remain unchanged', () => {
  assert.equal(supplied.mode, 'course');
  assert.equal(supplied.level, 'A2');
  assert.equal(supplied.kind, 'multiple-choice');
  assert.equal(listening.audioKey, 'a2/day-10/eine-stadt-entdecken-und-etwas-erleben.mp3');
  assert.deepEqual(listening.questions.map(q => q.correctIndex), [0, 1, 1, 0, 2]);
  assert.equal(listening.transcript.length, 0, 'Do not invent a full transcript');
  assert.equal(supplied.questions.length, 5);
  for (const [i, original] of supplied.questions.entries()) {
    const q = listening.questions[i];
    assert.equal(q.prompt, original.question);
    assert.deepEqual([...q.options], original.options);
    assert.equal(q.correctIndex, original.correctIndex);
    assert.equal(q.answer, original.options[original.correctIndex]);
    assert.equal(q.evidence, original.evidence);
    assert.ok(q.explanation.includes(original.evidence));
  }
});

test('Audio laden calls authenticated Day 10 signer rather than exposing the private R2 object', async () => {
  const source = readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx', import.meta.url), 'utf8');
  const start = source.indexOf('  async function prepareAudio() {');
  const end = source.indexOf('\n\n  return <section', start);
  assert.ok(start >= 0 && end > start);
  const handler = source.slice(start, end);
  let request = null;
  const state = {busy: null, error: null, url: null};
  await runInNewContext(`(async () => { ${handler}; await prepareAudio(); })()`, {
    listening: true,
    lesson: getInteractiveLessonOpening('A2-4.10'),
    requestCounter: {current: 0},
    auth: {currentUser: {getIdToken: async () => 'teacher-token'}},
    AUDIO_API: 'https://cloud-run.example',
    URLSearchParams,
    setAudioBusy: value => { state.busy = value; },
    setAudioError: value => { state.error = value; },
    setAudioUrl: value => { state.url = value; },
    fetch: async (url, options) => {
      request = {url: String(url), options};
      return {ok: true, status: 200, json: async () => ({url: 'https://private-signed.example/audio.mp3'})};
    },
  });
  assert.ok(request);
  const uri = new URL(request.url);
  assert.equal(uri.origin, 'https://www.falowen.app');
  assert.equal(uri.pathname, '/api/course-media/a2/classroom-audio-url');
  assert.equal(uri.searchParams.get('day'), '10');
  assert.equal(uri.searchParams.get('key'), A2_DAY10_STADT_AUDIO_KEY);
  assert.equal(request.options.headers.Authorization, 'Bearer teacher-token');
  assert.equal(request.options.cache, 'no-store');
  assert.equal(state.url, 'https://private-signed.example/audio.mp3');
  assert.equal(state.error, '');
  assert.equal(state.busy, false);
});
