import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { zonedLocalToUtcIso } from "../utils/liveClassScheduling.js";
import {
  assertTimetableIntegrity,
  inspectTimetableIntegrity,
} from "../utils/liveClassTimetableIntegrity.js";

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

function durationMinutes(payload = {}, session = {}) {
  const explicit = Number(payload.durationMinutes || 0);
  if (Number.isFinite(explicit) && explicit > 0) return Math.max(1, Math.round(explicit));

  const startsAt = new Date(session.startsAt || 0);
  const endsAt = new Date(session.endsAt || 0);
  if (!Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime())) {
    return Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));
  }

  return 120;
}

function resolveMoveTimes(payload = {}, session = {}) {
  const timezone = normalize(payload.timezone) || "Africa/Accra";
  const localDate = normalize(payload.localDate || payload.date);
  const localTime = normalize(payload.localTime || payload.time);
  const minutes = durationMinutes(payload, session);

  let startsAtDate = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(localDate) && /^\d{2}:\d{2}$/.test(localTime)) {
    startsAtDate = new Date(zonedLocalToUtcIso(localDate, localTime, timezone));
  } else {
    const rawStart = normalize(payload.startsAt);
    const localMatch = rawStart.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
    startsAtDate = localMatch
      ? new Date(zonedLocalToUtcIso(localMatch[1], localMatch[2], timezone))
      : new Date(rawStart);
  }

  if (Number.isNaN(startsAtDate.getTime())) throw new Error("Choose a valid new date and time.");

  return {
    startsAt: startsAtDate.toISOString(),
    endsAt: new Date(startsAtDate.getTime() + minutes * 60000).toISOString(),
    durationMinutes: minutes,
  };
}

async function queryClassSessions(field, classId) {
  const snap = await getDocs(
    query(collection(db, "classSessions"), where(field, "==", classId)),
  );
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function loadClassSessions(classId) {
  if (!classId) return [];
  const found = new Map();
  const results = await Promise.allSettled([
    queryClassSessions("classId", classId),
    queryClassSessions("classRecordId", classId),
  ]);
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((session) => found.set(normalize(session.id), session));
  });
  return [...found.values()];
}

async function loadClassRecord(classId) {
  if (!classId) throw new Error("The session is not linked to a class.");
  const snap = await getDoc(doc(db, "classes", classId));
  if (!snap.exists()) throw new Error("Class not found");
  return { id: snap.id, ...snap.data() };
}

async function assertTargetSlotAvailable({ classId, sessionId, startsAt, sessions = null }) {
  if (!classId) return;
  const targetMs = toMillis(startsAt);
  const candidates = Array.isArray(sessions) ? sessions : await loadClassSessions(classId);
  const conflict = candidates.find((candidate) => {
    if (normalize(candidate.id) === normalize(sessionId)) return false;
    const status = normalize(candidate.status || "scheduled").toLowerCase();
    if (status === "cancelled" || status === "superseded" || candidate.superseded === true) return false;
    return Number.isFinite(targetMs) && toMillis(candidate.startsAt) === targetMs;
  });
  if (!conflict) return;

  const label = normalize(conflict.topic || conflict.title) || "another lesson";
  const error = new Error(
    `This date and time is already used by ${label}. Run Official class timetable repair so the conflicting lesson is moved automatically.`,
  );
  error.code = "live-class/time-conflict";
  throw error;
}

function staleChangeError(message) {
  const error = new Error(message);
  error.code = "live-class/stale-session";
  return error;
}

