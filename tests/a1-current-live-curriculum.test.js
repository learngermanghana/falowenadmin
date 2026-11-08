import test from 'node:test';
import assert from 'node:assert/strict';
import { getCourseSessionGroups } from '../src/data/courseSessionGroups.js';
import { courseDictionary, retiredCourseDictionary } from '../src/data/courseDictionary.js';
import { generateCourseSchedule } from '../src/utils/courseScheduleGenerator.js';
import { enrichSessionsWithStableCurriculum } from '../src/utils/liveClassSessionDedupe.js';
import { learnerLessonLinksForAttendanceSession, resolveTeacherLessonSlide } from '../src/utils/teacherLessonDashboard.js';

test('A1 active timetable follows learner Day 0–23 and retains historical references separately', () => {
  const groups = getCourseSessionGroups('A1');
  assert.deepEqual(groups.map(g => g.day), Array.from({length:24}, (_, i) => i));
  assert.deepEqual(groups[2].assignmentIds, ['A1-0.2_1.1']);
  assert.deepEqual(groups[3].assignmentIds, ['A1-1.2']);
  assert.deepEqual(groups[23].assignmentIds, ['A1-5.10']);
  assert.match(groups[23].topic, /Final Mock Exam/);
  for (const id of ['A1-0.2','A1-1.1','A1-1.1-practice','A1-14.2']) {
    assert.equal(courseDictionary.A1[id], undefined);
    assert.ok(retiredCourseDictionary.A1[id]);
  }
});

test('schedule exports, Live Classes and Attendance resolve the same current A1 days', () => {
  const groups = getCourseSessionGroups('A1');
  const rows = generateCourseSchedule({level:'A1', startDate:'2026-11-09'});
  assert.equal(rows.length,23);
  assert.equal(rows[1].assignmentId,'A1-0.2_1.1');
  assert.match(rows.at(-1).topic,/Day 23: A1 Final Mock Exam/);
  const sessions = groups.map((group, i) => ({id:`s${i}`, status:'scheduled',
    startsAt: new Date(Date.UTC(2026,10,9+i)).toISOString(), topic:'Old dictionary'}));
  const shown = enrichSessionsWithStableCurriculum({}, sessions, groups);
  assert.equal(shown[2].topic,groups[2].topic);
  assert.equal(shown[23].topic,groups[23].topic);
  for (const [day, route] of [[2,'a1-day-2-foundations-workbook'],[23,'a1-final-mock-exam']]) {
    assert.ok(learnerLessonLinksForAttendanceSession({session:shown[day]})[0].url.endsWith(route));
    assert.equal(shown[day].startsAt,sessions[day].startsAt);
  }
  assert.equal(resolveTeacherLessonSlide({session:shown[23]}),null);
});

test('an existing 25-slot generated timetable displays the current 24-day sequence without deleting records', () => {
  const stored = Array.from({length:25}, (_, i) => ({ id:`old-${i}`, status:'scheduled',
    curriculumDay:i, assignmentIds:[i === 23 ? 'A1-14.2' : 'A1-5.10'],
    startsAt:new Date(Date.UTC(2026,10,9+i)).toISOString() }));
  const original = structuredClone(stored);
  const shown = enrichSessionsWithStableCurriculum({levelId:'A1'},stored,getCourseSessionGroups('A1'));
  assert.equal(shown.length,24);
  assert.equal(shown.at(-1).curriculumDay,23);
  assert.deepEqual(shown.at(-1).assignmentIds,['A1-5.10']);
  assert.deepEqual(stored,original);
});
