import { getCourseSessionGroups } from '../data/courseSessionGroups.js';
import { calculateClassEndDate, generateSessionOccurrences, sessionDateInTimezone, toSessionDate } from './liveClassScheduling.js';

// Repeated meetings consume time, not additional dictionary lessons. Continue
// after the last explicitly mapped lesson without rewriting teaching history.
export function missingB1CurriculumTail(klass = {}, sessions = []) {
  if (String(klass.levelId || '').toUpperCase() !== 'B1'
    || klass.historical === true || klass.historicalMode === true
    || ['graduated', 'archived', 'deleted'].includes(String(klass.status || '').toLowerCase())
    || !klass.scheduleRules?.length) return [];
  const groups = getCourseSessionGroups('B1');
  const indexes = new Map(groups.flatMap((group, index) => group.assignmentIds.map(id => [id.toUpperCase(), index])));
  let lastIndex = -1;
  for (const session of sessions) {
    if (['cancelled', 'superseded'].includes(String(session.status || '').toLowerCase())) continue;
    const ids = [session.assignmentIds, session.chapterIds, session.curriculumIds]
      .find(value => Array.isArray(value) && value.length) || [session.assignment_id];
    for (const id of ids) {
      const index = indexes.get(String(id || '').trim().toUpperCase());
      if (index != null) lastIndex = Math.max(lastIndex, index);
    }
  }
  // Let the normal missing-session repair handle an unmapped class.
  return lastIndex > 0 ? groups.slice(lastIndex + 1) : [];
}

export function planB1CurriculumTail(klass, sessions, now = Date.now()) {
  const groups = missingB1CurriculumTail(klass, sessions);
  if (!groups.length) return [];
  const timezone = klass.timezone || 'Africa/Accra';
  const dates = sessions.map(session => toSessionDate(session.startsAt)).filter(Boolean);
  const latest = Math.max(now, ...dates.map(date => date.getTime()));
  // Start on the following local date, after every existing meeting.
  const nextDate = new Date(`${sessionDateInTimezone(new Date(latest), timezone)}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const startDate = nextDate.toISOString().slice(0, 10);
  const payload = { ...klass, startDate, excludedDates: [...new Set([...(klass.excludedDates || []), ...(klass.holidayDatesExcluded || [])])] };
  const endDate = calculateClassEndDate(payload);
  const occurrences = generateSessionOccurrences({ ...payload, endDate }).slice(0, groups.length);
  if (occurrences.length !== groups.length) throw new Error('Could not schedule the remaining B1 dictionary lessons.');
  return occurrences.map((occurrence, index) => {
    const group = groups[index];
    return { ...occurrence, topic: group.topic, assignmentIds: group.assignmentIds,
      chapterIds: group.assignmentIds, curriculumIds: group.assignmentIds,
      assignment_id: group.assignmentIds[0], curriculumIndex: group.index + 1,
      curriculumDay: group.day, curriculumTaskCount: group.assignmentIds.length,
      curriculumSource: 'courseDictionary-day-groups', curriculumVersion: 2,
      curriculumAutoAssigned: true };
  });
}
