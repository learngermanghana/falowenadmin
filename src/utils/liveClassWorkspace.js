import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import { resolveOfficialSessionNumber } from "./liveClassLessonOrder.js";
import { toSessionDate, zonedLocalToUtcIso, sessionDateInTimezone } from "./liveClassScheduling.js";
import { buildSessionReschedulePlan } from "./liveClassReschedulePlan.js";

const status = session => String(session.status || "scheduled").toLowerCase();
export function orderedWorkspaceSessions(sessions = [], levelId = "", filter = "remaining", sort = "lesson") {
  const groups = getCourseSessionGroups(levelId);
  return sessions.filter(session => !session.superseded && status(session) !== "superseded")
    .filter(session => filter === "all" || (filter === "remaining" ? !["completed", "cancelled"].includes(status(session)) : status(session) === filter))
    .sort((a, b) => sort === "date"
      ? (toSessionDate(a.startsAt)?.getTime() || 0) - (toSessionDate(b.startsAt)?.getTime() || 0)
      : (resolveOfficialSessionNumber(a, groups, levelId) || Infinity) - (resolveOfficialSessionNumber(b, groups, levelId) || Infinity));
}
export function nextTeachingSession(sessions = [], now = new Date()) {
  const active = orderedWorkspaceSessions(sessions, "", "remaining", "date");
  return active.find(session => (toSessionDate(session.endsAt)?.getTime() || 0) >= now.getTime()) || null;
}
export function completionLabel(session = {}) {
  if (status(session) !== "completed") return status(session);
  const automatic = session.completionSource === "automatic" || String(session.completedBy || "").startsWith("system:");
  return automatic ? "Completed automatically" : "Completed by staff";
}
export function scheduleChangePreview({ klass, sessions, change }) {
  if (!change) return null;
  const session = sessions.find(row => row.id === change.sessionId);
  if (!session) throw new Error("Select a session first.");
  if (change.action === "cancel") return { changes: [{ session, startsAt: session.startsAt, endsAt: session.endsAt, plannedStatus: "cancelled" }], endDate: klass.endDate };
  const [date, time] = String(change.startsAt || "").split("T");
  const targetStartsAt = zonedLocalToUtcIso(date, time, klass.timezone || "Africa/Accra");
  if (change.moveMode !== "following" && Date.parse(targetStartsAt) === toSessionDate(session.startsAt)?.getTime()) throw new Error("Choose a different date or time.");
  const targetEndsAt = new Date(Date.parse(targetStartsAt) + Number(change.durationMinutes || 90) * 60000).toISOString();
  if (change.moveMode === "following" && !change.scheduleRules?.length) throw new Error("Select at least one weekly day.");
  const plan = buildSessionReschedulePlan({ klass: { ...klass, ...(change.moveMode === "following" ? { scheduleRules: change.scheduleRules } : {}) }, sessions, sessionId: session.id, targetStartsAt, targetEndsAt, mode: change.moveMode });
  const byId = new Map(plan.changes.map(row => [row.session.id, row]));
  const lastStart = sessions
    .filter(row => !row.superseded && !["cancelled", "superseded"].includes(byId.get(row.id)?.plannedStatus || status(row)))
    .map(row => toSessionDate(byId.get(row.id)?.startsAt || row.startsAt)?.getTime() || 0)
    .reduce((latest, time) => Math.max(latest, time), 0);
  return { ...plan, endDate: lastStart ? sessionDateInTimezone(new Date(lastStart), klass.timezone) : klass.endDate };
}
export function failedClassCommunications(classes = []) {
  return classes.flatMap(klass => [
    { field: "classReminderEmailLastStatus", label: "Class reminder", detail: klass.classReminderEmailLastError },
    { field: "attendanceConfirmationEmailLastStatus", label: "Attendance email", detail: klass.attendanceConfirmationEmailLastError },
  ].filter(item => /fail|error/i.test(String(klass[item.field] || ""))).map(item => ({ id: `${klass.id}-${item.field}`, classId: klass.id, className: klass.name || klass.className || klass.id, ...item })));
}
