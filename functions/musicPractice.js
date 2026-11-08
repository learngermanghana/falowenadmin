'use strict';

// Authenticated Campus listening summaries. No public GA4 identity linkage,
// AI calls, heartbeat writes, per-second events, or scheduled processing.
const crypto = require('node:crypto');
const { isStudioOwner } = require('./hoerenStudioApi');

const MAX_DAYS = new Set([1, 7, 30]);
const TRACK_ID_RE = /^[a-zA-Z0-9_-]{1,245}$/;
const LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL']);
const RATE_WINDOW_MS = 60 * 1000;
const MAX_WRITES_PER_MINUTE = 24;
const recordRateBuckets = new Map();
function allowPracticeWrite(uid, time) {
  const t = time.getTime();
  // Bound cache to keep this zero-scheduler, min-instances=0 API cheap.
  if (recordRateBuckets.size > 1000) recordRateBuckets.clear();
  const bucket = recordRateBuckets.get(uid);
  if (!bucket || t - bucket.since >= RATE_WINDOW_MS) {
    recordRateBuckets.set(uid, { since: t, count: 1 });
    return true;
  }
  if (bucket.count >= MAX_WRITES_PER_MINUTE) return false;
  bucket.count += 1;
  return true;
}

function parsePracticeDays(input) {
  const days = Number(input);
  return MAX_DAYS.has(days) ? days : 7;
}

function normalizedEvent(input) {
  const body = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const trackId = String(body.trackId || '').trim();
  const kind = String(body.kind || '');
  const source = String(body.source || 'campus');
  if (!TRACK_ID_RE.test(trackId) || !['start', 'progress', 'complete'].includes(kind)
    || !['campus', 'workbook'].includes(source)) return null;
  const level = String(body.level || 'ALL').toUpperCase();
  const day = Number(body.day);
  const rawSeconds = Number(body.seconds ?? 0);
  if (!Number.isFinite(rawSeconds) || rawSeconds < 0 || rawSeconds > 600) return null;
  return {
    trackId,
    kind,
    source,
    seconds: Math.floor(rawSeconds),
    title: String(body.title || trackId).replace(/[\u0000-\u001f]/g, '').slice(0, 150),
    level: LEVELS.has(level) ? level : 'ALL',
    day: Number.isInteger(day) && day >= 1 && day <= 99 ? day : null,
  };
}

function practiceDocumentId(uid, trackId, date, source = 'campus') {
  // Preserve legacy Campus IDs; separate workbook activity without extra queries.
  const stable = crypto.createHash('sha256').update(uid + ':' + trackId + (source === 'workbook' ? ':workbook' : '')).digest('hex').slice(0, 32);
  return date + '_' + stable;
}

function dateKey(at) {
  return new Date(at).toISOString().slice(0, 10).replace(/-/g, '');
}

