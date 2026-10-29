import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { getReusableSongDraft, getReusableSongDrafts } from '../src/data/reusableMusicSongbook.js';
import { reviewMusicStory } from '../src/utils/musicStoryReview.js';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';
import { getMusicProductionProfile } from '../src/utils/musicProductionProfiles.js';
import { buildFalowenMusicPrompt } from '../src/utils/musicGenerationPrompt.js';
const require = createRequire(import.meta.url);
const { validate, reserve, extract, createHandler } = require('../functions/musicStudio');
const request = { mode: 'song', prompt: 'A quiet guitar song', requestId: '12345678-1234-1234-1234-123456789012' };
function database(initial = {}) {
  let state = initial;
  const ref = { get: async () => ({ data: () => state }) };
  return { collection: () => ({ doc: () => ref }), read: () => state,
    runTransaction: async fn => fn({ get: ref.get, set: (_, data) => { state = data; }, update: (_, data) => { state = { ...state, ...data }; } }) };
}
function response() { return { code: 200, set() {}, status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } }; }
test('reject arbitrary models, missing IDs and oversized prompts before billing', () => {
  assert.equal(validate(request).mode, 'song');
  for (const body of [{ ...request, mode: 'other' }, { ...request, requestId: '' }, { ...request, prompt: 'x'.repeat(8001) }]) assert.throws(() => validate(body));
});
test('enforce daily/monthly cap, lock and duplicate ID without spending again', async () => {
  const now = new Date('2026-10-27T12:00:00Z');
  for (const initial of [
    { day: '2026-10-27', dailyCents: 76 },
    { month: '2026-10', monthlyCents: 496 },
    { busyUntil: now.getTime() + 10000 },
    { month: '2026-10', attempts: [request.requestId] },
  ]) {
    const db = database(initial);
    await assert.rejects(reserve(db, request, now));
    assert.deepEqual(db.read(), initial);
  }
});
test('new calendar month resets usage and reserves cost before generation', async () => {
  const db = database({ day: '2026-09-30', month: '2026-09', monthlyCents: 500, dailyCents: 80 });
  await reserve(db, request, new Date('2026-10-01T00:00:00Z'));
  assert.equal(db.read().monthlyCents, 8);
  assert.equal(db.read().dailyCents, 8);
});
test('extract MP3 and lyric blocks, reject missing audio', () => {
  assert.equal(extract({ steps: [{ type: 'model_output', content: [{ type: 'audio', data: 'YWJj', mime_type: 'audio/mpeg' }, { type: 'text', text: 'Hallo!' }] }] }).lyrics, 'Hallo!');
  assert.throws(() => extract({ steps: [] }));
});
test('unauthenticated and non-owner callers cannot access budget or provider', async () => {
  for (const verifyToken of [async () => { throw Error(); }, async () => ({ uid: 'not-owner' })]) {
    let called = false;
    const handler = createHandler({ db: { collection: () => { called = true; } }, verifyToken, key: () => 'test', runtimeConfig: { ai_studio: { owner_uid: 'owner' } } });
    const res = response(); await handler({ headers: {}, method: 'POST', body: request }, res);
    assert.ok([401, 403].includes(res.code)); assert.equal(called, false);
  }
});
test('failed Google calls stay counted, release lock, and never retry', async () => {
  const db = database(); let calls = 0;
  const handler = createHandler({ db, verifyToken: async () => ({ uid: 'owner' }), key: () => 'test', runtimeConfig: { ai_studio: { owner_uid: 'owner' } }, fetchImpl: async () => { calls++; return { ok: false, status: 429 }; } });
  const res = response(); await handler({ headers: {}, method: 'POST', body: request }, res);
  assert.equal(res.code, 429); assert.equal(calls, 1); assert.equal(db.read().dailyCents, 8); assert.equal(db.read().busyUntil, 0);
  const duplicate = response(); await handler({ headers: {}, method: 'POST', body: request }, duplicate);
  assert.equal(duplicate.code, 409); assert.equal(calls, 1);
});
test('successful generation uses stateless Google API and returns downloadable MP3', async () => {
  const db = database();
  const handler = createHandler({ db, verifyToken: async () => ({ uid: 'owner' }), key: () => 'test', runtimeConfig: { ai_studio: { owner_uid: 'owner' } }, fetchImpl: async (_, options) => {
    assert.equal(JSON.parse(options.body).store, false); assert.equal(JSON.parse(options.body).model, 'lyria-3.5');
    return { ok: true, json: async () => ({ steps: [{ type: 'model_output', content: [{ type: 'audio', data: 'YWJj' }] }] }) };
  } });
  const res = response(); await handler({ headers: {}, method: 'POST', body: request }, res);
  assert.equal(res.code, 200); assert.equal(res.body.audio, 'YWJj'); assert.equal(db.read().busyUntil, 0);
  assert.equal(JSON.stringify(db.read()).includes(request.prompt), false);
});

test('Ghanaian highlife keeps German lyrics intact and adds instrumental frikyiwa', () => {
  for (const id of ['A1-4', 'A2-9.23', 'B1-8.24']) {
    const song = getReusableSongDraft(id);
    assert.equal(song.genre, 'Ghanaian Highlife');
    assert.match(song.musicStyle, /frikyiwa/i);
    assert.match(song.musicStyle, /ko-ko-ko/);
    assert.match(song.musicStyle, /guitar/i);
    assert.doesNotMatch(song.lyrics, /ko-ko-ko|frikyiwa/i);
  }
  const palette = getMusicProductionProfile('ghana-highlife');
  assert.equal(palette.id, 'ghana-highlife');
  const song = getReusableSongDraft('A1-4');
  const prompt = buildFalowenMusicPrompt({ brief: song.musicStyle, lyrics: song.lyrics,
    productionProfile: 'ghana-highlife', durationSeconds: 150 });
  assert.match(prompt, /three short crisp offbeat taps/);
  assert.match(prompt, /VOICE FIRST/);
  assert.ok(prompt.includes(song.lyrics));
});

test('published MP3s stay untouched while 84 course song drafts shed their promo endings', () => {
  const all = ['A1', 'A2', 'B1'].flatMap(level => getReusableSongDrafts(level));
  assert.equal(all.length, 84);
  for (const draft of all) {
    assert.doesNotMatch(draft.lyrics.split('[Outro]')[1] || '', /Falowen/i, draft.assignmentKey);
  }
  const cafe = getReusableSongDraft('A1-3.5');
  assert.match(cafe.lyrics, /mein Geld ist nicht da/);
  assert.match(cafe.lyrics, /Bus steht noch da/);
  assert.equal(reviewMusicStory(cafe.lyrics).issues.length, 0);
  const old = reviewMusicStory('[Verse 1] Cafe.\\n[Chorus] Zwei Tees, vier Euro, halb drei.\\n[Verse 2] Kuchen.\\n[Outro] Bei Falowen zählen wir.');
  assert.match(old.issues.join(' '), /advertisement/);
});
