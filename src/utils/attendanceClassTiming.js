import { generateSessionOccurrences, getSchedulingSchoolClosureDates, normalizeScheduleRules, toSessionDate } from "./liveClassScheduling.js";

const CANCELLED_STATUSES = new Set(["cancelled", "canceled", "completed", "complete", "done"]);

function dateKey(value, timezone) {
  const date = value instanceof Date ? value : toSessionDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function timeLabel(value, timezone) {
  const date = toSessionDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function futureSessions(sessions = [], now = new Date()) {
  return sessions
    .filter((session) => !CANCELLED_STATUSES.has(String(session.status || "").trim().toLowerCase()))
    .map((session) => ({ session, startsAt: toSessionDate(session.startsAt), endsAt: toSessionDate(session.endsAt) }))
    .filter(({ startsAt, endsAt }) => startsAt && (endsAt ? endsAt > now : startsAt >= now))
    .sort((left, right) => left.startsAt - right.startsAt);
}

function nextTimetableSession(klass, sessions, now, timezone) {
  const courseDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
    ? String(value) : dateKey(value, timezone);
  const startDate = courseDate(klass.startDate);
  const endDate = courseDate(klass.endDate);
  const today = dateKey(now, timezone);
  if (!startDate || !endDate || endDate < today || !normalizeScheduleRules(klass.scheduleRules || []).length) return null;

  // A saved session or its original date overrides the recurring timetable.
  // Never bring back a cancelled, completed or moved lesson as an estimate.
  const excludedDates = new Set([
    ...getSchedulingSchoolClosureDates(),
    ...(Array.isArray(klass.holidayDatesExcluded) ? klass.holidayDatesExcluded : []),
    ...(Array.isArray(klass.excludedDates) ? klass.excludedDates : []),
    ...sessions.flatMap((session) => [session.startsAt, session.previousStartsAt, session.originalStartsAt]
      .map((value) => dateKey(value, timezone)).filter(Boolean)),
  ]);
  const occurrences = generateSessionOccurrences({
    classId: klass.id || klass.classRecordId || klass.classId || "timetable-preview",
    startDate: startDate > today ? startDate : today,
    endDate,
    timezone,
    scheduleRules: klass.scheduleRules,
    excludedDates,
    totalSessions: 10000,
  });
  return futureSessions(occurrences, now)[0] || null;
}

export function classTimingSummary(klass = {}, sessions = [], now = new Date()) {
  const timezone = String(klass.timezone || "Africa/Accra").trim() || "Africa/Accra";
  const savedNext = futureSessions(sessions, now)[0];
  const next = savedNext || nextTimetableSession(klass, sessions, now, timezone);
  const source = savedNext ? "session" : "timetable";
  if (!next) return { label: "No upcoming class", tone: "muted", sortTime: Number.POSITIVE_INFINITY };

  const time = timeLabel(next.startsAt, timezone);
  if (next.startsAt <= now && (!next.endsAt || next.endsAt > now)) {
    return { label: `In progress · ${time}`, tone: "live", source, sortTime: next.startsAt.getTime() };
  }

  const sessionDay = dateKey(next.startsAt, timezone);
  const today = dateKey(now, timezone);
  const tomorrow = dateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000), timezone);
  if (sessionDay === today) return { label: `Today · ${time}`, tone: "today", source, sortTime: next.startsAt.getTime() };
  if (sessionDay === tomorrow) return { label: `Tomorrow · ${time}`, tone: "tomorrow", source, sortTime: next.startsAt.getTime() };

  const daysAway = Math.round((new Date(`${sessionDay}T12:00:00Z`) - new Date(`${today}T12:00:00Z`)) / 86400000);
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    ...(daysAway > 6 ? { day: "2-digit", month: "short" } : { weekday: "short" }),
  }).format(next.startsAt);
  return { label: `${date} · ${time}`, tone: "next", source, sortTime: next.startsAt.getTime() };
}

export function weeklyTimetableLabels(klass = {}) {
  return normalizeScheduleRules(klass.scheduleRules || []).map((rule) => (
    `${rule.day.slice(0, 1).toUpperCase()}${rule.day.slice(1)} · ${rule.startTime}`
  ));
}


export function orderAttendanceClasses(classes = [], sessionsByClass = {}, now = new Date()) {
  const key = (klass) => String(klass.id || klass.classRecordId || klass.classId || "").trim();
  return classes.map((klass) => {
    const sessions = sessionsByClass[key(klass)];
    return { klass, timing: Array.isArray(sessions) ? classTimingSummary(klass, sessions, now) : null };
  }).sort((left, right) => (left.timing?.sortTime ?? Infinity) - (right.timing?.sortTime ?? Infinity)
    || String(left.klass.name || left.klass.className || "").localeCompare(String(right.klass.name || right.klass.className || "")));
}
