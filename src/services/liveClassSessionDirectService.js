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
import { assertTimetableIntegrity } from "../utils/liveClassTimetableIntegrity.js";
import {
  buildClassScheduleHealth,
  timetableHealthClassFields,
} from "../utils/liveClassScheduleHealth.js";
import { buildSessionReschedulePlan } from "../utils/liveClassReschedulePlan.js";

function normalize(value) {
  return String(value || "").trim();
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

function staleChangeError(message) {
  const error = new Error(message);
  error.code = "live-class/stale-session";
  return error;
}

function scheduleStateClassPatch({ health, endDate, adminId }) {
  const validatedAt = serverTimestamp();
  return {
    endDate,
    configuredEndDate: endDate,
    holidayAdjustedEndDate: endDate,
    sessionDerivedEndDate: endDate,
    ...timetableHealthClassFields(health, {
      validatedAt,
      validatedBy: adminId,
    }),
  };
}

async function commitSessionChangesAtomically({
  classId,
  sessionChanges = [],
  primarySessionId = "",
  changeType,
  changeMode = "single",
  reason,
  adminId = "admin",
  classPatch = {},
  expectedClassScheduleVersion = 0,
}) {
  if (!classId) throw new Error("The session is not linked to a class.");
  if (!sessionChanges.length) throw new Error("No session changes were prepared.");

  const normalizedPrimaryId = normalize(primarySessionId || sessionChanges[0]?.session?.id);
  const preparedChanges = sessionChanges.map(({ session, patch }) => ({
    session,
    patch,
    sessionId: normalize(session?.id),
    sessionRef: doc(db, "classSessions", normalize(session?.id)),
    attendanceRef: doc(db, "attendance", classId, "sessions", normalize(session?.id)),
    expectedSequence: Number(session?.sequence || 0),
  }));
  const primary = preparedChanges.find((change) => change.sessionId === normalizedPrimaryId) || preparedChanges[0];
  const classRef = doc(db, "classes", classId);
  const calendarRef = doc(db, "calendarFeeds", classId);
  const auditRef = doc(collection(db, "auditLogs"));
  const scheduleVersion = Date.now();
  const expectedClassVersion = Number(expectedClassScheduleVersion || 0);

  await runTransaction(db, async (transaction) => {
    const snapshots = await Promise.all([
      transaction.get(classRef),
      ...preparedChanges.map((change) => transaction.get(change.sessionRef)),
    ]);
    const latestClassSnap = snapshots[0];
    const latestSessionSnaps = snapshots.slice(1);

    if (!latestClassSnap.exists()) throw new Error("Class not found");
    const latestClass = { id: latestClassSnap.id, ...latestClassSnap.data() };
    const latestClassVersion = Number(latestClass.sessionScheduleVersion || 0);
    if (latestClassVersion !== expectedClassVersion) {
      throw staleChangeError("This class timetable changed while you were editing it. Refresh Live Classes and try again.");
    }

    latestSessionSnaps.forEach((snapshot, index) => {
      const change = preparedChanges[index];
      if (!snapshot.exists()) throw new Error("Session not found");
      const latestSession = { id: snapshot.id, ...snapshot.data() };
      const latestSequence = Number(latestSession.sequence || 0);
      if (latestSequence !== change.expectedSequence) {
        throw staleChangeError(`${normalize(change.session.topic || change.session.title) || "A session"} changed while you were editing it. Refresh Live Classes and try again.`);
      }
    });

    const changeMetadata = {
      ...classPatch,
      lastSessionChangeType: changeType,
      lastSessionChangeMode: changeMode,
      lastSessionChangeAffectedCount: preparedChanges.length,
      lastChangedSessionId: primary.sessionId,
      lastSessionChangeReason: reason,
      lastSessionChangeBy: adminId,
      lastSessionChangeAt: serverTimestamp(),
      lastSessionChangePreviousStartsAt: primary.session.startsAt || "",
      lastSessionChangePreviousEndsAt: primary.session.endsAt || "",
      lastSessionChangeStartsAt: primary.patch.startsAt || "",
      lastSessionChangeEndsAt: primary.patch.endsAt || "",
      ...(changeType === "rescheduled" ? {
        lastRescheduledSessionId: primary.sessionId,
        lastRescheduledStartsAt: primary.patch.startsAt || "",
      } : {}),
      ...(changeType === "cancelled" ? {
        lastCancelledSessionId: primary.sessionId,
      } : {}),
      sessionScheduleVersion: scheduleVersion,
      sessionScheduleUpdatedAt: serverTimestamp(),
      reminderScheduleVersion: scheduleVersion,
      reminderScheduleUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    preparedChanges.forEach((change) => {
      transaction.update(change.sessionRef, change.patch);
      transaction.set(change.attendanceRef, {
        classId,
        classSessionId: change.sessionId,
        startsAt: change.patch.startsAt || "",
        endsAt: change.patch.endsAt || "",
        sessionStatus: change.patch.status,
        cancellationReason: change.patch.cancellationReason || "",
        remindersSuppressed: change.patch.remindersSuppressed === true,
        reminderScheduleVersion: scheduleVersion,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });

    transaction.set(classRef, changeMetadata, { merge: true });
    transaction.set(calendarRef, {
      classId,
      sessionScheduleVersion: scheduleVersion,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    transaction.set(auditRef, {
      type: "live-class-session-change",
      entityType: preparedChanges.length > 1 ? "classTimetable" : "classSession",
      classId,
      sessionId: primary.sessionId,
      affectedSessionIds: preparedChanges.map((change) => change.sessionId),
      affectedSessionCount: preparedChanges.length,
      changeType,
      changeMode,
      reason,
      adminId,
      previousStartsAt: primary.session.startsAt || "",
      previousEndsAt: primary.session.endsAt || "",
      previousStatus: normalize(primary.session.status || "scheduled"),
      nextStartsAt: primary.patch.startsAt || "",
      nextEndsAt: primary.patch.endsAt || "",
      nextStatus: normalize(primary.patch.status || primary.session.status || "scheduled"),
      changes: preparedChanges.map((change) => ({
        sessionId: change.sessionId,
        previousStartsAt: change.session.startsAt || "",
        previousEndsAt: change.session.endsAt || "",
        previousStatus: normalize(change.session.status || "scheduled"),
        nextStartsAt: change.patch.startsAt || "",
        nextEndsAt: change.patch.endsAt || "",
        nextStatus: normalize(change.patch.status || change.session.status || "scheduled"),
        sessionSequenceBefore: change.expectedSequence,
        sessionSequenceAfter: Number(change.patch.sequence || change.expectedSequence),
      })),
      classScheduleVersionBefore: expectedClassVersion,
      classScheduleVersionAfter: scheduleVersion,
      createdAt: serverTimestamp(),
    });
  });

  return {
    atomicWrite: true,
    auditLogId: auditRef.id,
    scheduleVersion,
    affectedSessionCount: preparedChanges.length,
  };
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
  return commitSessionChangesAtomically({
    classId,
    sessionChanges: [{ session, patch }],
    primarySessionId: session.id,
    changeType,
    changeMode: "single",
    reason,
    adminId,
    classPatch,
    expectedClassScheduleVersion,
  });
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
  const [klass, classSessions] = await Promise.all([
    loadClassRecord(classId),
    loadClassSessions(classId),
  ]);
  const adminId = payload.adminId || "admin";
  const patch = {
    startsAt: session.startsAt || "",
    endsAt: session.endsAt || "",
    status: "cancelled",
    cancellationReason: reason,
    cancelledBy: adminId,
    cancelledAt: serverTimestamp(),
    remindersSuppressed: true,
    sequence: Number(session.sequence || 0) + 1,
    updatedAt: serverTimestamp(),
  };
  const proposedSessions = classSessions.map((candidate) => (
    normalize(candidate.id) === normalize(session.id) ? { ...candidate, ...patch } : candidate
  ));
  if (!proposedSessions.some((candidate) => normalize(candidate.id) === normalize(session.id))) {
    proposedSessions.push({ ...session, ...patch });
  }

  const preliminaryHealth = buildClassScheduleHealth({
    klass,
    sessions: proposedSessions,
    requireCurriculum: true,
    enforceEndDate: false,
  });
  const proposedEndDate = preliminaryHealth.derivedEndDate || normalize(klass.endDate);
  const health = buildClassScheduleHealth({
    klass: { ...klass, endDate: proposedEndDate },
    sessions: proposedSessions,
    requireCurriculum: true,
    enforceEndDate: true,
  });
  const classPatch = scheduleStateClassPatch({
    health,
    endDate: proposedEndDate,
    adminId,
  });

  const atomic = await commitSessionChangeAtomically({
    classId,
    session,
    patch,
    changeType: "cancelled",
    reason,
    adminId,
    classPatch,
    expectedClassScheduleVersion: klass.sessionScheduleVersion,
  });

  return {
    classId,
    sessionId: session.id,
    status: "cancelled",
    endDate: proposedEndDate,
    health,
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
  const reschedulePlan = buildSessionReschedulePlan({
    klass,
    sessions: classSessions,
    sessionId: session.id,
    targetStartsAt: times.startsAt,
    targetEndsAt: times.endsAt,
    mode: payload.moveMode,
  });

  const adminId = payload.adminId || "admin";
  const sessionChanges = reschedulePlan.changes.map((change) => {
    const existingStatus = normalize(change.session.status || "scheduled").toLowerCase();
    const primary = normalize(change.session.id) === normalize(session.id);
    const nextStatus = primary ? "scheduled" : existingStatus;
    const cancellationReason = primary ? "" : normalize(change.session.cancellationReason);
    return {
      session: change.session,
      patch: {
        previousStartsAt: change.session.startsAt || "",
        previousEndsAt: change.session.endsAt || "",
        startsAt: change.startsAt,
        endsAt: change.endsAt,
        status: nextStatus,
        rescheduleReason: reason,
        rescheduleMode: reschedulePlan.mode,
        rescheduledBy: adminId,
        rescheduledAt: serverTimestamp(),
        remindersSuppressed: ["cancelled", "completed"].includes(nextStatus),
        cancellationReason,
        sequence: Number(change.session.sequence || 0) + 1,
        updatedAt: serverTimestamp(),
      },
    };
  });

  const patchesById = new Map(sessionChanges.map((change) => [normalize(change.session.id), change.patch]));
  const proposedSessions = classSessions.map((candidate) => {
    const patch = patchesById.get(normalize(candidate.id));
    return patch ? { ...candidate, ...patch } : candidate;
  });
  if (!proposedSessions.some((candidate) => normalize(candidate.id) === normalize(session.id))) {
    const primaryPatch = patchesById.get(normalize(session.id));
    proposedSessions.push({ ...session, ...primaryPatch });
  }

  assertTimetableIntegrity({
    klass,
    sessions: proposedSessions,
    requireCurriculum: true,
    enforceEndDate: false,
  });
  const preliminaryHealth = buildClassScheduleHealth({
    klass,
    sessions: proposedSessions,
    requireCurriculum: true,
    enforceEndDate: false,
  });
  const proposedEndDate = preliminaryHealth.derivedEndDate || normalize(klass.endDate);
  const health = buildClassScheduleHealth({
    klass: { ...klass, endDate: proposedEndDate },
    sessions: proposedSessions,
    requireCurriculum: true,
    enforceEndDate: true,
  });
  const classPatch = scheduleStateClassPatch({
    health,
    endDate: proposedEndDate,
    adminId,
  });
  const atomic = await commitSessionChangesAtomically({
    classId,
    sessionChanges,
    primarySessionId: session.id,
    changeType: "rescheduled",
    changeMode: reschedulePlan.mode,
    reason,
    adminId,
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
    moveMode: reschedulePlan.mode,
    movedSessions: reschedulePlan.affectedCount,
    integrity: health,
    ...atomic,
    emailSubmitted: false,
    emailMessage: "Student email is no longer part of the save action. Use the Communication tab to notify students.",
    syncWarnings: [],
  };
}
