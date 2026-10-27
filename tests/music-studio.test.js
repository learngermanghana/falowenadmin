import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
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
