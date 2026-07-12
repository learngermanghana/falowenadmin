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
import {
  isProtectedRebuildSession,
  sessionHasAttendanceData,
} from "../utils/liveClassSessionRebuildPlan.js";

function normalize(value) {
  return String(value || "").trim();
}

function identifiersFor(classId, klass = {}) {
  return [...new Set([
    classId,
    klass.id,
    klass.name,
    klass.classId,
    klass.className,
    klass.slug,
  ].map(normalize).filter(Boolean))];
}

async function querySessions(field, identifier) {
  const snap = await getDocs(query(collection(db, "classSessions"), where(field, "==", identifier)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function loadCompatibleSessions(classId, klass = {}) {
  const identifiers = identifiersFor(classId, klass);
  const results = await Promise.allSettled(
    identifiers.flatMap((identifier) => ["classId", "classRecordId", "className"]
      .map((field) => querySessions(field, identifier))),
  );
  const sessions = new Map();
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((session) => sessions.set(session.id, session));
  });
  return { identifiers, sessions: [...sessions.values()] };
}

async function loadAttendance(identifiers = []) {
  const results = await Promise.allSettled(identifiers.map(async (identifier) => ({
    identifier,
    snap: await getDocs(collection(db, "attendance", identifier, "sessions")),
  })));
  const records = new Map();
  const locations = new Map();

  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    const { identifier, snap } = result.value;
    snap.docs.forEach((item) => {
      const record = { id: item.id, ...item.data() };
      const existing = records.get(item.id);
      if (!existing || sessionHasAttendanceData(record)) records.set(item.id, record);
      if (!locations.has(item.id)) locations.set(item.id, new Set());
      locations.get(item.id).add(identifier);
    });
  });

  return { records, locations };
}

export async function cleanupLegacyClassSessions({ classId, klass = {}, desiredSessionIds = [] } = {}) {
  const canonicalClassId = normalize(classId || klass.id);
  if (!canonicalClassId) return { removed: 0, canonicalized: 0 };

  const desiredIds = desiredSessionIds instanceof Set ? desiredSessionIds : new Set(desiredSessionIds);
  const { identifiers, sessions } = await loadCompatibleSessions(canonicalClassId, klass);
  const { records: attendance, locations } = await loadAttendance(identifiers);
  const batch = writeBatch(db);
  let removed = 0;
  let canonicalized = 0;

  sessions.forEach((session) => {
    const attendanceRecord = attendance.get(session.id);
    const desired = desiredIds.has(session.id);
    const protectedSession = isProtectedRebuildSession(session)
      || sessionHasAttendanceData(session)
      || sessionHasAttendanceData(attendanceRecord);

    if (!desired && !protectedSession) {
      batch.delete(doc(db, "classSessions", session.id));
      const attendanceOwners = new Set([canonicalClassId, ...(locations.get(session.id) || [])]);
      attendanceOwners.forEach((owner) => batch.delete(doc(db, "attendance", owner, "sessions", session.id)));
      removed += 1;
      return;
    }

    if (desired && (
      normalize(session.classId) !== canonicalClassId
      || normalize(session.classRecordId) !== canonicalClassId
      || normalize(session.className) !== normalize(klass.name)
    )) {
      batch.set(doc(db, "classSessions", session.id), {
        classId: canonicalClassId,
        classRecordId: canonicalClassId,
        className: normalize(klass.name),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      canonicalized += 1;
    }
  });

  if (removed || canonicalized) await batch.commit();
  return { removed, canonicalized };
}
