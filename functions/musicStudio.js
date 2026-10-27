"use strict";
const { isStudioOwner } = require('./hoerenStudioApi');
const MODELS = Object.freeze({ clip: { id: 'lyria-3-clip-preview', cents: 4 }, song: { id: 'lyria-3.5', cents: 8 } });
const LIMITS = Object.freeze({ dailyCents: 80, monthlyCents: 500 });
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
function validate(body = {}) {
  const mode = body.mode || 'clip';
  if (!Object.hasOwn(MODELS, mode)) throw fail('Choose a preview or full song.');
  if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 8000) throw fail('Enter a music brief and lyrics (up to 8,000 characters).');
  if (!/^[a-f0-9-]{36}$/i.test(body.requestId || '')) throw fail('A valid request ID is required.');
  return { mode, prompt: body.prompt.trim(), requestId: body.requestId };
}
// One fixed private ledger: no scans, listeners, jobs, or ever-growing attempt collection.
// Reserve before Google, including unsuccessful calls: timeouts can still be billable.
async function reserve(db, request, now = new Date()) {
  const ref = db.collection('musicStudioPrivate').doc('budget');
  const day = now.toISOString().slice(0, 10), month = day.slice(0, 7);
  return db.runTransaction(async tx => {
    const old = (await tx.get(ref)).data() || {};
    const attempts = old.month === month ? (old.attempts || []) : [];
    if (attempts.includes(request.requestId)) throw fail('This request was already submitted. No duplicate generation was started.', 409);
    if (Number(old.busyUntil || 0) > now.getTime()) throw fail('A song is already being generated. Wait before starting another.', 409);
    const daily = old.day === day ? Number(old.dailyCents || 0) : 0;
    const monthly = old.month === month ? Number(old.monthlyCents || 0) : 0;
    const cost = MODELS[request.mode].cents;
    if (daily + cost > LIMITS.dailyCents || monthly + cost > LIMITS.monthlyCents) throw fail('Music budget reached. Daily limit: $0.80; monthly limit: $5.00 (Google estimates).', 429);
    tx.set(ref, { day, month, dailyCents: daily + cost, monthlyCents: monthly + cost, attempts: [...attempts, request.requestId], activeRequest: request.requestId, busyUntil: now.getTime() + 300000 });
    return { ref, dailyCents: daily + cost, monthlyCents: monthly + cost };
  });
}
function extract(result) {
  const blocks = (result.steps || []).filter(s => s.type === 'model_output').flatMap(s => s.content || []);
  const audio = blocks.filter(b => b.type === 'audio' && b.data).at(-1) || result.output_audio;
  if (!audio?.data || !['audio/mpeg', 'audio/mp3'].includes(audio.mime_type || 'audio/mpeg')) throw fail('Google did not return an MP3. Your attempt remains counted; no automatic retry was made.', 502);
  if (audio.data.length > 28 * 1024 * 1024 || !/^[A-Za-z0-9+/\r\n]*={0,2}$/.test(audio.data)) throw fail('Google returned an invalid or oversized audio response.', 502);
  return { audio: audio.data, mimeType: 'audio/mpeg', lyrics: blocks.filter(b => b.type === 'text').map(b => b.text || '').join('\n') };
}
function createHandler({ db, verifyToken, key, runtimeConfig = {}, fetchImpl = fetch }) {
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    let user;
    try { user = await verifyToken(String(req.headers.authorization || '').replace(/^Bearer /, '')); }
    catch { return res.status(401).json({ ok: false, error: 'Sign in with your Falowen owner account.' }); }
    if (!isStudioOwner(user.uid, runtimeConfig)) return res.status(403).json({ ok: false, error: 'Music Studio is owner-only.' });
    let slot, request;
    try {
      if (req.method === 'GET') {
        const usage = (await db.collection('musicStudioPrivate').doc('budget').get()).data() || {};
        const today = new Date().toISOString().slice(0, 10);
        return res.json({ ok: true, ready: Boolean(key()), limits: LIMITS, dailyCents: usage.day === today ? usage.dailyCents : 0, monthlyCents: usage.month === today.slice(0, 7) ? usage.monthlyCents : 0 });
      }
      if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' });
      request = validate(req.body);
      if (!key()) throw fail('The Google music API key is not configured.', 503);
      slot = await reserve(db, request);
      const response = await fetchImpl('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key() },
        body: JSON.stringify({ model: MODELS[request.mode].id, input: request.prompt, store: false }),
        signal: AbortSignal.timeout(270000),
      });
      if (!response.ok) throw fail(response.status === 429 ? 'Google is rate-limiting music generation. No automatic retry was made.' : 'Google could not generate this music. Check model access, billing, or revise the prompt. No automatic retry was made.', response.status === 429 ? 429 : 502);
      const output = extract(await response.json());
      return res.json({ ok: true, ...output, dailyCents: slot.dailyCents, monthlyCents: slot.monthlyCents });
    } catch (error) {
      return res.status(error.status || 502).json({ ok: false, error: error.status ? error.message : 'Generation did not complete. It may still be billed and remains counted. No automatic retry was made.' });
    } finally {
      if (slot) {
        try { await db.runTransaction(async tx => {
          const data = (await tx.get(slot.ref)).data();
          if (data?.activeRequest === request.requestId) tx.update(slot.ref, { busyUntil: 0 });
        }); } catch { /* The lock expires safely; no refund and no retry. */ }
      }
    }
  };
}
module.exports = { MODELS, LIMITS, validate, reserve, extract, createHandler };
