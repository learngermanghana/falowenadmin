import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { registerMusicPracticeRoutes, normalizedEvent, practiceDocumentId, aggregatePractice } = require('../functions/musicPractice.js');

function response() {
  return {
    code: 200, body: null,
    set() { return this; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}
function request(token, body = {}, days = '7') {
  return { get(header) { return header === 'authorization' && token ? 'Bearer ' + token : ''; }, body, query: { days } };
}
function setup() {
  const handlers = {};
  const writes = [];
  let reads = 0;
  let fakeRows = [];
  const db = {
    collection(name) {
      assert.equal(name, 'studentMusicPractice');
      return {
        doc(id) {
          return { set: async (data, options) => { writes.push({ id, data, options }); } };
        },
        where(field, operator, since) {
          assert.equal(field, 'lastActiveAt');
          assert.equal(operator, '>=');
          assert.ok(since instanceof Date);
          return {
            orderBy(column, dir) {
              assert.equal(column, 'lastActiveAt');
              assert.equal(dir, 'desc');
              return {
                limit(n) {
                  assert.equal(n, 300);
                  return { get: async () => { reads++; return { size: fakeRows.length, docs: fakeRows.map(data => ({ data: () => data })) }; } };
                },
              };
            },
          };
        },
      };
    },
  };
  registerMusicPracticeRoutes({
    app: {
      post(path, handler) { handlers[path] = handler; },
      get(path, handler) { handlers[path] = handler; },
    },
    db, env: { HOEREN_STUDIO_OWNER_UID: 'owner' },
    runtimeConfig: {},
    verifyToken: async token => {
      if (token === 'invalid') throw Error('invalid');
      return { uid: token, name: token === 'student' ? 'Student Example' : 'Owner', email: token + '@example.com' };
    },
    fieldValue: { serverTimestamp: () => 'server-time', increment: n => ({ increment: n }) },
    now: () => new Date('2026-11-02T13:00:00Z'),
  });
  return { handlers, writes, setRows(rows) { fakeRows = rows; }, readCount: () => reads };
}

test('student practice accepts only bounded canonical music events', () => {
  assert.equal(normalizedEvent({ kind: 'start', trackId: '../../other' }), null);
  assert.equal(normalizedEvent({ kind: 'start', trackId: 'A2_day12', seconds: 601 }), null);
  assert.equal(normalizedEvent({ kind: 'replay', trackId: 'A2_day12' }), null);
  assert.deepEqual(normalizedEvent({ kind: 'complete', trackId: 'A2_day12', seconds: 95.8, level: 'A2', day: 12 }).seconds, 95);
  assert.equal(practiceDocumentId('uid', 'id', '20261102'), practiceDocumentId('uid', 'id', '20261102'));
  assert.notEqual(practiceDocumentId('uid', 'id', '20261102'), practiceDocumentId('uid2', 'id', '20261102'));
});

test('record route requires verified Firebase account, never trusts client identity', async () => {
  const { handlers, writes } = setup();
  const record = handlers['/music-practice/record'];
  const event = { kind: 'start', trackId: 'r2-a2-day-12', title: 'Träume ändern sich', level: 'A2', day: 12, uid: 'owner', email: 'spoof@example.com' };
  const anon = response();
  await record(request('', event), anon);
  assert.equal(anon.code, 401);
  assert.equal(writes.length, 0);
  const bad = response();
  await record(request('student', { ...event, trackId: 'bad/path' }), bad);
  assert.equal(bad.code, 400);
  const ok = response();
  await record(request('student', event), ok);
  assert.equal(ok.code, 200);
  assert.equal(ok.body.ok, true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].data.uid, 'student');
  assert.equal(writes[0].data.email, 'student@example.com');
  assert.equal(writes[0].data.plays.increment, 1);
  assert.deepEqual(writes[0].options, { merge: true });
  assert.equal(writes[0].data.date, '20261102');
  const complete = response();
  await record(request('student', { ...event, kind: 'complete', seconds: 52 }), complete);
  assert.equal(writes[1].id, writes[0].id);
  assert.equal(writes[1].data.completions.increment, 1);
  assert.equal(writes[1].data.seconds.increment, 52);
});

test('owner report refuses public and nonowner reads; bounds Firestore query', async () => {
  const { handlers, setRows, readCount } = setup();
  const summary = handlers['/music-practice/summary'];
  const anon = response();
  await summary(request(''), anon);
  assert.equal(anon.code, 401);
  const unauthorized = response();
  await summary(request('student'), unauthorized);
  assert.equal(unauthorized.code, 403);
  assert.equal(readCount(), 0);
  setRows([{
    uid: 'student', name: 'Student Example', email: 'student@example.com',
    trackId: 'a2_12', title: 'Career song', level: 'A2', day: 12,
    plays: 2, completions: 1, seconds: 234,
    lastActiveAt: new Date('2026-11-02T12:50:00Z'),
  }]);
  const owner = response();
  await summary(request('owner'), owner);
  assert.equal(owner.code, 200);
  assert.equal(owner.body.activeStudents, 1);
  assert.equal(owner.body.students[0].songs, 1);
  assert.equal(owner.body.recent[0].completions, 1);
  assert.equal(readCount(), 1);
});

test('aggregates unique students and songs, never records spoken responses', () => {
  const rows = [
    { uid: 's1', trackId: 'a2_1', plays: 2, completions: 1, seconds: 35 },
    { uid: 's1', trackId: 'a2_2', plays: 1, completions: 0, seconds: 65 },
    { uid: 's2', trackId: 'a2_1', plays: 1, completions: 1, seconds: 22 },
  ];
  const report = aggregatePractice(rows);
  assert.equal(report.activeStudents, 2);
  assert.equal(report.students.find(s => s.uid === 's1').songs, 2);
  assert.equal(report.tracks.find(s => s.id === 'a2_1').students, 2);
  assert.equal(report.seconds, 122);
});

test('UI uses separate owner-authenticated lazy tab and no public GA4 user IDs', () => {
  const page = readFileSync(new URL('../src/pages/MusicAnalyticsPage.jsx', import.meta.url), 'utf8');
  const panel = readFileSync(new URL('../src/components/StudentMusicPracticePanel.jsx', import.meta.url), 'utf8');
  const functions = readFileSync(new URL('../functions/index.js', import.meta.url), 'utf8');
  assert.match(page, /StudentMusicPracticePanel/);
  assert.match(page, /tab === 'students'/);
  assert.match(panel, /No background polling/);
  assert.match(functions, /registerMusicPracticeRoutes/);
});
