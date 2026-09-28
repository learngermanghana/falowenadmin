import { normalizeScheduleRules, toSessionDate } from "./liveClassScheduling.js";

const CANCELLED_STATUSES = new Set(["cancelled", "canceled"]);

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
    .filter((session) => !CANCELLED_STATUSES.has(String(session.status || "").toLowerCase()))
    .map((session) => ({ session, startsAt: toSessionDate(session.startsAt), endsAt: toSessionDate(session.endsAt) }))
    .filter(({ startsAt, endsAt }) => startsAt && (endsAt ? endsAt > now : startsAt >= now))
    .sort((left, right) => left.startsAt - right.startsAt);
}

export function classTimingSummary(klass = {}, sessions = [], now = new Date()) {
  const timezone = String(klass.timezone || "Africa/Accra").trim() || "Africa/Accra";
  const next = futureSessions(sessions, now)[0];
  if (!next) return { label: "No upcoming class", tone: "muted", sortTime: Number.POSITIVE_INFINITY };

  const time = timeLabel(next.startsAt, timezone);
  if (next.startsAt <= now && (!next.endsAt || next.endsAt > now)) {
    return { label: `In progress · ${time}`, tone: "live", sortTime: next.startsAt.getTime() };
  }

  const sessionDay = dateKey(next.startsAt, timezone);
  const today = dateKey(now, timezone);
  const tomorrow = dateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000), timezone);
  if (sessionDay === today) return { label: `Today · ${time}`, tone: "today", sortTime: next.startsAt.getTime() };
  if (sessionDay === tomorrow) return { label: `Tomorrow · ${time}`, tone: "tomorrow", sortTime: next.startsAt.getTime() };

  const daysAway = Math.round((new Date(`${sessionDay}T12:00:00Z`) - new Date(`${today}T12:00:00Z`)) / 86400000);
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    ...(daysAway > 6 ? { day: "2-digit", month: "short" } : { weekday: "short" }),
  }).format(next.startsAt);
  return { label: `${date} · ${time}`, tone: "next", sortTime: next.startsAt.getTime() };
}

export function weeklyTimetableLabels(klass = {}) {
  return normalizeScheduleRules(klass.scheduleRules || []).map((rule) => (
    `${rule.day.slice(0, 1).toUpperCase()}${rule.day.slice(1)} · ${rule.startTime}`
  ));
}

