import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase.js";
import { buildClassUrl, generateSessionOccurrences, selectLatestCompletedSession, selectNextSession, slugifyClassName } from "../utils/liveClassScheduling.js";
import { getCourseDictionaryEntry } from "../data/courseDictionary.js";

export async function createClassCohort(payload) {
  const name = String(payload.name || "").trim();
  if (!name) throw new Error("Class name is required");
  const classRef = doc(collection(db, "classes"));
  const slug = payload.slug || slugifyClassName(name);
  const record = {
    id: classRef.id,
    slug,
    name,
    levelId: payload.levelId || "",
    tutorId: payload.tutorId || "",
    startDate: payload.startDate || "",
    endDate: payload.endDate || "",
    timezone: payload.timezone || "Africa/Accra",
    status: payload.status || "draft",
    zoomProfileId: payload.zoomProfileId || "",
    scheduleRules: payload.scheduleRules || [],
    classUrl: buildClassUrl({ slug }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(classRef, record);
  await generateClassSessions(classRef.id, record);
  return record;
}

export async function generateClassSessions(classId, classRecord = null) {
  const classSnap = classRecord ? null : await getDoc(doc(db, "classes", classId));
  const klass = classRecord || classSnap.data();
  const occurrences = generateSessionOccurrences({ classId, ...klass });
  const existingSnap = await getDocs(query(collection(db, "classSessions"), where("classId", "==", classId)));
  const existingIds = new Set(existingSnap.docs.map((d) => d.id));
  const batch = writeBatch(db);
  let created = 0;
  occurrences.forEach((session) => {
    if (existingIds.has(session.id)) return;
    batch.set(doc(db, "classSessions", session.id), { ...session, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), sequence: 0 });
    created += 1;
  });
  if (created > 0) await batch.commit();
  return { created, total: occurrences.length };
}

export async function listClassSessions(classId) {
  const snap = await getDocs(query(collection(db, "classSessions"), where("classId", "==", classId), orderBy("startsAt", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listClassCohorts() {
  const snap = await getDocs(query(collection(db, "classes"), orderBy("name", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), classUrl: buildClassUrl({ id: d.id, ...d.data() }) }));
}

export async function getClassDashboard(classId) {
  const [classSnap, sessions] = await Promise.all([getDoc(doc(db, "classes", classId)), listClassSessions(classId)]);
  const klass = { id: classSnap.id, ...classSnap.data() };
  const nextSession = selectNextSession(sessions);
  const latestCompletedSession = selectLatestCompletedSession(sessions);
  return { klass, sessions, nextSession, latestCompletedSession };
}

export async function updateSession(sessionId, patch) {
  await updateDoc(doc(db, "classSessions", sessionId), { ...patch, updatedAt: serverTimestamp() });
}

export async function cancelSession(sessionId, { reason, adminId }) {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(sessionRef);
    if (!snap.exists()) throw new Error("Session not found");
    const session = snap.data();
    transaction.update(sessionRef, { status: "cancelled", cancellationReason: reason || "", cancelledBy: adminId || "admin", cancelledAt: serverTimestamp(), remindersSuppressed: true, sequence: (session.sequence || 0) + 1, updatedAt: serverTimestamp() });
    transaction.set(doc(collection(db, "auditLogs")), { type: "classSession.cancelled", classId: session.classId, sessionId, reason: reason || "", actorId: adminId || "admin", createdAt: serverTimestamp() });
    transaction.set(doc(collection(db, "studentNotifications")), { type: "classSession.cancelled", classId: session.classId, sessionId, title: "Live class cancelled", body: reason || "A live class session was cancelled.", createdAt: serverTimestamp() });
    transaction.set(doc(collection(db, "emailQueue")), { type: "classSession.cancelled", classId: session.classId, sessionId, status: "queued", createdAt: serverTimestamp() });
    transaction.set(doc(db, "calendarFeeds", session.classId), { classId: session.classId, updatedAt: serverTimestamp() }, { merge: true });
  });
}

export async function rescheduleSession(sessionId, { startsAt, endsAt, adminId }) {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(sessionRef);
    if (!snap.exists()) throw new Error("Session not found");
    const session = snap.data();
    transaction.update(sessionRef, { startsAt, endsAt, status: "rescheduled", sequence: (session.sequence || 0) + 1, remindersSuppressed: false, updatedAt: serverTimestamp() });
    transaction.set(doc(collection(db, "auditLogs")), { type: "classSession.rescheduled", classId: session.classId, sessionId, actorId: adminId || "admin", createdAt: serverTimestamp() });
    transaction.set(doc(collection(db, "studentNotifications")), { type: "classSession.rescheduled", classId: session.classId, sessionId, title: "Live class rescheduled", body: "A live class session was rescheduled.", createdAt: serverTimestamp() });
    transaction.set(doc(db, "calendarFeeds", session.classId), { classId: session.classId, updatedAt: serverTimestamp() }, { merge: true });
  });
}

export function resolveSessionChapters(levelId, session) {
  return (session?.chapterIds || []).map((chapterId) => getCourseDictionaryEntry(`${levelId}-${chapterId}`) || getCourseDictionaryEntry(chapterId)).filter(Boolean);
}
