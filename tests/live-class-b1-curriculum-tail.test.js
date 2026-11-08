import test from 'node:test';
import assert from 'node:assert/strict';
import { getCourseSessionGroups } from '../src/data/courseSessionGroups.js';
import { missingB1CurriculumTail, planB1CurriculumTail } from '../src/utils/liveClassCurriculumTail.js';

const klass = { id: 'b1-bonn', levelId: 'B1', status: 'active', timezone: 'Africa/Accra',
  scheduleRules: [{ day: 'Sat', startTime: '07:00', durationMinutes: 120 }] };
const groups = getCourseSessionGroups('B1');
const history = groups.filter(group => group.day <= 18).map((group, index) => ({
  id: `history-${index}`, startsAt: `2026-10-${String(index + 1).padStart(2, '0')}T07:00:00Z`,
  status: 'completed', assignmentIds: group.assignmentIds, curriculumDay: group.day,
}));
const repeats = Array.from({ length: 10 }, (_, index) => ({ ...history.at(-1), id: `repeat-${index}` }));
const day19 = { id: 'day19', startsAt: '2026-11-14T07:00:00Z', status: 'scheduled', assignmentIds: ['B1-6.19'] };
const sessions = [...history, ...repeats, day19];
const now = Date.parse('2026-11-08T07:00:00Z');

test('Bonn repeat meetings do not conceal the missing Days 20–28', () => {
  assert.ok(sessions.length > groups.length);
  assert.deepEqual(missingB1CurriculumTail(klass, sessions).map(group => group.day), [20,21,22,23,24,25,26,27,28]);
});

test('append nine future lessons after Day 19 without mutating history or attendance', () => {
  const before = structuredClone(sessions);
  const additions = planB1CurriculumTail(klass, sessions, now);
  assert.equal(additions.length, 9);
  assert.equal(additions[0].startsAt, '2026-11-21T07:00:00.000Z');
  assert.equal(additions.at(-1).assignment_id, 'B1-10.28');
  assert.deepEqual(additions.map(item => item.curriculumDay), [20,21,22,23,24,25,26,27,28]);
  assert.ok(additions.every(item => item.startsAt > day19.startsAt && item.status === 'scheduled'));
  assert.deepEqual(sessions, before);
  assert.deepEqual(planB1CurriculumTail(klass, [...sessions, ...additions], now), []);
});

test('tail scheduling respects closed dates and saved holiday exclusions', () => {
  const additions = planB1CurriculumTail({ ...klass, excludedDates: ['2026-11-21'], holidayDatesExcluded: ['2026-11-28'] }, sessions, now);
  assert.equal(additions[0].startsAt.slice(0,10), '2026-12-05');
});

test('archived, historical, unmapped and other-level classes are not extended', () => {
  for (const override of [{ status: 'archived' }, { status: 'graduated' }, { historical: true }, { historicalMode: true }, { levelId: 'A2' }, { scheduleRules: [] }]) {
    assert.deepEqual(missingB1CurriculumTail({ ...klass, ...override }, sessions), []);
  }
  assert.deepEqual(missingB1CurriculumTail(klass, [{ topic: 'Day 19', startsAt: day19.startsAt }]), []);
});
