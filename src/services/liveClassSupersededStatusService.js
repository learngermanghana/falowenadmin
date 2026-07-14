import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { buildSupersededStatusRepairs } from "../utils/liveClassSupersededRecords.js";

function normalize(value) {
  return String(value || "").trim();
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
    result.value.forEach((session) => {
      const sessionId = normalize(session.id);
      if (sessionId) found.set(sessionId, session);
    });
  });

  return [...found.values()];
}

export async function normalizeSupersededSessionStatuses(classId, {
  adminId = "schedule-cleanup",
} = {}) {
  const normalizedClassId = normalize(classId);
  if (!normalizedClassId) {
    return { repaired: 0, classId: "", sessionIds: [] };
  }

  const sessions = await loadClassSessions(normalizedClassId);
  const repairs = buildSupersededStatusRepairs(sessions);
  if (!repairs.length) {
    return { repaired: 0, classId: normalizedClassId, sessionIds: [] };
  }

  const batch = writeBatch(db);
  repairs.forEach(({ session, sessionId, patch }) => {
    batch.set(doc(db, "classSessions", sessionId), {
      ...patch,
      supersededStatusNormalizedAt: serverTimestamp(),
      supersededStatusNormalizedBy: adminId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    batch.set(doc(db, "attendance", normalizedClassId, "sessions", sessionId), {
      classId: normalizedClassId,
      classSessionId: sessionId,
      startsAt: patch.startsAt,
      endsAt: patch.endsAt,
      sessionStatus: "superseded",
      superseded: true,
      supersededBySessionId: normalize(session.supersededBySessionId),
      remindersSuppressed: true,
      cancellationReason: "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  batch.set(doc(db, "classes", normalizedClassId), {
    supersededStatusNormalizedCount: repairs.length,
    supersededStatusNormalizedAt: serverTimestamp(),
    supersededStatusNormalizedBy: adminId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(collection(db, "auditLogs")), {
    type: "live-class-superseded-status-normalized",
    entityType: "classTimetable",
    classId: normalizedClassId,
    affectedSessionIds: repairs.map((repair) => repair.sessionId),
    affectedSessionCount: repairs.length,
    adminId,
    createdAt: serverTimestamp(),
  });

  await batch.commit();

  return {
    repaired: repairs.length,
    classId: normalizedClassId,
    sessionIds: repairs.map((repair) => repair.sessionId),
  };
}
