import { latestSessionDateInTimezone, sessionDateInTimezone, zonedLocalToUtcIso } from "./liveClassScheduling.js";

function asDate(value) {
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = value instanceof Date ? value : new Date(value || 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

export function localTimeInTimezone(value, timezone = "Africa/Accra") {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone || "Africa/Accra",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function buildManualDateOverridePatch({ session = {}, dateDraft, timezone = "Africa/Accra", actorId = "admin" } = {}) {
  const nextDate = String(dateDraft || "").trim();
  if (!validIsoDate(nextDate)) throw new Error("Choose the new class date as YYYY-MM-DD.");

  const oldStart = asDate(session.startsAt);
  const oldEnd = asDate(session.endsAt);
  if (!oldStart) throw new Error("This lesson has no valid start time.");

  const startClock = localTimeInTimezone(oldStart, timezone) || "09:00";
  const startsAt = zonedLocalToUtcIso(nextDate, startClock, timezone || "Africa/Accra");
  const durationMs = oldEnd && oldEnd > oldStart
    ? oldEnd.getTime() - oldStart.getTime()
    : 2 * 60 * 60 * 1000;
  const endsAt = new Date(new Date(startsAt).getTime() + durationMs).toISOString();

  return {
    previousStartsAt: session.startsAt || "",
    previousEndsAt: session.endsAt || "",
    startsAt,
    endsAt,
    status: "rescheduled",
    manualDateOverride: true,
    manualDateOverrideDate: nextDate,
    manualDateOverrideBy: actorId || "admin",
  };
}

export function classScheduleBoundsFromSessions(sessions = [], timezone = "Africa/Accra") {
  const validSessions = sessions
    .filter((session) => String(session.status || "scheduled").toLowerCase() !== "cancelled")
    .filter((session) => !Number.isNaN(new Date(session.startsAt || 0).getTime()))
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));

  const firstSession = validSessions[0] || null;
  const latestSession = validSessions.at(-1) || null;

  return {
    firstSession,
    latestSession,
    sessionDerivedStartDate: firstSession ? sessionDateInTimezone(firstSession.startsAt, timezone || "Africa/Accra") : "",
    sessionDerivedEndDate: latestSessionDateInTimezone(validSessions, timezone || "Africa/Accra"),
  };
}
