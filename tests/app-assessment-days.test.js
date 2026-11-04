import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { isAppAssessment } from '../src/utils/appAssessment.js';
import { buildAttendanceAnalytics } from '../src/utils/attendanceAnalytics.js';
import { getCourseSessionGroups } from '../src/data/courseSessionGroups.js';
import { enrichSessionsWithStableCurriculum } from '../src/utils/liveClassSessionDedupe.js';
import { buildDisplayedCurriculumPatch } from '../src/utils/liveClassCurriculumSync.js';
const require = createRequire(import.meta.url);
const backend = require('../functions/appAssessment.js');
const reminders = require('../functions/classSessionReminderEmails.js')._test;
const completion = require('../functions/completionParticipationDocument.js')._test;
for (const [level, day, id] of [['A2',22,'A2-8.22'],['B1',23,'B1-7.23']]) {
 test(`${id} needs no live attendance and preserves the following date`, () => {
  const groups = getCourseSessionGroups(level);
  const raw = groups.map((g,i)=>({id:`s${i}`, startsAt:new Date(Date.UTC(2026,0,i+1)).toISOString(), status:'completed', assignmentIds:g.assignmentIds}));
  const shown = enrichSessionsWithStableCurriculum({}, raw, groups);
  const mock = shown.find(s=>s.curriculumDay===day);
  assert.equal(mock.topic, `Day ${day}: Goethe ${level} Speaking Mock`);
  assert.equal(mock.attendanceRequired, false);
  assert.equal(buildDisplayedCurriculumPatch({},mock).sessionType,'app_assessment');
  const next = shown.find(s=>s.curriculumDay===day+1);
  assert.equal(next.startsAt,raw.find(s=>s.id===next.id).startsAt);
  assert.equal(reminders.isSuppressedSession(mock),true);
  assert.equal(completion.isTeachingSession(mock),false);
  const report=buildAttendanceAnalytics({sessions:[mock],students:[{id:'sample'}],now:'2026-11-04'});
  assert.equal(report.classSummary.sessionsHeld,0);
  assert.equal(report.records.length,0);
  for(const record of [{assignment_id:id},{chapterIds:[id]},{curriculumIds:[id]},{assignmentIds:[id]}]) {
   assert.equal(isAppAssessment(record),true);
   assert.equal(backend.isAppAssessment(record),true);
  }
 });
}
test('mixed lessons and A1 practice retain attendance',()=>{
 for(const record of [{assignmentIds:['A1-5.9']},{assignmentIds:['A2-8.22','A2-9.23']}]) assert.equal(isAppAssessment(record),false);
});
