const TZ = "Africa/Accra";
const DEFAULT_AUTO_OPEN_LEAD_MINUTES = 30;
const DEFAULT_AUTO_OPEN_WINDOW_MINUTES = 180;
const BLOCKED_SESSION_STATUSES = new Set([
  "cancelled", "canceled", "completed", "superseded", "deleted",
]);
const BLOCKED_CLASS_STATUSES = new Set([
  "archived", "inactive", "deleted", "cancelled", "canceled",
]);

function text(value) {
  return String(value || "").trim();
}

function comparable(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ");
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function timestampMillis(value) {
  if (!value) return null;
  if (typeof value?.toMillis === "function") {
    const millis = Number(value.toMillis());
    return Number.isFinite(millis) ? millis : null;
  }
  const date = asDate(value);
  return date ? date.getTime() : null;
}

function isoDate(value, timezone = TZ) {
  const date = asDate(value);
  if (!date) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function sessionStart(session = {}) {
  return asDate(session.startsAt || session.startAt || session.startDateTime || session.date);
}

function assignmentIdForSession(session = {}) {
  return text(
    (Array.isArray(session.assignmentIds) ? session.assignmentIds[0] : "")
    || (Array.isArray(session.assignments) ? session.assignments[0] : "")
    || session.assignmentId
    || session.assignment_id,
  );
}

function parseAssignmentChapter(assignmentId) {
  const normalized = text(assignmentId);
  const parts = normalized.split("-");
  return parts.length > 1 ? text(parts.slice(1).join("-")) : "";
}

function classValues(klass = {}) {
  return [
    klass.id, klass.classId, klass.classRecordId, klass.name,
    klass.className, klass.group, klass.slug,
  ].map(comparable).filter(Boolean);
}

function resolveClassForSession(session = {}, classes = []) {
  const exactIds = [session.classRecordId, session.classId, session.classDocumentId]
    .map(text).filter(Boolean);
  for (const id of exactIds) {
    const exact = classes.find((klass) => text(klass.id) === id);
    if (exact) return exact;
  }

  const values = new Set([
    ...exactIds,
    session.className,
    session.class,
    session.group,
  ].map(comparable).filter(Boolean));
  const matches = classes.filter((klass) => classValues(klass).some((value) => values.has(value)));
  return matches.length === 1 ? matches[0] : null;
}

function autoOpenSettings(klass = {}, runtimeConfig = {}) {
  const attendance = runtimeConfig.attendance || {};
  const enabled = klass.attendanceAutoOpenEnabled !== false
    && attendance.auto_open_enabled !== false;
  const leadMinutes = Math.max(1, Math.min(240, Number(
    klass.attendanceAutoOpenLeadMinutes
    ?? attendance.auto_open_lead_minutes
    ?? DEFAULT_AUTO_OPEN_LEAD_MINUTES,
  ) || DEFAULT_AUTO_OPEN_LEAD_MINUTES));
  const windowMinutes = Math.max(30, Math.min(720, Number(
    klass.attendanceAutoOpenWindowMinutes
    ?? attendance.auto_open_window_minutes
    ?? DEFAULT_AUTO_OPEN_WINDOW_MINUTES,
  ) || DEFAULT_AUTO_OPEN_WINDOW_MINUTES));
  return { enabled, leadMinutes, windowMinutes };
}

function isSessionEligible(session = {}) {
  const status = comparable(session.status || session.sessionStatus || "scheduled");
  return !BLOCKED_SESSION_STATUSES.has(status)
    && session.remindersSuppressed !== true
    && session.superseded !== true
    && session.isSuperseded !== true
    && session.schoolClosed !== true
    && session.holidayClosed !== true;
}

function classIsActive(klass = {}) {
  return !BLOCKED_CLASS_STATUSES.has(comparable(klass.status));
}

async function holidayClosesSession({ db, klass, session }) {
  const timezone = text(klass.timezone) || TZ;
  const date = isoDate(sessionStart(session), timezone);
  if (!date) return false;
  if (Array.isArray(klass.holidayDatesExcluded) && klass.holidayDatesExcluded.map(text).includes(date)) {
    return true;
  }
  const country = text(klass.holidayCalendarCountryCode || "GH").toUpperCase() || "GH";
  const snap = await db.collection("holidayCalendar").doc(`${country}_${date}`).get();
  if (!snap.exists) return false;
  const holiday = snap.data() || {};
  return holiday.schoolClosed === true;
}

function dueForAutoOpen({ session, klass, now, runtimeConfig }) {
  if (!isSessionEligible(session) || !classIsActive(klass)) return false;
  const settings = autoOpenSettings(klass, runtimeConfig);
  if (!settings.enabled) return false;
  const startsAt = sessionStart(session);
  const nowDate = asDate(now);
  if (!startsAt || !nowDate) return false;
  const minutesUntilStart = (startsAt.getTime() - nowDate.getTime()) / 60000;
  return minutesUntilStart > 0 && minutesUntilStart <= settings.leadMinutes;
}

function automationOwnsOpenWindow(existing = {}) {
  return existing.autoOpened === true
    && existing.opened === true
    && !text(existing.openedBy)
    && !text(existing.createdBy)
    && !text(existing.closedBy);
}

function storedWindowMatches(existing = {}, openFromMs, openToMs) {
  return timestampMillis(existing.openFrom) === openFromMs
    && timestampMillis(existing.openTo) === openToMs;
}

async function openOneSession({ admin, db, klass, session, runtimeConfig, now }) {
  const classId = text(klass.id || klass.classId || klass.classRecordId);
  const sessionId = text(session.id);
  const assignmentId = assignmentIdForSession(session);
  if (!classId || !sessionId) return { opened: false, refreshed: false, skipped: "missing_identity" };
  if (!assignmentId) return { opened: false, refreshed: false, skipped: "missing_assignment" };
  if (await holidayClosesSession({ db, klass, session })) {
    return { opened: false, refreshed: false, skipped: "holiday_closed" };
  }

  const settings = autoOpenSettings(klass, runtimeConfig);
  const startsAt = sessionStart(session);
  const openFromMs = startsAt.getTime() - settings.leadMinutes * 60 * 1000;
  const openToMs = openFromMs + settings.windowMinutes * 60 * 1000;
  const openFrom = admin.firestore.Timestamp.fromMillis(openFromMs);
  const openTo = admin.firestore.Timestamp.fromMillis(openToMs);
  const ref = db.doc(`attendance/${classId}/sessions/${sessionId}`);
  let outcome = { opened: false, refreshed: false, skipped: "already_open" };

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const existing = snap.exists ? snap.data() || {} : {};
    const autoOwnedWindow = automationOwnsOpenWindow(existing);

    if (existing.opened === true) {
      if (!autoOwnedWindow) {
        outcome = { opened: false, refreshed: false, skipped: "already_open" };
        return;
      }
      if (storedWindowMatches(existing, openFromMs, openToMs)) {
        outcome = { opened: false, refreshed: false, skipped: "already_open" };
        return;
      }
    }
    if (existing.opened === false && text(existing.closedBy)) {
      outcome = { opened: false, refreshed: false, skipped: "manually_closed" };
      return;
    }

    const refreshing = autoOwnedWindow;
    const topic = text(session.topic || session.title || session.sessionLabel || klass.name || klass.className || "Live class");
    transaction.set(ref, {
      classId,
      sessionId,
      date: isoDate(startsAt, text(klass.timezone) || TZ),
      sessionLabel: topic,
      assignmentId,
      topic,
      chapter: parseAssignmentChapter(assignmentId),
      opened: true,
      openFrom,
      openTo,
      autoOpened: true,
      autoOpenLeadMinutes: settings.leadMinutes,
      autoOpenWindowMinutes: settings.windowMinutes,
      autoOpenSessionStartsAt: startsAt.toISOString(),
      ...(refreshing
        ? { autoOpenWindowRefreshedAt: admin.firestore.FieldValue.serverTimestamp() }
        : { autoOpenedAt: admin.firestore.FieldValue.serverTimestamp() }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(snap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
    }, { merge: true });
    outcome = {
      opened: !refreshing,
      refreshed: refreshing,
      skipped: "",
      openFromMs,
      openToMs,
    };
  });

  if (outcome.opened || outcome.refreshed) {
    try {
      await db.collection("classSessions").doc(sessionId).set({
        attendanceSessionId: sessionId,
        attendanceAutoOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
        attendanceAutoOpenLeadMinutes: settings.leadMinutes,
        attendanceAutoOpenWindowRefreshed: outcome.refreshed === true,
      }, { merge: true });
    } catch (error) {
      console.warn("attendance_auto_open_session_diagnostic_failed", {
        classId,
        sessionId,
        message: error?.message || String(error),
      });
    }
  }

  return outcome;
}

async function runAutoOpenCheckins({
  admin,
  db,
  classes = [],
  sessions = [],
  runtimeConfig = {},
  now = new Date(),
} = {}) {
  const results = [];

  for (const session of sessions) {
    const klass = resolveClassForSession(session, classes);
    if (!klass || !dueForAutoOpen({ session, klass, now, runtimeConfig })) continue;
    try {
      results.push({
        classId: text(klass.id || klass.classId || klass.classRecordId),
        sessionId: text(session.id),
        ok: true,
        ...await openOneSession({ admin, db, klass, session, runtimeConfig, now }),
      });
    } catch (error) {
      console.error("attendance_auto_open_failed", {
        classId: text(klass.id || klass.classId || klass.classRecordId),
        sessionId: text(session.id),
        message: error?.message || String(error),
      });
      results.push({
        classId: text(klass.id || klass.classId || klass.classRecordId),
        sessionId: text(session.id),
        ok: false,
        opened: false,
        refreshed: false,
        error: error?.message || String(error),
      });
    }
  }

  const opened = results.filter((result) => result.opened).length;
  const refreshed = results.filter((result) => result.refreshed).length;
  return { checked: results.length, opened, refreshed, results };
}

module.exports = {
  runAutoOpenCheckins,
  _test: {
    assignmentIdForSession,
    autoOpenSettings,
    automationOwnsOpenWindow,
    dueForAutoOpen,
    openOneSession,
    resolveClassForSession,
    storedWindowMatches,
    timestampMillis,
  },
};
