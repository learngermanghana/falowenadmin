import { getCourseDictionaryEntry } from "../data/courseDictionary.js";
import { getCourseSessionCount } from "../data/courseSessionGroups.js";

export const CLASS_STATUSES = ["draft", "upcoming", "active", "graduated", "archived"];
export const SESSION_STATUSES = ["scheduled", "live", "completed", "cancelled", "rescheduled"];
const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
let cachedSchoolClosureDates = new Set();

function normalizeIsoDate(value) {
  const date = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function toExcludedDateSet(excludedDates) {
  const source = excludedDates instanceof Set
    ? [...excludedDates]
    : Array.isArray(excludedDates)
      ? excludedDates
      : [...cachedSchoolClosureDates];
  return new Set(source.map(normalizeIsoDate).filter(Boolean));
}

export function setSchedulingSchoolClosureDates(dates = []) {
  cachedSchoolClosureDates = toExcludedDateSet(dates);
  return [...cachedSchoolClosureDates].sort();
}

export function getSchedulingSchoolClosureDates() {
  return [...cachedSchoolClosureDates].sort();
}

export function slugifyClassName(name) {
  const slug = String(name || "").trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `class-${Date.now()}`;
}

export function buildClassUrl(classRecord = {}) {
  const slug = classRecord.slug || slugifyClassName(classRecord.name || classRecord.id || classRecord.classId);
  return `/classes/${slug}`;
}

export function validateIanaTimezone(timezone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function zonedLocalToUtcIso(dateIso, time = "00:00", timezone = "Africa/Accra") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateIso))) throw new Error("date must be YYYY-MM-DD");
  if (!/^\d{2}:\d{2}$/.test(String(time))) throw new Error("time must be HH:mm");
  if (!validateIanaTimezone(timezone)) throw new Error("timezone must be a valid IANA timezone");
  const [year, month, day] = dateIso.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(utcGuess);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asIfUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
  return new Date(utcGuess.getTime() - (asIfUtc - utcGuess.getTime())).toISOString();
}

export function normalizeScheduleRules(scheduleRules = []) {
  const rules = Array.isArray(scheduleRules) ? scheduleRules : scheduleRules.weekly || [];
  return rules.map((rule) => ({ day: String(rule.day || rule.weekday || "").slice(0, 3).toLowerCase(), startTime: String(rule.startTime || rule.time || ""), durationMinutes: Number(rule.durationMinutes || 120) })).filter((rule) => DAY_INDEX[rule.day] != null && /^\d{2}:\d{2}$/.test(rule.startTime));
}

function assertNoDuplicateScheduleRules(rules = []) {
  const seen = new Set();
  for (const rule of rules) {
    const key = `${rule.day}_${rule.startTime}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate schedule rule for ${rule.day} at ${rule.startTime}. Use a different start time or remove the duplicate rule.`);
    }
    seen.add(key);
  }
}

