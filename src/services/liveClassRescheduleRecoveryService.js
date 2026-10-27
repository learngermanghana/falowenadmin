import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { buildSessionReschedulePlan } from "../utils/liveClassReschedulePlan.js";
import { rescheduleSession } from "./liveClassSessionDirectService.js";
import { normalizeSupersededSessionStatuses } from "./liveClassSupersededStatusService.js";

function normalize(value) {
  return String(value || "").trim();
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toMillis(value) {
  return toDate(value)?.getTime() || 0;
}

async function queryClassSessions(field, classId) {
  const snap = await getDocs(
    query(collection(db, "classSessions"), where(field, "==", classId)),
  );
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function loadClassSessions(classId) {
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
  const snap = await getDoc(doc(db, "classes", classId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

function latestRescheduledSession(klass = {}, sessions = []) {
  const preferredIds = [
    klass.lastRescheduledSessionId,
    normalize(klass.lastSessionChangeType).toLowerCase() === "rescheduled" ? klass.lastChangedSessionId : "",
  ].map(normalize).filter(Boolean);

  for (const sessionId of preferredIds) {
    const match = sessions.find((session) => normalize(session.id) === sessionId);
    if (match) return match;
  }

  return [...sessions]
    .filter((session) => normalize(session.previousStartsAt || session.rescheduleReason))
    .sort((left, right) => Math.max(toMillis(right.rescheduledAt), toMillis(right.updatedAt))
      - Math.max(toMillis(left.rescheduledAt), toMillis(left.updatedAt)))[0] || null;
}

function previousStartFor(klass = {}, session = {}) {
  const latestSessionId = normalize(klass.lastRescheduledSessionId || klass.lastChangedSessionId);
  if (normalize(session.previousStartsAt)) return session.previousStartsAt;
  if (latestSessionId === normalize(session.id)) return klass.lastSessionChangePreviousStartsAt || "";
  return "";
}

function needsCascadeRecovery({ klass, sessions, session }) {
  const currentStart = toDate(session.startsAt);
  const currentEnd = toDate(session.endsAt);
  const previousStart = toDate(previousStartFor(klass, session));
  if (!currentStart || !currentEnd || !previousStart) return false;
  if (previousStart.getTime() >= currentStart.getTime()) return false;
  if (["completed", "live", "superseded"].includes(normalize(session.status).toLowerCase())) return false;
  if (normalize(klass.lastSessionChangeMode).toLowerCase() === "following") return false;

  try {
    buildSessionReschedulePlan({
      klass,
      sessions,
      sessionId: session.id,
      targetStartsAt: currentStart.toISOString(),
      targetEndsAt: currentEnd.toISOString(),
      mode: "single",
    });
    return false;
  } catch (error) {
    return ["live-class/curriculum-order", "live-class/time-overlap"].includes(error?.code);
  }
}

export async function inspectLegacyRescheduleCollision(classId, payload = {}) {
  const normalizedClassId = normalize(classId);
  if (!normalizedClassId) return { needsRepair: false, reason: "missing-class-id" };

  const supersededCleanup = await normalizeSupersededSessionStatuses(normalizedClassId, {
    adminId: payload.adminId || "schedule-cleanup",
  }).catch((error) => ({
    repaired: 0,
    classId: normalizedClassId,
    sessionIds: [],
    error: error?.message || "Could not normalize superseded session aliases.",
  }));

  const [klass, sessions] = await Promise.all([
    loadClassRecord(normalizedClassId),
    loadClassSessions(normalizedClassId),
  ]);
  if (!klass) return { needsRepair: false, reason: "class-not-found", supersededCleanup };

  const session = latestRescheduledSession(klass, sessions);
  if (!session) {
    return {
      needsRepair: false,
      reason: "no-rescheduled-session",
      klass,
      sessions,
      supersededCleanup,
    };
  }

  return {
    needsRepair: needsCascadeRecovery({ klass, sessions, session }),
    klass,
    sessions,
    session,
    previousStartsAt: previousStartFor(klass, session),
    supersededCleanup,
  };
}

export async function recoverLegacyRescheduleCollision(classId, payload = {}) {
  const inspection = await inspectLegacyRescheduleCollision(classId, payload);
  if (!inspection.needsRepair) {
    return {
      repaired: false,
      classId: normalize(classId),
      reason: inspection.reason || "timetable-does-not-need-cascade-recovery",
      supersededRecordsNormalized: Number(inspection.supersededCleanup?.repaired || 0),
    };
  }

  const { klass, session } = inspection;
  const currentStart = toDate(session.startsAt);
  const currentEnd = toDate(session.endsAt);
  const durationMinutes = Math.max(1, Math.round((currentEnd.getTime() - currentStart.getTime()) / 60000));
  const originalReason = normalize(session.rescheduleReason || klass.lastSessionChangeReason);
  const recoveryReason = originalReason
    ? `${originalReason} Following lessons were shifted automatically to preserve curriculum order.`
    : "Following lessons were shifted automatically after a reschedule to preserve curriculum order.";

  const result = await rescheduleSession(session.id, {
    classId: klass.id,
    className: klass.name || klass.className || "",
    startsAt: currentStart.toISOString(),
    moveMode: "following",
    durationMinutes,
    timezone: klass.timezone || "Africa/Accra",
    reason: recoveryReason,
    adminId: payload.adminId || "schedule-recovery",
  });

  return {
    repaired: true,
    recoveredSessionId: session.id,
    previousStartsAt: inspection.previousStartsAt,
    supersededRecordsNormalized: Number(inspection.supersededCleanup?.repaired || 0),
    ...result,
  };
}
