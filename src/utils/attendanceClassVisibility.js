import { isAppAssessment } from "./appAssessment.js";
import { sessionDateInTimezone, toSessionDate } from "./liveClassScheduling.js";

const TERMINAL_CLASS_STATUSES = new Set([
  "archived", "graduated", "inactive", "cancelled", "canceled",
  "completed", "closed", "draft",
]);
const NON_LIVE_SESSION_STATUSES = new Set([
  "cancelled", "canceled", "completed", "complete", "done", "superseded",
]);

function normalize(value) {
  return String(value || "").trim();
}

function endDateForClass(klass = {}) {
  const timezone = normalize(klass.timezone) || "Africa/Accra";
  for (const value of [
    klass.endDate, klass.configuredEndDate,
    klass.holidayAdjustedEndDate, klass.sessionDerivedEndDate,
  ]) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalize(value))) return normalize(value);
    if (value) {
      const date = toSessionDate(value);
      if (date) return sessionDateInTimezone(date, timezone);
    }
  }
  return "";
}

/**
 * Class status alone is not sufficient: old records can remain "active" after
 * the end date. Ended classes stay readable in history, not active check-in.
 */
export function isActiveLiveClass(klass = {}, now = new Date()) {
  if (klass.archived === true || klass.isArchived === true || klass.active === false) return false;
  const status = normalize(klass.status).toLowerCase();
  if (TERMINAL_CLASS_STATUSES.has(status)) return false;

  const timezone = normalize(klass.timezone) || "Africa/Accra";
  const endDate = endDateForClass(klass);
  if (endDate && endDate < sessionDateInTimezone(now, timezone)) return false;

  if (["active", "ongoing", "upcoming", "scheduled", "open"].includes(status)) return true;
  return Boolean(endDate || klass.name || klass.className);
}

/** Only real, still-open teaching sessions can become default check-ins. */
export function isActiveCheckinSession(session = {}, klass = {}, now = new Date()) {
  if (!isActiveLiveClass(klass, now) || session.superseded === true || isAppAssessment(session)) return false;
  if (NON_LIVE_SESSION_STATUSES.has(normalize(session.status).toLowerCase())) return false;

  const startsAt = toSessionDate(session.startsAt);
  const endsAt = toSessionDate(session.endsAt) || startsAt;
  if (!startsAt || !endsAt || (endsAt < now && normalize(session.status).toLowerCase() !== "live")) return false;

  const timezone = normalize(klass.timezone) || "Africa/Accra";
  const endDate = endDateForClass(klass);
  if (endDate && sessionDateInTimezone(startsAt, timezone) > endDate) return false;
  return true;
}

/**
 * Directly linked historical records are always reviewable, but navigating
 * to attendance without a session ID must never select a finished meeting.
 */
export function chooseAttendanceSession(sessions = [], klass = {}, requestedId = "", now = new Date()) {
  const requested = sessions.find((session) => session.id === requestedId);
  if (requested) return requested;

  return [...sessions]
    .filter((session) => isActiveCheckinSession(session, klass, now))
    .sort((left, right) => toSessionDate(left.startsAt) - toSessionDate(right.startsAt))[0] || null;
}