function serializeDate(value) {
  const converted = value && typeof value.toDate === 'function' ? value.toDate() : value;
  const d = converted instanceof Date ? converted : new Date(converted || 0);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function aggregatePractice(rows) {
  const students = new Map();
  const tracks = new Map();
  let plays = 0, completions = 0, seconds = 0;
  for (const data of rows) {
    plays += Number(data.plays || 0);
    completions += Number(data.completions || 0);
    seconds += Number(data.seconds || 0);
    const uid = String(data.uid || '');
    const current = students.get(uid) || {
      uid, name: data.name || 'Student', email: data.email || '',
      level: data.level || 'ALL', plays: 0, completions: 0, seconds: 0,
      songs: new Set(), lastActiveAt: null,
    };
    current.plays += Number(data.plays || 0);
    current.completions += Number(data.completions || 0);
    current.seconds += Number(data.seconds || 0);
    current.songs.add(data.trackId);
    const timestamp = serializeDate(data.lastActiveAt);
    if (!current.lastActiveAt || (timestamp && timestamp > current.lastActiveAt)) {
      current.lastActiveAt = timestamp;
      current.name = data.name || current.name;
      current.email = data.email || current.email;
      current.level = data.level || current.level;
    }
    students.set(uid, current);
    const track = tracks.get(data.trackId) || {
      id: data.trackId, title: data.title || data.trackId, level: data.level || 'ALL',
      day: data.day || null, plays: 0, completions: 0, students: new Set(),
    };
    track.plays += Number(data.plays || 0);
    track.completions += Number(data.completions || 0);
    track.students.add(uid);
    tracks.set(data.trackId, track);
  }
  return {
    activeStudents: students.size, plays, completions, seconds,
    students: [...students.values()].map(s => ({ ...s, songs: s.songs.size }))
      .sort((a, b) => (b.lastActiveAt || '').localeCompare(a.lastActiveAt || '')),
    tracks: [...tracks.values()].map(t => ({ ...t, students: t.students.size }))
      .sort((a, b) => b.plays - a.plays),
    recent: rows.slice(0, 100).map(row => ({
      uid: row.uid, name: row.name || 'Student', email: row.email || '',
      trackId: row.trackId, title: row.title || row.trackId,
      source: row.source === 'workbook' ? 'workbook' : 'campus',
      level: row.level || 'ALL', day: row.day || null,
      plays: row.plays || 0, completions: row.completions || 0,
      seconds: row.seconds || 0, lastActiveAt: serializeDate(row.lastActiveAt),
    })),
  };
}

function registerMusicPracticeRoutes({ app, db, verifyToken, fieldValue, runtimeConfig = {}, env = process.env, now = () => new Date() }) {
  const authenticate = async req => {
    const match = String(req.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
    if (!match) return null;
    try {
      const user = await verifyToken(match[1]);
      return user?.uid && user.firebase?.sign_in_provider !== 'anonymous' ? user : null;
    } catch {
      return null;
    }
  };

  app.post('/music-practice/record', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ ok: false, error: 'Sign in to Falowen Campus before music practice is recorded.' });
    const event = normalizedEvent(req.body);
    if (!event) return res.status(400).json({ ok: false, error: 'Invalid music practice event.' });
    const date = now();
    if (!allowPracticeWrite(user.uid, date)) {
      return res.status(429).json({ ok: false, error: 'Too many practice updates. Continue listening and try later.' });
    }
    const key = dateKey(date);
    const id = practiceDocumentId(user.uid, event.trackId, key, event.source);
    const ref = db.collection('studentMusicPractice').doc(id);
    try {
      await ref.set({
        uid: user.uid,
        name: String(user.name || user.email?.split('@')[0] || 'Student').slice(0, 100),
        email: String(user.email || '').slice(0, 160),
        trackId: event.trackId, title: event.title, level: event.level, day: event.day,
        source: event.source,
        date: key,
        // Configure Firestore TTL on expireAt for automatic 90-day retention.
        expireAt: new Date(date.getTime() + 90 * 86400000),
        lastActiveAt: fieldValue.serverTimestamp(),
        ...(event.kind === 'start' ? { plays: fieldValue.increment(1) } : {}),
        ...(event.kind === 'complete' ? { completions: fieldValue.increment(1) } : {}),
        ...(event.seconds ? { seconds: fieldValue.increment(event.seconds) } : {}),
      }, { merge: true });
      return res.json({ ok: true });
    } catch (error) {
      console.error('student_music_practice_save_failed', { code: error?.code || 'unknown' });
      return res.status(503).json({ ok: false, error: 'Unable to save music practice right now.' });
    }
  });

  app.get('/music-practice/summary', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ ok: false, error: 'Sign in to Falowen Admin.' });
    if (!isStudioOwner(user.uid, runtimeConfig, env)) {
      return res.status(403).json({ ok: false, error: 'Music Analytics owner access required.' });
    }
    const days = parsePracticeDays(req.query?.days);
    const since = new Date(now().getTime() - days * 86400000);
    // One bounded, indexed query on demand; no polling and no all-student scan.
    try {
      const snapshot = await db.collection('studentMusicPractice')
        .where('lastActiveAt', '>=', since)
        .orderBy('lastActiveAt', 'desc')
        .limit(300)
        .get();
      const rows = snapshot.docs.map(doc => doc.data());
      return res.json({
        ok: true, days, generatedAt: now().toISOString(), limited: snapshot.size >= 300,
        ...aggregatePractice(rows),
      });
    } catch (error) {
      console.error('student_music_practice_report_failed', { code: error?.code || 'unknown' });
      return res.status(503).json({ ok: false, error: 'Unable to load student music practice.' });
    }
  });
}

module.exports = { registerMusicPracticeRoutes, parsePracticeDays, normalizedEvent, practiceDocumentId, aggregatePractice };
