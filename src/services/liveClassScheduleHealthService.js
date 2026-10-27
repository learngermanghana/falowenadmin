import {
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import {
  buildClassScheduleHealth,
  timetableHealthClassFields,
} from "../utils/liveClassScheduleHealth.js";

function normalize(value) {
  return String(value || "").trim();
}

function toMillis(value) {
  if (!value) return Number.NaN;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return (Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000);
  }
  return new Date(value).getTime();
}

function superseded(session = {}) {
  return session.superseded === true || normalize(session.status).toLowerCase() === "superseded";
}

function shouldPauseFutureReminder(session = {}, broken = false, nowMs = Date.now()) {
  if (!broken || superseded(session)) return false;
  const status = normalize(session.status || "scheduled").toLowerCase();
  if (["cancelled", "completed"].includes(status)) return false;
  const startsAtMs = toMillis(session.startsAt);
  return Number.isFinite(startsAtMs) && startsAtMs > nowMs;
}

export async function validateAndSaveClassScheduleHealth({
  classId,
  klass = {},
  sessions = [],
  adminId = "admin",
} = {}) {
  const resolvedClassId = normalize(classId || klass.id || klass.classId);
  if (!resolvedClassId) throw new Error("Class ID is required.");

  const health = buildClassScheduleHealth({ klass, sessions });
  const timestamp = serverTimestamp();
  const scheduleVersion = Date.now();
  const batch = writeBatch(db);
  const broken = health.status === "broken";
  const nowMs = Date.now();

  batch.set(doc(db, "classes", resolvedClassId), {
    ...timetableHealthClassFields(health, {
      validatedAt: timestamp,
      validatedBy: adminId,
      scheduleVersion,
    }),
    updatedAt: timestamp,
  }, { merge: true });

  sessions.forEach((session) => {
    const sessionId = normalize(session.id);
    if (!sessionId || superseded(session)) return;
    const status = normalize(session.status || "scheduled").toLowerCase();
    const pauseForHealth = shouldPauseFutureReminder(session, broken, nowMs);
    const wasPausedForHealth = session.scheduleHealthRemindersSuppressed === true
      || normalize(session.reminderSuppressionSource) === "schedule-health";

    if (!pauseForHealth && !wasPausedForHealth) return;

    const remindersSuppressed = pauseForHealth || ["cancelled", "completed"].includes(status);
    const patch = {
      remindersSuppressed,
      scheduleHealthRemindersSuppressed: pauseForHealth,
      reminderSuppressionSource: pauseForHealth ? "schedule-health" : "",
      reminderSuppressionReason: pauseForHealth
        ? "Future reminders are paused until the class timetable is repaired."
        : "",
      reminderScheduleVersion: scheduleVersion,
      updatedAt: timestamp,
    };

    batch.set(doc(db, "classSessions", sessionId), patch, { merge: true });
    batch.set(doc(db, "attendance", resolvedClassId, "sessions", sessionId), {
      classId: resolvedClassId,
      classSessionId: sessionId,
      ...patch,
    }, { merge: true });
  });

  batch.set(doc(db, "calendarFeeds", resolvedClassId), {
    classId: resolvedClassId,
    sessionScheduleVersion: scheduleVersion,
    updatedAt: timestamp,
  }, { merge: true });

  await batch.commit();
  return health;
}

export { buildClassScheduleHealth };
