import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
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


// Execute the actual prepareAudio handler used by the "Audio laden" button.
// The handler is plain async JavaScript within the JSX module; extracting only
// the handler avoids mocking the whole React renderer or testing a duplicate
// endpoint-selection implementation.
async function invokeAudioLaden(assignmentId) {
  const source = readFileSync(new URL('../src/components/InteractiveLessonOpening.jsx', import.meta.url), 'utf8');
  const start = source.indexOf('  async function prepareAudio() {');
  const end = source.indexOf('\n\n  return <section', start);
  assert.ok(start >= 0 && end > start, 'The live prepareAudio handler must be present');
  assert.match(source.slice(end), /onClick=\{prepareAudio\}/, 'Audio laden must call the tested handler');
  const handler = source.slice(start, end);
  const request = {url: null, options: null};
  const state = {busy: null, audioError: null, audioUrl: null};
  const context = {
    listening: true,
    lesson: getInteractiveLessonOpening(assignmentId),
    requestCounter: {current: 0},
    auth: {currentUser: {getIdToken: async () => 'teacher-token'}},
    AUDIO_API: 'https://cloud-run.example',
    URLSearchParams,
    setAudioBusy: value => { state.busy = value; },
    setAudioError: value => { state.audioError = value; },
    setAudioUrl: value => { state.audioUrl = value; },
    fetch: async (url, options) => {
      request.url = String(url);
      request.options = options;
      return {ok: true, status: 200, json: async () => ({url: 'https://signed.example/audio.mp3'})};
    },
  };
  await runInNewContext(`(async () => { ${handler}; await prepareAudio(); })()`, context);
  return {request, state};
}

test('Audio laden for A2 Day 24 sends the authenticated request to the private classroom signer', async () => {
  const {request, state} = await invokeAudioLaden('A2-9.24');
  const uri = new URL(request.url);
  assert.equal(uri.origin, 'https://www.falowen.app');
  assert.equal(uri.pathname, '/api/course-media/a2/classroom-audio-url');
  assert.equal(uri.searchParams.get('day'), '24');
  assert.equal(uri.searchParams.get('key'), A2_DAY24_CLASSROOM_AUDIO_KEY);
  assert.equal(request.options.method, 'GET');
  assert.equal(request.options.headers.Authorization, 'Bearer teacher-token');
  assert.equal(request.options.cache, 'no-store');
  assert.equal(state.audioUrl, 'https://signed.example/audio.mp3');
  assert.equal(state.audioError, '');
  assert.equal(state.busy, false);
});

test('Actual audio request routing preserves Day 23 classroom and B1 Day 27 signers', async () => {
  const a2 = await invokeAudioLaden('A2-9.23');
  assert.equal(new URL(a2.request.url).pathname, '/api/course-media/a2/classroom-audio-url');
  assert.equal(new URL(a2.request.url).searchParams.get('day'), '23');

  const b1 = await invokeAudioLaden('B1-10.27');
  const url = new URL(b1.request.url);
  assert.equal(url.pathname, '/api/course-media/classroom/audio-url');
  assert.equal(url.searchParams.get('level'), 'B1');
  assert.equal(url.searchParams.get('day'), '27');
});
