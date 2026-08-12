const BLOCKED_SESSION_STATUSES = new Set([
  "cancelled", "canceled", "completed", "superseded", "deleted",
]);

function normalize(value) {
  return String(value || "").trim();
}

function statusOf(session = {}) {
  return normalize(session.status || session.sessionStatus || "scheduled").toLowerCase();
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sessionStart(session = {}) {
  return toDate(session.startsAt || session.startAt || session.startDateTime || session.date);
}

export function reminderSuppressionReason(session = {}) {
  const status = statusOf(session);
  if (BLOCKED_SESSION_STATUSES.has(status)) return `session status is ${status}`;
  if (session.remindersSuppressed === true) return "remindersSuppressed is true";
  if (session.superseded === true || session.isSuperseded === true) return "session is superseded";
  if (session.schoolClosed === true || session.holidayClosed === true) return "school/holiday closure";
  return "";
}

export function reminderWindowStatus(startsAt, now = new Date()) {
  const start = toDate(startsAt);
  const current = toDate(now);
  if (!start || !current) return "invalid-time";
  const minutes = (start.getTime() - current.getTime()) / 60000;
  if (minutes <= 0) return "started";
  if (minutes > 30) return "pending-30min";
  if (minutes >= 23) return "30min-window";
  if (minutes > 10) return "pending-10min";
  if (minutes >= 3) return "10min-window";
  return "reminder-windows-passed";
}

export function buildClassReminderDiagnostic({
  klass = {},
  sessions = [],
  students = [],
  now = new Date(),
} = {}) {
  const current = toDate(now) || new Date();
  const future = sessions
    .map((session) => ({ session, start: sessionStart(session) }))
    .filter(({ session, start }) => start && start.getTime() > current.getTime() && !BLOCKED_SESSION_STATUSES.has(statusOf(session)))
    .sort((a, b) => a.start - b.start);
  const next = future[0] || null;
  const suppressionReason = next ? reminderSuppressionReason(next.session) : "";
  const activeStudents = students.filter((student) => {
    const status = normalize(student.status || student.studentStatus || student.enrollmentStatus).toLowerCase();
    const role = normalize(student.role).toLowerCase();
    if (role && role !== "student") return false;
    return !["inactive", "archived", "withdrawn", "removed", "cancelled", "canceled", "deleted", "blocked", "suspended"].includes(status);
  });

  return {
    nextSession: next?.session || null,
    nextStartsAt: next?.start?.toISOString() || "",
    eligible: Boolean(next && !suppressionReason),
    suppressionReason,
    activeStudentCount: activeStudents.length,
    hasRecipients: activeStudents.length > 0,
    reminderWindow: next ? reminderWindowStatus(next.start, current) : "no-future-session",
    timetableHealth: normalize(klass.timetableIntegrityStatus || "unknown").toLowerCase(),
    warningCodes: Array.isArray(klass.timetableIntegrityCodes) ? klass.timetableIntegrityCodes : [],
  };
}