function formatIsoDateUtc(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function toSessionDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === "function") {
    const parsed = value.toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value?.toMillis === "function") {
    const parsed = new Date(value.toMillis());
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    const parsed = new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function classDateToMillis(value, endOfDay = false) {
  if (!value) return null;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();

  const text = String(value).trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`)
    : new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export function getCourseDictionarySessionCount(levelId) {
  return getCourseSessionCount(levelId);
}

function resolveSessionLimit(levelId, totalSessions) {
  const dictionaryCount = getCourseDictionarySessionCount(levelId);
  const requestedCount = Number(totalSessions || 0);

  if (dictionaryCount > 0 && requestedCount > 0) return Math.min(dictionaryCount, requestedCount);
  if (dictionaryCount > 0) return dictionaryCount;
  if (requestedCount > 0) return requestedCount;
  return Number.POSITIVE_INFINITY;
}

export function calculateClassEndDate({ levelId, startDate, scheduleRules = [], excludedDates }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(startDate || ""))) return "";
  const sessionCount = getCourseDictionarySessionCount(levelId);
  if (!sessionCount) return "";
  const rules = normalizeScheduleRules(scheduleRules);
  if (!rules.length) return "";
  const excluded = toExcludedDateSet(excludedDates);

  let remainingSessions = sessionCount;
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  for (let guard = 0; guard < 1095; guard += 1) {
    const dateIso = formatIsoDateUtc(cursor);
    if (!excluded.has(dateIso)) {
      const weekday = cursor.getUTCDay();
      const sessionsOnDate = rules.filter((rule) => DAY_INDEX[rule.day] === weekday).length;
      remainingSessions -= sessionsOnDate;
      if (remainingSessions <= 0) return dateIso;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return "";
}

export function generateSessionOccurrences({
  classId,
  id,
  levelId,
  totalSessions,
  startDate,
  endDate,
  timezone = "Africa/Accra",
  scheduleRules = [],
  excludedDates,
}) {
  const resolvedClassId = String(classId || id || "").trim();
  const rules = normalizeScheduleRules(scheduleRules);
  if (!resolvedClassId) throw new Error("classId is required");
  if (rules.length === 0) throw new Error("at least one weekly schedule rule is required");
  assertNoDuplicateScheduleRules(rules);

  const sessionLimit = resolveSessionLimit(levelId, totalSessions);
  const excluded = toExcludedDateSet(excludedDates);
  const sessions = [];
  const finalDate = new Date(`${endDate}T00:00:00.000Z`);

  for (
    let cursor = new Date(`${startDate}T00:00:00.000Z`);
    cursor <= finalDate && sessions.length < sessionLimit;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const dateIso = cursor.toISOString().slice(0, 10);
    if (excluded.has(dateIso)) continue;
    const weekday = cursor.getUTCDay();
    const matchingRules = rules.filter((item) => DAY_INDEX[item.day] === weekday);

    for (const rule of matchingRules) {
      if (sessions.length >= sessionLimit) break;
      const startsAt = zonedLocalToUtcIso(dateIso, rule.startTime, timezone);
      const endsAt = new Date(new Date(startsAt).getTime() + rule.durationMinutes * 60000).toISOString();
      sessions.push({ id: `${resolvedClassId}_${dateIso}_${rule.startTime.replace(":", "")}`, classId: resolvedClassId, startsAt, endsAt, status: "scheduled", topic: "", chapterIds: [] });
    }
  }

  return sessions.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}


export function sessionDateInTimezone(value, timezone = "Africa/Accra") {
  const parsed = toSessionDate(value);
  if (!parsed) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function latestSessionDateInTimezone(sessions = [], timezone = "Africa/Accra") {
  const latest = [...sessions]
    .filter((session) => String(session.status || "scheduled").toLowerCase() !== "cancelled")
    .filter((session) => Boolean(toSessionDate(session.startsAt)))
    .sort((left, right) => toSessionDate(left.startsAt).getTime() - toSessionDate(right.startsAt).getTime())
    .at(-1);
  return latest ? sessionDateInTimezone(latest.startsAt, timezone) : "";
}


export function getEffectiveClassEndDate(klass = {}, sessions = []) {
  const candidates = [
    klass?.endDate,
    klass?.configuredEndDate,
    klass?.holidayAdjustedEndDate,
    klass?.sessionDerivedEndDate,
    latestSessionDateInTimezone(sessions, klass?.timezone || "Africa/Accra"),
  ]
    .map(normalizeIsoDate)
    .filter(Boolean);

  return candidates.length ? candidates.sort().at(-1) : "";
}

export function selectNextSession(sessions = [], now = new Date()) {
  const nowMs = new Date(now).getTime();
  return [...sessions].filter((s) => !["cancelled", "completed"].includes(s.status) && Number.isFinite(toSessionDate(s.startsAt)?.getTime()) && toSessionDate(s.startsAt).getTime() >= nowMs).sort((a, b) => toSessionDate(a.startsAt).getTime() - toSessionDate(b.startsAt).getTime())[0] || null;
}

export function selectLatestCompletedSession(sessions = []) {
  return [...sessions].filter((s) => s.status === "completed").sort((a, b) => (toSessionDate(b.endsAt || b.startsAt)?.getTime() || 0) - (toSessionDate(a.endsAt || a.startsAt)?.getTime() || 0))[0] || null;
}

export function calculateClassProgress(sessions = [], now = new Date(), classRecord = {}) {
  const nowMs = new Date(now).getTime();
  const startMs = classDateToMillis(classRecord?.startDate, false);
  const endMs = classDateToMillis(getEffectiveClassEndDate(classRecord, sessions), true);

  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
    if (nowMs <= startMs) return 0;
    if (nowMs >= endMs) return 100;
    const elapsed = Math.round(((nowMs - startMs) / (endMs - startMs)) * 100);
    return Math.max(1, Math.min(99, elapsed));
  }

  const valid = sessions.filter((session) => String(session.status || "scheduled").toLowerCase() !== "cancelled");
  if (!valid.length) return 0;

  const progressed = valid.filter((session) => {
    if (String(session.status || "").toLowerCase() === "completed") return true;
    const startsAtMs = toSessionDate(session.startsAt)?.getTime();
    return Number.isFinite(startsAtMs) && startsAtMs <= nowMs;
  });

  const calculated = Math.round((progressed.length / valid.length) * 100);
  const allCompleted = valid.every((session) => String(session.status || "scheduled").toLowerCase() === "completed");
  return calculated >= 100 && !allCompleted ? 99 : calculated;
}

export function calculateCountdown(target, now = new Date()) {
  const diffMs = Math.max(0, (toSessionDate(target)?.getTime() || 0) - new Date(now).getTime());
  return { totalMs: diffMs, days: Math.floor(diffMs / 86400000), hours: Math.floor((diffMs % 86400000) / 3600000), minutes: Math.floor((diffMs % 3600000) / 60000) };
}

export function resolveChapterDictionary(levelId, chapterIds = []) {
  return chapterIds.map((chapterId) => getCourseDictionaryEntry(`${String(levelId).toUpperCase()}-${chapterId}`) || getCourseDictionaryEntry(chapterId)).filter(Boolean);
}

export function shouldSendReminderForSession(session) {
  return session?.status !== "cancelled" && session?.remindersSuppressed !== true;
}

export function sessionStatusDoesNotArchiveClass(classStatus, sessionStatus) {
  return sessionStatus === "completed" ? classStatus : classStatus;
}
