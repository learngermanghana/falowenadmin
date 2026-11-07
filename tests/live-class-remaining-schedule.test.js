import test from 'node:test';
import assert from 'node:assert/strict';
import { remainingClassOccurrences } from '../src/utils/liveClassRemainingSchedule.js';
import { getCourseSessionGroups } from '../src/data/courseSessionGroups.js';

for (const levelId of ['A1','A2','B1','B2','C1']) {
  test(`${levelId}: changing weekdays retains the full remaining curriculum beyond the old end date`, () => {
    const groups = getCourseSessionGroups(levelId);
    const history = groups.slice(0, 10).map((group, index) => ({ id: `old-${index}`, startsAt: `2026-09-${String(index + 1).padStart(2,'0')}T18:00:00Z`, status: 'completed', assignmentIds: group.assignmentIds }));
    const klass = { id: 'cohort', levelId, startDate: '2026-09-01', endDate: '2026-11-08', scheduleRules: [{ day: 'Sat', startTime: '18:00', durationMinutes: 120 }], excludedDates: [] };
    const future = remainingClassOccurrences(klass, history, Date.parse('2026-11-07T19:00:00Z'));
    assert.equal(history.length + future.length, groups.length);
    assert.ok(future.every(s => Date.parse(s.startsAt) > Date.parse('2026-11-07T19:00:00Z')));
    assert.ok(future.at(-1).startsAt.slice(0,10) > klass.endDate);
    assert.equal(new Set(future.map(s => s.id)).size, future.length);
  });
}
