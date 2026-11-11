import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { getTeachingSlideById } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getInteractiveLessonOpening } from '../src/data/interactiveLessonOpenings.js';
import {
  A2_DAY4_CLASSROOM_AUDIO_KEY,
  A2_DAY4_CLASSROOM_LISTENING,
  A2_DAY4_CLASSROOM_QUESTIONS,
  A2_DAY4_CLASSROOM_TRANSCRIPT,
} from '../src/data/a2Day4ClassroomListening.js';

const slide = getTeachingSlideById('a2-day-4-treffen');
const stages = buildTeachingPresenterStages(slide, slide.topic);

test('A2 Day 4 teacher permalink retains music then adds separate Hören without removing lesson stages', () => {
  assert.equal(slide.assignmentId, 'A2-2.4');
  assert.equal(slide.dayNumber, 4);
  assert.equal(getInteractiveLessonOpening('A2-2.4').listening, A2_DAY4_CLASSROOM_LISTENING);
  assert.equal(stages[1].id, 'warmup');
  assert.equal(stages[1].variant, 'interactive-music-video');
  assert.equal(stages[1].musicVideo.musicLibraryUrl, 'https://music.falowen.app/?level=A2&day=4');
  assert.equal(stages[2].id, 'knowledge');
  assert.equal(stages[2].variant, 'interactive-listening');
  assert.equal(stages[2].audioDay, 4);
  assert.equal(stages[2].audioLevel, 'A2');
  assert.equal(stages[2].audioKey, A2_DAY4_CLASSROOM_AUDIO_KEY);
  assert.equal(stages[2].listeningItems.length, 6);
  assert.equal(stages[2].transcript.length, 10);
  assert.ok(stages.some(s => s.id === 'reading'));
  assert.ok(stages.some(s => s.id === 'scenario-challenge'));
  assert.ok(stages.some(s => s.id === 'workbook-presentation'));
  assert.equal(new Set(stages.map(s => s.id)).size, stages.length);
});

test('Day 4 questions and model answers use verbatim evidence from Mia/Lukas transcript', () => {
  assert.equal(A2_DAY4_CLASSROOM_AUDIO_KEY, 'a2/day-04/wo-mochten-wir-uns-treffen.mp3');
  assert.deepEqual(A2_DAY4_CLASSROOM_TRANSCRIPT.map(([who]) => who),
    ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B']);
  const transcript = A2_DAY4_CLASSROOM_TRANSCRIPT.map(([, text]) => text).join(' ');
  assert.match(transcript, /Hallo Mia/);
  assert.match(transcript, /Hallo Lukas/);
  assert.match(transcript, /Samstag um elf Uhr am Ausgang Nord/);
  assert.match(transcript, /Café am Marktplatz/);
  assert.match(transcript, /Buchhandlung/);
  assert.match(transcript, /besuchen wir den Park/);
  assert.deepEqual(A2_DAY4_CLASSROOM_QUESTIONS.map(x => x.correctIndex), [1, 2, 0, 0, 1, 2]);
  for (const item of A2_DAY4_CLASSROOM_QUESTIONS) {
    assert.equal(item.options.length, 3);
    assert.equal(item.answer, item.options[item.correctIndex]);
    assert.ok(transcript.includes(item.evidence), 'Question must reference the supplied dialogue exactly');
  }
});

// Run the real JSX component's Audio laden handler rather than a duplicate
// test implementation of the classroom route selection.
async function invokeAudioLaden(assignmentId) {
  const source = readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx', import.meta.url), 'utf8');
  const start = source.indexOf('  async function prepareAudio() {');
  const end = source.indexOf('\n\n  return <section', start);
  assert.ok(start >= 0 && end > start);
  assert.match(source.slice(end), /onClick=\{prepareAudio\}/);
  const handler = source.slice(start, end);
  const request = {};
  const state = {};
  const context = {
    listening: true,
    lesson: getInteractiveLessonOpening(assignmentId),
    requestCounter: {current: 0},
    auth: {currentUser: {getIdToken: async () => 'teacher-id-token'}},
    AUDIO_API: 'https://old-cloud-run.example',
    URLSearchParams,
    setAudioBusy: value => { state.busy = value; },
    setAudioError: value => { state.error = value; },
    setAudioUrl: value => { state.url = value; },
    fetch: async (url, options) => {
      request.url = String(url);
      request.options = options;
      return {ok: true, status: 200, json: async () => ({url: 'https://signed.example/meeting.mp3'})};
    },
  };
  await runInNewContext(`(async () => { ${handler}; await prepareAudio(); })()`, context);
  return {request, state};
}

test('Day 4 Audio laden requests the A2 classroom signer with day, exact R2 key and teacher token', async () => {
  const {request, state} = await invokeAudioLaden('A2-2.4');
  const url = new URL(request.url);
  assert.equal(url.origin, 'https://www.falowen.app');
  assert.equal(url.pathname, '/api/course-media/a2/classroom-audio-url');
  assert.equal(url.searchParams.get('day'), '4');
  assert.equal(url.searchParams.get('key'), A2_DAY4_CLASSROOM_AUDIO_KEY);
  assert.equal(request.options.method, 'GET');
  assert.equal(request.options.headers.Authorization, 'Bearer teacher-id-token');
  assert.equal(request.options.cache, 'no-store');
  assert.equal(state.busy, false);
  assert.equal(state.error, '');
  assert.equal(state.url, 'https://signed.example/meeting.mp3');
});

test('Day 4 addition does not change Day 24 audio routing', async () => {
  const {request} = await invokeAudioLaden('A2-9.24');
  const url = new URL(request.url);
  assert.equal(url.pathname, '/api/course-media/a2/classroom-audio-url');
  assert.equal(url.searchParams.get('day'), '24');
  assert.equal(url.searchParams.get('key'), 'a2/day-24/einen-urlaub-planen.mp3');
});
