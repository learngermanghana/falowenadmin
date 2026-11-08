import test from 'node:test';
import assert from 'node:assert/strict';
import { getCourseSessionGroups } from '../src/data/courseSessionGroups.js';
import { buildFollowingScheduleRestorePlan } from '../src/utils/liveClassFollowingScheduleRestore.js';

import { buildClassScheduleHealth } from '../src/utils/liveClassScheduleHealth.js';
import { buildOfficialLessonSchedulePlan } from '../src/utils/liveClassLessonOrder.js';
const groups = getCourseSessionGroups('B1');
const klass = { id: 'bonn', name: 'B1 Bonn Klasse', levelId: 'B1', timezone: 'Africa/Accra',
  startDate: '2026-08-01', endDate: '2026-11-14', scheduleRules: [
    { day: 'Thu', startTime: '19:00', durationMinutes: 90 },
    { day: 'Sat', startTime: '07:00', durationMinutes: 90 },
    { day: 'Sun', startTime: '07:00', durationMinutes: 90 },
  ] };
function session(day, date, status = 'scheduled', id = `day-${day}`) {
  const group = groups.find(group => group.day === day);
  return { id, classId: 'bonn', classRecordId: 'bonn', startsAt: date,
    endsAt: new Date(Date.parse(date) + 90 * 60000).toISOString(), status,
    topic: group.topic, assignmentIds: group.assignmentIds, curriculumDay: day,
    curriculumIndex: group.index + 1 };
}

test('Bonn continuation creates fresh Days 20–28 without moving earlier later-day records', () => {
  const history = groups.map(group => session(group.day,
    `2026-09-${String(group.day + 1).padStart(2,'0')}T07:00:00Z`, 'completed', `old-${group.day}`));
  // Past Day 27/28 share a timestamp, as in the reported timetable. They must
  // not block a future repair or be superseded to manufacture collision safety.
  history.at(-1).startsAt = history.at(-2).startsAt;
  const anchor = session(19, '2026-11-08T07:00:00Z', 'scheduled', 'current-19');
  const future = session(21, '2026-11-14T07:00:00Z', 'scheduled', 'future-21');
  const sessions = [...history, anchor, future];
  const before = structuredClone(sessions);
  const plan = buildFollowingScheduleRestorePlan({ classId: 'bonn', klass, sessions,
    anchorSessionId: anchor.id, notBeforeStartsAt: '2026-11-08T08:00:00Z' });
  assert.equal(plan.anchorSession.id, anchor.id);
  assert.deepEqual(plan.followingItems.map(item => item.group.day), [20,21,22,23,24,25,26,27,28]);
  assert.equal(plan.followingItems[0].targetStartsAt, '2026-11-12T19:00:00.000Z');
  assert.equal(plan.followingItems[1].session.id, future.id);
  assert.equal(plan.followingItems[1].targetStartsAt, '2026-11-14T07:00:00.000Z');
  assert.equal(plan.createdCount, 8);
  assert.equal(plan.movedCount, 0);
  assert.ok(plan.restorableItems.every(item => !item.session));
  assert.ok(plan.staleFutureRecords.every(item => !item.sessionId.startsWith('old-')));
  assert.equal(plan.unresolvedCollisions, 0);
  assert.deepEqual(sessions, before);
  const restored = [...sessions, ...plan.restorableItems.map(item =>
    session(item.group.day, item.targetStartsAt, 'scheduled', `new-${item.group.day}`))];
  const health = buildClassScheduleHealth({ klass: { ...plan.anchoredClass, endDate: plan.endDate }, sessions: restored });
  assert.equal(health.reminderSuppressed, false, JSON.stringify(health.blockingIssues));
  const repeated = buildFollowingScheduleRestorePlan({ classId: 'bonn', klass, sessions: restored,
    anchorSessionId: anchor.id, notBeforeStartsAt: '2026-11-08T08:00:00Z' });
  assert.equal(repeated.createdCount, 0);
  assert.equal(repeated.movedCount, 0);
  assert.equal(repeated.staleFutureRecords.length, 0);
});

test('teacher overrides the real Day 27 date and rebuilds Day 28 on the chosen Saturday', () => {
  const rows = [
    session(19, '2026-11-08T07:00:00Z', 'completed', 'actual'),
    session(21, '2026-11-14T07:00:00Z', 'scheduled', 'saturday'),
    session(28, '2026-11-15T07:00:00Z', 'scheduled', 'old-end'),
    session(27, '2026-12-05T07:00:00Z', 'scheduled', 'wrong-date'),
  ];
  const plan = buildFollowingScheduleRestorePlan({ classId: 'bonn', klass, sessions: rows,
    anchorSessionId: 'wrong-date', anchorDate: '2026-11-08', nextDate: '2026-11-14' });
  assert.equal(plan.anchorSession.id, 'actual');
  assert.deepEqual(plan.overrideRows.map(row => [row.id, row.patch.curriculumDay]), [['actual', 27], ['saturday', 28]]);
  assert.equal(plan.endDate, '2026-11-14');
  const saved = rows.filter(row => ['actual','saturday'].includes(row.id)).map(row =>
    ({ ...row, ...plan.overrideRows.find(change => change.id === row.id).patch }));
  const official = buildOfficialLessonSchedulePlan({ classId: 'bonn', sessions: saved,
    klass: plan.anchoredClass });
  assert.equal(official.items.at(-1).changed, false);
  assert.equal(official.items.at(-1).targetStartsAt, '2026-11-14T07:00:00.000Z');
  assert.deepEqual(plan.followingItems.map(item => item.group.day), [28]);
  assert.deepEqual(plan.staleFutureRecords.map(row => row.sessionId).sort(), ['old-end','wrong-date']);
});

test('next date alone restores the missing course tail after weekly days change', () => {
  const rows = groups.slice(0,26).map(group => session(group.day,
    `2026-09-${String(group.day + 1).padStart(2,'0')}T07:00:00Z`, 'completed'));
  const plan = buildFollowingScheduleRestorePlan({ classId: 'bonn', klass: { ...klass,
    scheduleRules: [{ day: 'Sat', startTime: '07:00', durationMinutes: 90 }] }, sessions: rows,
    nextLessonNumber: 27, nextDate: '2026-11-14' });
  assert.equal(plan.overrideRows[0].create, true);
  assert.equal(plan.anchorSession.curriculumDay, 26);
  assert.deepEqual(plan.followingItems.map(item => [item.group.day,item.targetStartsAt.slice(0,10)]), [[27,'2026-11-21'],[28,'2026-11-28']]);
  assert.equal(plan.expectedLessons, 29);
});
