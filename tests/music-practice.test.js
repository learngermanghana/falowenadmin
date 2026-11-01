import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { normalizePractice, applyPracticeEvent, practiceRows, registerMusicPracticeRoutes } = require('../functions/musicPractice.js');

const at = new Date('2026-11-01T10:00:00.000Z');
const activity = { event: 'play', trackId: 'r2-a1-day-02', title: 'Hallo', level: 'A1', day: 2 };

function res() {
  return { statusCode: 200, body: null, set() { return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; } };
}

test('only accepted song IDs and activity types are stored', () => {
  assert.deepEqual(normalizePractice(activity), activity);
  assert.equal(normalizePractice({ ...activity, trackId: '../private' }), null);
  assert.equal(normalizePractice({ ...activity, event: 'speech' }), null);
  assert.equal(normalizePractice({ ...activity, event: 'quiz', title: '<b>test</b>' }).title, '<b>test</b>');
});

test('roll up activity per authenticated student and prune old daily records', () => {
  const previous = { daily: {
    '2026-08-01': { plays: 99 },
    '2026-10-31': { plays: 2, completions: 1, quizzes: 0 },
  } };
  const identity = { uid: 'learner-1', email: 'student@example.com', name: 'Student One' };
  const first = applyPracticeEvent(previous, activity, identity, at);
  assert.deepEqual(first.daily['2026-11-01'], { plays: 1, completions: 0, quizzes: 0 });
  assert.equal(first.daily['2026-08-01'], undefined);
  const second = applyPracticeEvent(first, { ...activity, event: 'complete' }, identity, new Date(at.getTime() + 50000));
  assert.equal(second.daily['2026-11-01'].plays, 1);
  assert.equal(second.daily['2026-11-01'].completions, 1);
  assert.equal(second.uid, 'learner-1');
  const snap = { id: 'learner-1', data: () => second };
  assert.equal(practiceRows([snap], 1, at).length, 1);
  assert.equal(practiceRows([snap], 1, new Date('2026-12-01T10:00:00Z')).length, 0);
});

test('student cannot read owner-only report; unauthenticated requests cannot write', async () => {
  const routes = {};
  const app = {
    get(path, handler) { routes['GET ' + path] = handler; },
    post(path, handler) { routes['POST ' + path] = handler; },
  };
  registerMusicPracticeRoutes({
    app, db: {}, env: { HOEREN_STUDIO_OWNER_UID: 'owner' },
    verifyToken: async token => ({ uid: token }), now: () => at,
  });
  const missing = res();
  await routes['POST /music-analytics/practice']({ get: () => '', body: activity }, missing);
  assert.equal(missing.statusCode, 401);
  const student = res();
  await routes['GET /music-analytics/students']({ get: () => 'Bearer learner-1', query: {} }, student);
  assert.equal(student.statusCode, 403);
});

test('authenticated player updates one compact record and owner sees account activity', async () => {
  const routes = {};
  let stored = null;
  const ref = { path: 'musicPracticeSummaries/learner-1' };
  const db = {
    collection(name) {
      if (name === 'students') return { doc: () => ({ path: 'students/learner-1' }) };
      assert.equal(name, 'musicPracticeSummaries');
      return {
        doc: () => ref,
        orderBy: () => ({ limit: () => ({ get: async () => ({ docs: stored ? [{ id: 'learner-1', data: () => stored }] : [], size: stored ? 1 : 0 }) }) }),
      };
    },
    async runTransaction(fn) {
      const writes = [];
      const result = await fn({
        get: async item => item.path.startsWith('students/')
          ? { exists: true, data: () => ({ name: 'Student One' }) }
          : { exists: Boolean(stored), data: () => stored },
        set: (_, value) => writes.push(value),
      });
      if (writes.length) stored = writes[0];
      return result;
    },
  };
  registerMusicPracticeRoutes({
    app: { get(path, fn) { routes['GET ' + path] = fn; }, post(path, fn) { routes['POST ' + path] = fn; } },
    db, verifyToken: async token => ({ uid: token, email: token + '@example.com' }),
    env: { HOEREN_STUDIO_OWNER_UID: 'owner' }, now: () => at,
  });
  const req = { get: () => 'Bearer learner-1', body: activity };
  const first = res();
  await routes['POST /music-analytics/practice'](req, first);
  assert.equal(first.body.counted, true);
  assert.equal(stored.name, 'Student One');
  assert.equal(stored.email, 'learner-1@example.com');
  const repeat = res();
  await routes['POST /music-analytics/practice'](req, repeat);
  assert.equal(repeat.body.counted, false);
  const report = res();
  await routes['GET /music-analytics/students']({ get: () => 'Bearer owner', query: { days: '7' } }, report);
  assert.equal(report.body.students[0].name, 'Student One');
  assert.equal(report.body.students[0].plays, 1);
});