async function commitSessionChangeAtomically({
  classId,
  session,
  patch,
  changeType,
  reason,
  adminId = "admin",
  classPatch = {},
  expectedClassScheduleVersion = 0,
}) {
  if (!classId) throw new Error("The session is not linked to a class.");

  const sessionRef = doc(db, "classSessions", normalize(session.id));
  const attendanceRef = doc(db, "attendance", classId, "sessions", normalize(session.id));
  const classRef = doc(db, "classes", classId);
  const calendarRef = doc(db, "calendarFeeds", classId);
  const auditRef = doc(collection(db, "auditLogs"));
  const scheduleVersion = Date.now();
  const expectedSessionSequence = Number(session.sequence || 0);
  const expectedClassVersion = Number(expectedClassScheduleVersion || 0);

  await runTransaction(db, async (transaction) => {
    const [latestSessionSnap, latestClassSnap] = await Promise.all([
      transaction.get(sessionRef),
      transaction.get(classRef),
    ]);

    if (!latestSessionSnap.exists()) throw new Error("Session not found");
    if (!latestClassSnap.exists()) throw new Error("Class not found");

    const latestSession = { id: latestSessionSnap.id, ...latestSessionSnap.data() };
    const latestClass = { id: latestClassSnap.id, ...latestClassSnap.data() };
    const latestSessionSequence = Number(latestSession.sequence || 0);
    const latestClassVersion = Number(latestClass.sessionScheduleVersion || 0);

    if (latestSessionSequence !== expectedSessionSequence) {
      throw staleChangeError("This session changed while you were editing it. Refresh Live Classes and try again.");
    }
    if (latestClassVersion !== expectedClassVersion) {
      throw staleChangeError("This class timetable changed while you were editing it. Refresh Live Classes and try again.");
    }

    const changeMetadata = {
      ...classPatch,
      lastSessionChangeType: changeType,
      lastChangedSessionId: normalize(session.id),
      lastSessionChangeReason: reason,
      lastSessionChangeBy: adminId,
      lastSessionChangeAt: serverTimestamp(),
      lastSessionChangePreviousStartsAt: session.startsAt || "",
      lastSessionChangePreviousEndsAt: session.endsAt || "",
      lastSessionChangeStartsAt: patch.startsAt || "",
      lastSessionChangeEndsAt: patch.endsAt || "",
      ...(changeType === "rescheduled" ? {
        lastRescheduledSessionId: normalize(session.id),
        lastRescheduledStartsAt: patch.startsAt || "",
      } : {}),
      ...(changeType === "cancelled" ? {
        lastCancelledSessionId: normalize(session.id),
      } : {}),
      sessionScheduleVersion: scheduleVersion,
      sessionScheduleUpdatedAt: serverTimestamp(),
      reminderScheduleVersion: scheduleVersion,
      reminderScheduleUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.update(sessionRef, patch);
    transaction.set(attendanceRef, {
      classId,
      classSessionId: normalize(session.id),
      startsAt: patch.startsAt || "",
      endsAt: patch.endsAt || "",
      sessionStatus: patch.status,
      cancellationReason: patch.cancellationReason || "",
      reminderScheduleVersion: scheduleVersion,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    transaction.set(classRef, changeMetadata, { merge: true });
    transaction.set(calendarRef, {
      classId,
      sessionScheduleVersion: scheduleVersion,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    transaction.set(auditRef, {
      type: "live-class-session-change",
      entityType: "classSession",
      classId,
      sessionId: normalize(session.id),
      changeType,
      reason,
      adminId,
      previousStartsAt: session.startsAt || "",
      previousEndsAt: session.endsAt || "",
      previousStatus: normalize(session.status || "scheduled"),
      nextStartsAt: patch.startsAt || "",
      nextEndsAt: patch.endsAt || "",
      nextStatus: normalize(patch.status || session.status || "scheduled"),
      sessionSequenceBefore: expectedSessionSequence,
      sessionSequenceAfter: Number(patch.sequence || expectedSessionSequence),
      classScheduleVersionBefore: expectedClassVersion,
      classScheduleVersionAfter: scheduleVersion,
      createdAt: serverTimestamp(),
    });
  });

  return {
    atomicWrite: true,
    auditLogId: auditRef.id,
    scheduleVersion,
  };
}

async function loadSession(sessionId) {
  const sessionRef = doc(db, "classSessions", normalize(sessionId));
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) throw new Error("Session not found");
  return { sessionRef, session: { id: sessionSnap.id, ...sessionSnap.data() } };
}

export async function cancelSession(sessionId, payload = {}) {
  const { session } = await loadSession(sessionId);
  const classId = normalize(payload.classId || session.classId || session.classRecordId);
  const reason = normalize(payload.reason);
  const klass = await loadClassRecord(classId);
  const patch = {
    startsAt: session.startsAt || "",
    endsAt: session.endsAt || "",
    status: "cancelled",
    cancellationReason: reason,
    cancelledBy: payload.adminId || "admin",
    cancelledAt: serverTimestamp(),
    remindersSuppressed: true,
    sequence: Number(session.sequence || 0) + 1,
    updatedAt: serverTimestamp(),
  };

  const atomic = await commitSessionChangeAtomically({
    classId,
    session,
    patch,
    changeType: "cancelled",
    reason,
    adminId: payload.adminId || "admin",
    expectedClassScheduleVersion: klass.sessionScheduleVersion,
  });

  return {
    classId,
    sessionId: session.id,
    status: "cancelled",
    ...atomic,
    emailSubmitted: false,
    emailMessage: "Student email is no longer part of the save action. Use the Communication tab to notify students.",
    syncWarnings: [],
  };
}

export async function rescheduleSession(sessionId, payload = {}) {
  const { session } = await loadSession(sessionId);
  const classId = normalize(payload.classId || session.classId || session.classRecordId);
  const reason = normalize(payload.reason);
  const times = resolveMoveTimes(payload, session);
  const [klass, classSessions] = await Promise.all([
    loadClassRecord(classId),
    loadClassSessions(classId),
  ]);
  await assertTargetSlotAvailable({
    classId,
    sessionId: session.id,
    startsAt: times.startsAt,
    sessions: classSessions,
  });

  const patch = {
    previousStartsAt: session.startsAt || "",
    previousEndsAt: session.endsAt || "",
    startsAt: times.startsAt,
    endsAt: times.endsAt,
    status: "scheduled",
    rescheduleReason: reason,
    rescheduledBy: payload.adminId || "admin",
    rescheduledAt: serverTimestamp(),
    remindersSuppressed: false,
    cancellationReason: "",
    sequence: Number(session.sequence || 0) + 1,
    updatedAt: serverTimestamp(),
  };

  const proposedSessions = classSessions.map((candidate) =>
    normalize(candidate.id) === normalize(session.id)
      ? { ...candidate, ...patch }
      : candidate,
  );
  if (!proposedSessions.some((candidate) => normalize(candidate.id) === normalize(session.id))) {
    proposedSessions.push({ ...session, ...patch });
  }

  const preliminary = inspectTimetableIntegrity({
    klass,
    sessions: proposedSessions,
    requireCurriculum: true,
    enforceEndDate: false,
  });
  const proposedEndDate = preliminary.derivedEndDate || normalize(klass.endDate);
  const integrity = assertTimetableIntegrity({
    klass: { ...klass, endDate: proposedEndDate },
    sessions: proposedSessions,
    requireCurriculum: true,
    enforceEndDate: true,
  });

  const classPatch = {
    endDate: proposedEndDate,
    configuredEndDate: proposedEndDate,
    holidayAdjustedEndDate: proposedEndDate,
    sessionDerivedEndDate: proposedEndDate,
    timetableIntegrityStatus: "healthy",
    timetableIntegrityExpectedCount: integrity.expectedCount,
    timetableIntegrityActualCount: integrity.actualCount,
    timetableIntegrityIssueCount: 0,
    timetableIntegrityValidatedAt: serverTimestamp(),
  };
  const atomic = await commitSessionChangeAtomically({
    classId,
    session,
    patch,
    changeType: "rescheduled",
    reason,
    adminId: payload.adminId || "admin",
    classPatch,
    expectedClassScheduleVersion: klass.sessionScheduleVersion,
  });

  return {
    classId,
    sessionId: session.id,
    status: "scheduled",
    startsAt: times.startsAt,
    endsAt: times.endsAt,
    endDate: proposedEndDate,
    integrity,
    ...atomic,
    emailSubmitted: false,
    emailMessage: "Student email is no longer part of the save action. Use the Communication tab to notify students.",
    syncWarnings: [],
  };
}
