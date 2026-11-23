import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import supplied from '../src/data/a2Day8RestaurantQuestions.json' with { type: 'json' };
import { getTeachingSlideById } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getInteractiveLessonOpening, isInteractiveOpeningStage } from '../src/data/interactiveLessonOpenings.js';
import { A2_DAY8_RESTAURANT_AUDIO_KEY } from '../src/data/a2Day8RestaurantListening.js';
import { getCuratedMusicByAssignment } from '../src/data/curatedLessonMusic.js';

const slide = getTeachingSlideById('a2-day-8-rezepte-essen');
const stages = buildTeachingPresenterStages(slide, slide.topic);
const listening = getInteractiveLessonOpening('A2-3.8').listening;

test('A2 Day 8 keeps its song and adds a separate interactive classroom Hören stage', () => {
  assert.equal(slide.assignmentId, 'A2-3.8');
  assert.equal(slide.dayNumber, 8);
  assert.equal(stages[1].id, 'warmup');
  assert.equal(stages[1].variant, 'interactive-music-video');
  assert.equal(stages[2].id, 'knowledge');
  assert.equal(stages[2].variant, 'interactive-listening');
  assert.equal(stages[2].audioKey, A2_DAY8_RESTAURANT_AUDIO_KEY);
  assert.equal(stages[2].audioLevel, 'A2');
  assert.equal(stages[2].audioDay, 8);
  assert.equal(stages[2].listeningItems.length, 5);
  assert.equal(isInteractiveOpeningStage('A2-3.8', 'knowledge'), true);
  assert.equal(getCuratedMusicByAssignment('A2-3.8').status, 'published');
  assert.ok(stages.some(stage => stage.id === 'reading'));
  assert.match(slide.workbookConnection.parts.find(part => part.label.includes('Hören')).detailEn, /Unchanged original listening task/i);
});

test('the five Richtig/Falsch prompts, answers and quoted evidence match the teacher upload', () => {
  assert.equal(supplied.mode, 'course');
  assert.equal(supplied.level, 'A2');
  assert.equal(supplied.kind, 'richtig-falsch');
  assert.equal(listening.audioKey, 'a2/day-08/im-restaurant-bestellen-und-reagieren.mp3');
  assert.deepEqual(listening.questions.map(q => q.answer), ['Richtig', 'Falsch', 'Richtig', 'Falsch', 'Richtig']);
  assert.equal(listening.transcript.length, 0, 'Do not invent a full transcript without source text');
  assert.equal(supplied.questions.length, 5);
  supplied.questions.forEach((original, i) => {
    const q = listening.questions[i];
    assert.equal(q.prompt, original.question);
    assert.equal(q.evidence, original.evidence);
    assert.equal(q.answer, original.answer);
    assert.deepEqual(q.options, ['Richtig', 'Falsch']);
    assert.equal(q.options[q.correctIndex], q.answer);
    assert.ok(q.explanation.includes(original.evidence));
  });
});

test('the live Audio laden handler requests authenticated Day 8 classroom signing, never a public bucket URL', async () => {
  const source = readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx', import.meta.url), 'utf8');
  const start = source.indexOf('  async function prepareAudio() {');
  const end = source.indexOf('\n\n  return <section', start);
  assert.ok(start >= 0 && end > start);
  const handler = source.slice(start, end);
  let request = null;
  const state = { busy: null, error: null, url: null };
  await runInNewContext(`(async () => { ${handler}; await prepareAudio(); })()`, {
    listening: true,
    lesson: getInteractiveLessonOpening('A2-3.8'),
    requestCounter: { current: 0 },
    auth: { currentUser: { getIdToken: async () => 'teacher-token' } },
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
  assert.equal(uri.searchParams.get('day'), '8');
  assert.equal(uri.searchParams.get('key'), A2_DAY8_RESTAURANT_AUDIO_KEY);
  assert.equal(request.options.headers.Authorization, 'Bearer teacher-token');
  assert.equal(request.options.cache, 'no-store');
  assert.equal(state.url, 'https://private-signed.example/audio.mp3');
  assert.equal(state.error, '');
  assert.equal(state.busy, false);
});
