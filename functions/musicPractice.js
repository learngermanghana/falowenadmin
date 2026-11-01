'use strict';

// Signed-in Campus practice only. Public GA4 remains anonymous; this data is
// restricted to the Music Studio owner and retains only a rolling 35-day window.
const { isStudioOwner } = require('./hoerenStudioApi');
const COLLECTION = 'musicPracticeSummaries';
const EVENTS = { play: 'plays', complete: 'completions', quiz: 'quizzes' };
const TRACK_ID = /^[a-zA-Z0-9_-]{1,245}$/;
const LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL']);
const DAY_OPTIONS = new Set([1, 7, 30]);

const dateKey = d => d.toISOString().slice(0, 10);
const safeString = (input, max = 160) => String(input || '').trim().slice(0, max);
const safeCount = value => Math.max(0, Math.min(100000, Number(value) || 0));

function normalizePractice(body = {}) {
  const event = safeString(body.event, 20);
  const trackId = safeString(body.trackId, 245);
  if (!EVENTS[event] || !TRACK_ID.test(trackId)) return null;
  const level = safeString(body.level, 5).toUpperCase();
  const day = Number(body.day);
  return {
    event, trackId,
    title: safeString(body.title, 120) || trackId,
    level: LEVELS.has(level) ? level : '',
    day: Number.isInteger(day) && day >= 1 && day <= 28 ? day : null,
  };
}

function applyPracticeEvent(previous = {}, activity, identity, at) {
  const current = at instanceof Date ? at : new Date(at);
  const today = dateKey(current);
  const cutoff = dateKey(new Date(current.getTime() - 35 * 86400000));
  const daily = {};
  for (const [day, values] of Object.entries(previous.daily || {})) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && day >= cutoff && day <= today) {
      daily[day] = {
        plays: safeCount(values?.plays),
        completions: safeCount(values?.completions),
        quizzes: safeCount(values?.quizzes),
      };
    }
  }
  const field = EVENTS[activity.event];
  const bucket = daily[today] || { plays: 0, completions: 0, quizzes: 0 };
  bucket[field] = Math.min(100000, bucket[field] + 1);
  daily[today] = bucket;
  const recent = Array.isArray(previous.recent) ? previous.recent : [];
  return {
    uid: identity.uid,
    name: safeString(previous.name || identity.name, 120),
    email: safeString(previous.email || identity.email, 200),
    daily,
    lastAt: current,
    lastTrack: { id: activity.trackId, title: activity.title, level: activity.level, day: activity.day },
    lastEvent: activity.event,
    recent: [
      { id: activity.trackId, title: activity.title, level: activity.level, event: activity.event, at: current.toISOString() },
      ...recent.filter(item => item && item.id !== activity.trackId).slice(0, 7),
    ],
  };
}

function practiceRows(documents, days, at = new Date()) {
  const cutoff = dateKey(new Date(at.getTime() - (days - 1) * 86400000));
  return documents.map(snapshot => {
    const row = snapshot.data();
    const daily = Object.entries(row?.daily || {}).filter(([key]) => key >= cutoff && key <= dateKey(at));
    if (!daily.length) return null;
    const counts = daily.reduce((acc, [, value]) => ({
      plays: acc.plays + safeCount(value?.plays),
      completions: acc.completions + safeCount(value?.completions),
      quizzes: acc.quizzes + safeCount(value?.quizzes),
    }), { plays: 0, completions: 0, quizzes: 0 });
    if (!counts.plays && !counts.completions && !counts.quizzes) return null;
    return {
      uid: safeString(row.uid || snapshot.id, 128),
      name: safeString(row.name, 120),
      email: safeString(row.email, 200),
      lastAt: typeof row.lastAt?.toDate === 'function' ? row.lastAt.toDate().toISOString() : new Date(row.lastAt || 0).toISOString(),
      lastTrack: row.lastTrack || null,
      lastEvent: safeString(row.lastEvent, 12),
      ...counts,
    };
  }).filter(Boolean).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

function registerMusicPracticeRoutes({ app, db, verifyToken, runtimeConfig = {}, env = process.env, now = () => new Date() }) {
  async function identify(req, res) {
    const match = String(req.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
    if (!match) { res.status(401).json({ ok: false, error: 'Sign in to Falowen first.' }); return null; }
    try {
      const decoded = await verifyToken(match[1]);
      if (decoded?.uid) return decoded;
    } catch {}
    res.status(401).json({ ok: false, error: 'Invalid Falowen session.' });
    return null;
  }

  app.post('/music-analytics/practice', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const identity = await identify(req, res);
    if (!identity) return;
    const activity = normalizePractice(req.body);
    if (!activity) return res.status(400).json({ ok: false, error: 'Invalid music activity.' });
    if (!db) return res.status(503).json({ ok: false, error: 'Practice tracking unavailable.' });
    try {
      const at = now();
      const ref = db.collection(COLLECTION).doc(identity.uid);
      let counted = false;
      await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        const previous = snapshot.exists ? snapshot.data() : {};
        // A short server-side retry window prevents duplicate player events.
        const lastAt = previous?.lastAt?.toDate?.() || (previous?.lastAt ? new Date(previous.lastAt) : null);
        if (lastAt && at.getTime() - lastAt.getTime() < 45000 &&
          previous.lastEvent === activity.event && previous.lastTrack?.id === activity.trackId) return;
        let student = {};
        if (!snapshot.exists) {
          const profile = await transaction.get(db.collection('students').doc(identity.uid));
          if (profile.exists) {
            student = profile.data();
          } else {
            // Some legacy student records use a student code as document ID.
            const matches = await transaction.get(db.collection('students').where('uid', '==', identity.uid).limit(1));
            student = matches.docs?.[0]?.data() || {};
          }
        }
        const name = student.name || student.fullName || student.studentName || identity.name || '';
        const updated = applyPracticeEvent(previous, activity,
          { uid: identity.uid, email: identity.email || student.email, name }, at);
        transaction.set(ref, updated);
        counted = true;
      });
      return res.json({ ok: true, counted });
    } catch (error) {
      console.error('student_music_practice_failed', { message: error?.message });
      return res.status(503).json({ ok: false, error: 'Unable to save music practice.' });
    }
  });

  app.get('/music-analytics/students', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const identity = await identify(req, res);
    if (!identity) return;
    if (!isStudioOwner(identity.uid, runtimeConfig, env)) {
      return res.status(403).json({ ok: false, error: 'Owner access required.' });
    }
    if (!db) return res.status(503).json({ ok: false, error: 'Practice reporting unavailable.' });
    const days = DAY_OPTIONS.has(Number(req.query?.days)) ? Number(req.query.days) : 7;
    try {
      // One bounded read per student, rather than an unbounded per-listen log.
      const docs = await db.collection(COLLECTION).orderBy('lastAt', 'desc').limit(500).get();
      const students = practiceRows(docs.docs, days, now());
      return res.json({ ok: true, days, students, count: students.length, capped: docs.size === 500 });
    } catch (error) {
      console.error('student_music_report_failed', { message: error?.message });
      return res.status(503).json({ ok: false, error: 'Unable to load student practice.' });
    }
  });
}

module.exports = { registerMusicPracticeRoutes, normalizePractice, applyPracticeEvent, practiceRows };
