const DEFAULT_DELAY_MINUTES = 30;
const DEFAULT_LOOKBACK_DAYS = 14;
const BLOCKED_SESSION_STATUSES = new Set(["cancelled", "canceled", "completed", "superseded", "deleted"]);
const BLOCKED_CLASS_STATUSES = new Set(["archived", "deleted", "cancelled", "canceled"]);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function asDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sessionEnd(session = {}) {
  const explicit = asDate(session.endsAt || session.endAt);
  if (explicit) return explicit;
  const start = asDate(session.startsAt || session.startAt);
  return start ? new Date(start.getTime() + 60 * 60 * 1000) : null;
}

function isCompletionEligible(session = {}) {
  const status = normalize(session.status || session.sessionStatus || "scheduled");
  return !BLOCKED_SESSION_STATUSES.has(status)
    && ["scheduled", "live", "rescheduled"].includes(status)
    && session.autoCompletionSuppressed !== true
    && session.superseded !== true
    && session.isSuperseded !== true
    && !String(session.supersededBySessionId || "").trim();
}

function completionDueAt(session = {}, delayMinutes = DEFAULT_DELAY_MINUTES) {
  const end = sessionEnd(session);
  return end ? new Date(end.getTime() + Math.max(0, Number(delayMinutes) || 0) * 60000) : null;
}

function findDueAutoCompletions({
  sessions = [],
  now = new Date(),
  delayMinutes = DEFAULT_DELAY_MINUTES,
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
} = {}) {
  const nowDate = asDate(now);
  if (!nowDate) return [];
  const oldestAllowed = nowDate.getTime() - Math.max(1, Number(lookbackDays) || DEFAULT_LOOKBACK_DAYS) * 86400000;

  return sessions
    .filter(isCompletionEligible)
    .map((session) => ({ session, dueAt: completionDueAt(session, delayMinutes), end: sessionEnd(session) }))
    .filter(({ dueAt, end }) => dueAt && end && dueAt <= nowDate && end.getTime() >= oldestAllowed)
    .sort((left, right) => left.dueAt - right.dueAt);
}

async function completeOneSession({ admin, db, sessionId, now, delayMinutes }) {
  const sessionRef = db.collection("classSessions").doc(String(sessionId));
  const result = { completed: false, skipped: "" };

  await db.runTransaction(async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists) {
      result.skipped = "missing_session";
      return;
    }

    const session = { id: sessionSnap.id, ...sessionSnap.data() };
    const classId = String(session.classId || session.classRecordId || "").trim();
    if (!classId) {
      result.skipped = "missing_class_id";
      return;
    }

    const classRef = db.collection("classes").doc(classId);
    const classSnap = await transaction.get(classRef);
    const klass = classSnap.exists ? { id: classSnap.id, ...classSnap.data() } : null;
    if (!klass) {
      result.skipped = "missing_class";
      return;
    }
    if (BLOCKED_CLASS_STATUSES.has(normalize(klass.status)) || !isCompletionEligible(session)) {
      result.skipped = "not_eligible";
      return;
    }

    const dueAt = completionDueAt(session, delayMinutes);
    if (!dueAt || dueAt > now) {
      result.skipped = "not_due";
      return;
    }

    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const previousStatus = normalize(session.status || session.sessionStatus || "scheduled") || "scheduled";
    const nextSequence = Number(session.sequence || 0) + 1;
    const patch = {
      status: "completed",
      completionSource: "automatic",
      completionPreviousStatus: previousStatus,
      completedBy: "system:auto-session-completion",
      completedAt: timestamp,
      autoCompletedAt: timestamp,
      autoCompletionSuppressed: false,
      remindersSuppressed: true,
      sequence: nextSequence,
      updatedAt: timestamp,
    };

    transaction.update(sessionRef, patch);
    transaction.set(
      db.collection("attendance").doc(classId).collection("sessions").doc(session.id),
      {
        classId,
        classSessionId: session.id,
        sessionStatus: "completed",
        status: "completed",
        completedAt: timestamp,
        completionSource: "automatic",
        remindersSuppressed: true,
        sequence: nextSequence,
        updatedAt: timestamp,
      },
      { merge: true },
    );
    transaction.set(db.collection("auditLogs").doc(), {
      type: "classSession.autoCompleted",
      classId,
      sessionId: session.id,
      previousStatus,
      completedBy: "system:auto-session-completion",
      createdAt: timestamp,
    });
    transaction.set(classRef, {
      autoCompletionLastRunAt: timestamp,
      autoCompletionLastStatus: "completed",
      autoCompletionLastSessionId: session.id,
      autoCompletionLastTopic: String(session.topic || session.title || "").trim(),
      updatedAt: timestamp,
    }, { merge: true });

    result.completed = true;
  });

  return result;
}

async function runAutoCompleteClassSessionsJob({
  admin,
  db,
  now = new Date(),
  delayMinutes = Number(process.env.CLASS_AUTO_COMPLETE_DELAY_MINUTES || DEFAULT_DELAY_MINUTES),
  lookbackDays = Number(process.env.CLASS_AUTO_COMPLETE_LOOKBACK_DAYS || DEFAULT_LOOKBACK_DAYS),
} = {}) {
  const snapshot = await db.collection("classSessions").get();
  const sessions = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const due = findDueAutoCompletions({ sessions, now, delayMinutes, lookbackDays });
  const results = [];

  for (const item of due) {
    try {
      results.push({
        sessionId: item.session.id,
        ok: true,
        ...await completeOneSession({ admin, db, sessionId: item.session.id, now: asDate(now) || new Date(), delayMinutes }),
      });
    } catch (error) {
      console.error("auto_complete_class_session_failed", {
        sessionId: item.session.id,
        message: error?.message || String(error),
      });
      results.push({ sessionId: item.session.id, ok: false, completed: false, error: error?.message || String(error) });
    }
  }

  const completed = results.filter((result) => result.completed).length;
  console.log("auto_complete_class_sessions_job_complete", { due: due.length, completed });
  return { due: due.length, completed, results };
}

function createAutoCompleteClassSessionsJob({ admin, db, onSchedule }) {
  return onSchedule({
    schedule: "*/5 * * * *",
    timeZone: "Africa/Accra",
    retryCount: 1,
  }, async () => runAutoCompleteClassSessionsJob({ admin, db }));
}

module.exports = {
  createAutoCompleteClassSessionsJob,
  runAutoCompleteClassSessionsJob,
  _test: {
    asDate,
    completionDueAt,
    findDueAutoCompletions,
    isCompletionEligible,
    sessionEnd,
  },
};
