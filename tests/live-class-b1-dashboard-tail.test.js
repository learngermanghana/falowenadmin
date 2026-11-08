import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getCourseSessionGroups } from '../src/data/courseSessionGroups.js';
import { enrichSessionsWithStableCurriculum } from '../src/utils/liveClassSessionDedupe.js';

const dataModule = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const firestoreUrl = dataModule(`
  export const records = new Map();
  export const writes = [];
  export const state = { failTransaction: false };
  export const doc = (_db, ...parts) => parts.join('/');
  export const collection = doc;
  export const where = (field, _op, value) => ({ field, value });
  export const query = (path, ...filters) => ({ path, filters });
  export const serverTimestamp = () => 'server-time';
  const snapshot = path => ({ id: path.split('/').at(-1), exists: () => records.has(path), data: () => structuredClone(records.get(path)) });
  export const getDoc = async path => snapshot(path);
  export const getDocs = async ({ path, filters }) => ({ docs: [...records.keys()]
    .filter(key => key.startsWith(path + '/') && key.split('/').length === path.split('/').length + 1)
    .filter(key => filters.every(({field,value}) => records.get(key)[field] === value)).map(snapshot) });
  const apply = (path, value, merge = false) => {
    writes.push(path);
    records.set(path, merge ? { ...records.get(path), ...structuredClone(value) } : structuredClone(value));
  };
  export const updateDoc = async (path, value) => apply(path, value, true);
  export const setDoc = async (path, value, options) => apply(path, value, options?.merge);
  export const writeBatch = () => {
    const pending = [];
    return { update: (...args) => pending.push(() => updateDoc(...args)), set: (...args) => pending.push(() => setDoc(...args)), commit: async () => { for (const action of pending) await action(); } };
  };
  export const runTransaction = async (_db, callback) => {
    if (state.failTransaction) throw new Error("Transaction unavailable");
    const batch = writeBatch();
    const result = await callback({ get: getDoc, set: batch.set, update: batch.update });
    await batch.commit();
    return result;
  };
`);
const firebaseUrl = dataModule('export const db = {};');
const noopServicesUrl = dataModule(`
  export const syncClassCurriculum = async () => ({});
  export const syncClassEndDateFromSessions = async () => ({});
  export const listClassSessions = async () => [];
  export const rebuildClassSessionsFromSchedule = async () => { throw new Error('Unexpected positional rebuild'); };
  export const applyGroupedCurriculumToClass = async () => { throw new Error('Unexpected historical remap'); };
  export const loadSchoolClosureDates = async () => [];
`);
async function loadService(path, overrides = {}) {
  const url = new URL(path, import.meta.url);
  const source = await readFile(url, 'utf8');
  return dataModule(source.replace(/from (["'])([^"']+)\1/g, (_match, _quote, specifier) => {
    const target = overrides[specifier]
      || (specifier === 'firebase/firestore' ? firestoreUrl
        : specifier === '../firebase.js' ? firebaseUrl
          : new URL(specifier, url).href);
    return `from ${JSON.stringify(target)}`;
  }));
}
const tailUrl = await loadService('../src/services/liveClassCurriculumTailService.js', {
  './schoolClosureService.js': noopServicesUrl,
});
const baseUrl = await loadService('../src/services/liveClassCompatibilityServiceBase.js', {
  './liveClassService.js': noopServicesUrl,
  './liveClassCurriculumTailService.js': tailUrl,
});
const dashboardUrl = await loadService('../src/services/liveClassCompatibilityService.js', {
  './liveClassService.js': noopServicesUrl,
  './groupedCurriculumService.js': noopServicesUrl,
  './liveClassCurriculumTailService.js': tailUrl,
  './liveClassCompatibilityServiceBase.js': baseUrl,
});
const { getCompatibleClassDashboard } = await import(dashboardUrl);
const { records, writes, state } = await import(firestoreUrl);
let originalFixture;

test('actual dashboard restores stored Bonn Days 20–28 before enrichment and preserves history on reload', async () => {
  records.clear(); writes.length = 0;
  const groups = getCourseSessionGroups('B1');
  const klass = { id: 'bonn', name: 'B1 Bonn Klasse', levelId: 'B1', timezone: 'Africa/Accra', status: 'active',
    scheduleRules: [{ day: 'Sat', startTime: '07:00', durationMinutes: 120 }] };
  records.set('classes/bonn', klass);
  const sessions = groups.filter(group => group.day <= 18).map((group, index) => ({
    id: `history-${index}`, classId: 'bonn', startsAt: `2026-10-${String(index + 1).padStart(2,'0')}T07:00:00Z`,
    status: 'completed', assignmentIds: group.assignmentIds, topic: group.topic, curriculumDay: group.day,
  }));
  for (let index = 0; index < 10; index += 1) sessions.push({ ...sessions[18], id: `repeat-${index}`,
    startsAt: `2026-11-${String(index + 1).padStart(2,'0')}T07:00:00Z` });
  const next = new Date(); next.setUTCDate(next.getUTCDate() + 7);
  sessions.push({ id: 'day19', classId: 'bonn', startsAt: next.toISOString(), status: 'scheduled',
    assignmentIds: ['B1-6.19'], curriculumDay: 19, topic: groups[19].topic });
  for (const session of sessions) {
    records.set(`classSessions/${session.id}`, structuredClone(session));
    records.set(`attendance/bonn/sessions/${session.id}`, { students: { student: { present: true } }, assignmentIds: session.assignmentIds });
  }
  originalFixture = structuredClone(records);
  const originals = new Map([...records].filter(([path]) => path !== 'classes/bonn').map(([path,value]) => [path, structuredClone(value)]));
  // Demonstrates why relying on the old generic enrichment loses Day 19.
  const oldDisplay = enrichSessionsWithStableCurriculum({}, sessions, groups);
  assert.equal(oldDisplay.some(session => session.id === 'day19'), false);

  const first = await getCompatibleClassDashboard('bonn');
  assert.equal(first.sessionRepair.created, 9);
  assert.deepEqual(first.sessions.filter(session => session.curriculumDay >= 20).map(session => session.curriculumDay), [20,21,22,23,24,25,26,27,28]);
  assert.deepEqual(first.sessions.find(session => session.id === 'day19').assignmentIds, ['B1-6.19']);
  assert.equal(first.sessions.filter(session => session.assignmentIds.includes('B1-6.18')).length, 11);
  assert.ok(first.sessions.filter(session => session.curriculumDay >= 20).every(session => session.startsAt > next.toISOString()));
  for (const [path,value] of originals) assert.deepEqual(records.get(path), value, `preserved ${path}`);
  assert.ok(writes.every(path => !originals.has(path)), 'no history or existing attendance writes');

  const count = records.size;
  writes.length = 0;
  const second = await getCompatibleClassDashboard('bonn');
  assert.equal(records.size, count);
  assert.equal(second.sessions.at(-1).curriculumDay, 28);
  assert.equal(writes.length, 0, 'reload performs no repair writes');
});


test('dashboard exposes a failed raw repair without falling back to positional rebuilding', async () => {
  records.clear(); writes.length = 0;
  for (const [path, value] of originalFixture) records.set(path, structuredClone(value));
  state.failTransaction = true;
  try {
    const dashboard = await getCompatibleClassDashboard('bonn');
    assert.equal(dashboard.sessionRepair.error, 'Transaction unavailable');
    assert.deepEqual(dashboard.sessions.find(session => session.id === 'day19').assignmentIds, ['B1-6.19']);
    assert.deepEqual(records, originalFixture);
    assert.equal(writes.length, 0);
  } finally {
    state.failTransaction = false;
  }
});
