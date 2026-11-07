import { calculateClassEndDate, generateSessionOccurrences, getCourseDictionarySessionCount, sessionDateInTimezone, toSessionDate } from './liveClassScheduling.js';

export function preserveClassSession(session, now = Date.now()) {
  return ['completed', 'cancelled', 'live', 'rescheduled'].includes(String(session.status || '').toLowerCase())
    || Boolean(session.manualDateOverride || session.rescheduledAt || session.previousStartsAt)
    || (toSessionDate(session.startsAt)?.getTime() || 0) < now;
}

// Count actual saved history, rather than hypothetical meetings on the new weekdays.
export function remainingClassOccurrences(klass, sessions, now = Date.now()) {
  const count = getCourseDictionarySessionCount(klass.levelId);
  if (!count) return generateSessionOccurrences(klass);
  const preserved = sessions.filter((session) => preserveClassSession(session, now));
  const remaining = Math.max(0, count - preserved.length);
  if (!remaining) return [];
  const timezone = klass.timezone || 'Africa/Accra';
  const today = sessionDateInTimezone(new Date(now), timezone);
  const startDate = klass.startDate > today ? klass.startDate : today;
  const occupied = new Set(preserved.map((session) => sessionDateInTimezone(session.startsAt, timezone)));
  const occurrences = [];
  let cursor = startDate;
  for (let attempt = 0; attempt < 3 && occurrences.length < remaining; attempt += 1) {
    const endDate = calculateClassEndDate({ ...klass, startDate: cursor });
    const window = generateSessionOccurrences({ ...klass, startDate: cursor, endDate });
    occurrences.push(...window.filter((session) => new Date(session.startsAt).getTime() >= now && !occupied.has(sessionDateInTimezone(session.startsAt, timezone))));
    const next = new Date(`${endDate}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    cursor = next.toISOString().slice(0, 10);
  }
  if (occurrences.length < remaining) throw new Error('The weekly timetable cannot fit all remaining lessons. Review protected session dates and school closures.');
  return occurrences.slice(0, remaining);
}
