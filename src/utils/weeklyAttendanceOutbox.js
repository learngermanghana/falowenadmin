// Derived from existing class/session records; no queue writes or background jobs.
import { isAppAssessment } from "./appAssessment.js";
export const WEEKLY_OUTBOX_START = "2026-11-23";
const text = value => String(value || "").trim().toLowerCase();
const ignored = new Set(["cancelled","canceled","deleted","superseded","postponed"]);
const completed = new Set(["completed","finished","ended"]);
export function sessionMillis(value) {
  if (!value) return NaN;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const ms = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(ms) ? (ms < 1e11 ? ms * 1000 : ms) : NaN;
}
export function mondayKey(value) {
  const ms = sessionMillis(value);
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  d.setUTCHours(0,0,0,0);
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay()+6)%7);
  return d.toISOString().slice(0,10);
}
export function receiptKey(weekStart) { return "w" + String(weekStart).replaceAll("-", ""); }
export function weekEndKey(weekStart) {
  const d = new Date(weekStart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate()+6);
  return d.toISOString().slice(0,10);
}
export function readyWeeklyPeriods(klass, sessions, now = Date.now(), { since = WEEKLY_OUTBOX_START, includeSent = false } = {}) {
  if (!klass || klass.attendanceConfirmationEmailEnabled === false || text(klass.attendanceConfirmationEmailMode || "weekly") !== "weekly" || !Array.isArray(sessions)) return [];
  const groups = new Map();
  for (const session of sessions) {
    if (ignored.has(text(session.status || session.sessionStatus)) || session.superseded || session.isSuperseded || session.isAppAssessment || session.appAssessment === true || isAppAssessment(session)) continue;
    const weekStart = mondayKey(session.startsAt || session.startAt);
    if (!weekStart || weekStart < since) continue;
    if (!groups.has(weekStart)) groups.set(weekStart, []);
    groups.get(weekStart).push(session);
  }
  return [...groups].filter(([weekStart, rows]) => {
    if (!includeSent && klass.weeklyEngagementSentWeeks?.[receiptKey(weekStart)]?.status === "sent") return false;
    return rows.every(row => {
      const actual = row.completionSource === "manual" ? sessionMillis(row.completedAt) : NaN;
      const end = Number.isFinite(actual) ? actual : sessionMillis(row.endsAt || row.endAt);
      return completed.has(text(row.status || row.sessionStatus)) && Number.isFinite(end) && end <= now;
    });
  }).map(([weekStart, rows]) => ({
    classId: String(klass._id || klass.id || klass.classRecordId || ""),
    className: klass.name || klass.className || klass.id,
    weekStart, weekEnd: weekEndKey(weekStart), lessons: rows.length,
  })).filter(row => row.classId).sort((a,b)=>a.weekStart.localeCompare(b.weekStart));
}
