import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import {
  buildClassUrl,
  generateSessionOccurrences,
  selectLatestCompletedSession,
  selectNextSession,
  slugifyClassName,
} from "../utils/liveClassScheduling.js";
import { getCourseDictionaryEntry } from "../data/courseDictionary.js";
import { saveAnnouncementRow } from "./communicationService.js";
import { listStudentsByClass } from "./studentsService.js";
import {
  buildCancellationAnnouncement,
  findNextScheduledSession,
  getCancellationRecipients,
} from "../utils/liveClassCancellationEmail.js";

function attendanceSessionRef(classId, sessionId) {
  return doc(db, "attendance", String(classId), "sessions", String(sessionId));
}

function normalizeAssignmentIds(session = {}) {
  const source = session.assignmentIds || session.chapterIds || [];
  return [...new Set(source.map((value) => String(value || "").trim()).filter(Boolean))];
}

function sessionDate(startsAt) {
  const value = String(startsAt || "");
  return value.includes("T") ? value.slice(0, 10) : value;
}

function attendanceMetadata(klass = {}, session = {}, patch = {}) {
  const merged = { ...session, ...patch };
  const assignmentIds = normalizeAssignmentIds(merged);
  return {
    classId: klass.id || merged.classId || "",
    className: klass.name || "",
    classSessionId: merged.id || "",
    title: String(merged.topic || klass.name || "Live class").trim(),
    date: sessionDate(merged.startsAt),
    startsAt: merged.startsAt || "",
    endsAt: merged.endsAt || "",
    sessionStatus: merged.status || "scheduled",
    cancellationReason: String(merged.cancellationReason || "").trim(),
    assignmentIds,
    assignment_id: assignmentIds[0] || "",
    updatedAt: serverTimestamp(),
  };
}

async function loadClassRecord(classId, transaction = null) {
  const ref = doc(db, "classes", String(classId));
  const snap = transaction ? await transaction.get(ref) : await getDoc(ref);
  if (!snap.exists()) throw new Error("Class not found");
  return { id: snap.id, ...snap.data() };
}

export async function createClassCohort(payload) {
  const name = String(payload.name || "").trim();
  if (!name) throw new Error("Class name is required");
  if (!payload.startDate || !payload.endDate) throw new Error("Start and end dates are required");

  const slug = String(payload.slug || slugifyClassName(name)).trim();
  const duplicate = await getDocs(query(collection(db, "classes"), where("slug", "==", slug)));
  if (!duplicate.empty) throw new Error("A class with this name or URL already exists");

  const classRef = doc(collection(db, "classes"));
  const record = {
    id: classRef.id,
    slug,
    name,
    levelId: String(payload.levelId || "").toUpperCase(),
    tutorId: String(payload.tutorId || "").trim(),
    startDate: payload.startDate,
    endDate: payload.endDate,
    timezone: payload.timezone || "Africa/Accra",
    status: payload.status || "upcoming",
    zoomProfileId: String(payload.zoomProfileId || "").trim(),
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
  const klass = classRecord || (await loadClassRecord(classId));
  const occurrences = generateSessionOccurrences({ classId, ...klass });
  const existingSnap = await getDocs(query(collection(db, "classSessions"), where("classId", "==", classId)));
  const existingIds = new Set(existingSnap.docs.map((item) => item.id));
  const batch = writeBatch(db);
  let created = 0;

  occurrences.forEach((occurrence) => {
    if (existingIds.has(occurrence.id)) return;
    const session = {
      ...occurrence,
      assignmentIds: [],
      chapterIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      sequence: 0,
    };
    batch.set(doc(db, "classSessions", occurrence.id), session);
    batch.set(
      attendanceSessionRef(classId, occurrence.id),
      {
        ...attendanceMetadata(klass, session),
        createdAt: serverTimestamp(),
        students: {},
      },
      { merge: true },
    );
    created += 1;
  });

  if (created > 0) await batch.commit();
  return { created, total: occurrences.length };
}

export async function listClassSessions(classId) {
  const snap = await getDocs(
    query(collection(db, "classSessions"), where("classId", "==", classId), orderBy("startsAt", "asc")),
  );
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function listClassCohorts() {
  const snap = await getDocs(query(collection(db, "classes"), orderBy("name", "asc")));
  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
    classUrl: buildClassUrl({ id: item.id, ...item.data() }),
  }));
}

export async function resolveClassCohort(value) {
  const token = String(value || "").trim().toLowerCase();
  if (!token) return null;
  const rows = await listClassCohorts();
  return rows.find((klass) =>
    [klass.id, klass.name, klass.slug]
      .map((item) => String(item || "").trim().toLowerCase())
      .includes(token),
  ) || null;
}

export async function getClassDashboard(classId) {
  const [klass, sessions] = await Promise.all([loadClassRecord(classId), listClassSessions(classId)]);
  return {
    klass,
    sessions,
    nextSession: selectNextSession(sessions),
    latestCompletedSession: selectLatestCompletedSession(sessions),
  };
}

export async function updateSession(sessionId, patch) {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) throw new Error("Session not found");
    const session = { id: sessionSnap.id, ...sessionSnap.data() };
    const klass = await loadClassRecord(session.classId, transaction);
    const nextPatch = {
      ...patch,
      assignmentIds: patch.assignmentIds ? normalizeAssignmentIds(patch) : normalizeAssignmentIds(session),
      updatedAt: serverTimestamp(),
    };
    transaction.update(sessionRef, nextPatch);
    transaction.set(attendanceSessionRef(session.classId, sessionId), attendanceMetadata(klass, session, nextPatch), { merge: true });
  });
}

export async function cancelSession(sessionId, { reason, adminId }) {
  const sessionRef = doc(db, "classSessions", sessionId);
  const emailQueueRef = doc(collection(db, "emailQueue"));
  let cancellationContext = null;

  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) throw new Error("Session not found");
    const session = { id: sessionSnap.id, ...sessionSnap.data() };
    const klass = await loadClassRecord(session.classId, transaction);
    const patch = {
      status: "cancelled",
      cancellationReason: String(reason || "").trim(),
      cancelledBy: adminId || "admin",
      cancelledAt: serverTimestamp(),
      remindersSuppressed: true,
      sequence: Number(session.sequence || 0) + 1,
      updatedAt: serverTimestamp(),
    };

    cancellationContext = { klass, session, patch };
    transaction.update(sessionRef, patch);
    transaction.set(attendanceSessionRef(session.classId, sessionId), attendanceMetadata(klass, session, patch), { merge: true });
    transaction.set(doc(collection(db, "auditLogs")), {
      type: "classSession.cancelled",
      classId: session.classId,
      sessionId,
      reason: patch.cancellationReason,
      actorId: adminId || "admin",
      createdAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db, "studentNotifications")), {
      type: "classSession.cancelled",
      classId: session.classId,
      sessionId,
      title: "Live class cancelled",
      body: patch.cancellationReason || "A live class session was cancelled.",
      createdAt: serverTimestamp(),
    });
    transaction.set(emailQueueRef, {
      type: "classSession.cancelled",
      classId: session.classId,
      className: klass.name || "",
      sessionId,
      sessionStartsAt: session.startsAt || "",
      sessionEndsAt: session.endsAt || "",
      reason: patch.cancellationReason,
      dedupeKey: `cancel_${session.classId}_${sessionId}_${patch.sequence}`,
      recipientMode: "class",
      deliveryChannel: "announcement_webhook",
      status: "preparing",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(doc(db, "calendarFeeds", session.classId), {
      classId: session.classId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  const { klass, session, patch } = cancellationContext;
  let recipients = [];
  let recipientLookupError = "";
  try {
    recipients = getCancellationRecipients(await listStudentsByClass(klass.name || session.classId));
  } catch (error) {
    recipientLookupError = error?.message || "Student recipient lookup failed";
  }

  const sessions = await listClassSessions(session.classId).catch(() => []);
  const nextSession = findNextScheduledSession(sessions, session);
  const emailPayload = buildCancellationAnnouncement({
    klass,
    session,
    reason: patch.cancellationReason,
    nextSession,
  });

  try {
    const receipt = await saveAnnouncementRow(emailPayload);
    const emailSubmitted = Boolean(receipt?.sheet?.attempted && receipt?.sheet?.success);
    const deliveryStatus = emailSubmitted
      ? (receipt.sheet.unverified ? "submitted_unverified" : "submitted")
      : "failed";
    const deliveryError = emailSubmitted
      ? recipientLookupError
      : (receipt?.sheet?.message || "Announcement email webhook is not configured");

    await setDoc(emailQueueRef, {
      subject: emailPayload.subject,
      body: emailPayload.announcement,
      classUrl: emailPayload.link,
      recipientCount: recipients.length,
      recipientLookupError,
      status: deliveryStatus,
      deliveryError,
      deliveryReceipt: receipt?.sheet || null,
      submittedAt: emailSubmitted ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return {
      classId: session.classId,
      sessionId,
      emailQueueId: emailQueueRef.id,
      emailSubmitted,
      emailStatus: deliveryStatus,
      emailMessage: deliveryError,
      recipientCount: recipients.length,
    };
  } catch (error) {
    const deliveryError = error?.message || "Cancellation email submission failed";
    await setDoc(emailQueueRef, {
      subject: emailPayload.subject,
      body: emailPayload.announcement,
      classUrl: emailPayload.link,
      recipientCount: recipients.length,
      recipientLookupError,
      status: "failed",
      deliveryError,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return {
      classId: session.classId,
      sessionId,
      emailQueueId: emailQueueRef.id,
      emailSubmitted: false,
      emailStatus: "failed",
      emailMessage: deliveryError,
      recipientCount: recipients.length,
    };
  }
}

export async function rescheduleSession(sessionId, { startsAt, endsAt, adminId, reason = "" }) {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) throw new Error("Session not found");
    const session = { id: sessionSnap.id, ...sessionSnap.data() };
    const klass = await loadClassRecord(session.classId, transaction);
    const patch = {
      previousStartsAt: session.startsAt || "",
      previousEndsAt: session.endsAt || "",
      startsAt,
      endsAt,
      status: "scheduled",
      rescheduleReason: String(reason || "").trim(),
      rescheduledBy: adminId || "admin",
      rescheduledAt: serverTimestamp(),
      sequence: Number(session.sequence || 0) + 1,
      remindersSuppressed: false,
      cancellationReason: "",
      updatedAt: serverTimestamp(),
    };

    transaction.update(sessionRef, patch);
    transaction.set(attendanceSessionRef(session.classId, sessionId), attendanceMetadata(klass, session, patch), { merge: true });
    transaction.set(doc(collection(db, "auditLogs")), {
      type: "classSession.rescheduled",
      classId: session.classId,
      sessionId,
      actorId: adminId || "admin",
      reason: patch.rescheduleReason,
      createdAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db, "studentNotifications")), {
      type: "classSession.rescheduled",
      classId: session.classId,
      sessionId,
      title: "Live class rescheduled",
      body: patch.rescheduleReason || "A live class session was rescheduled.",
      createdAt: serverTimestamp(),
    });
    transaction.set(doc(db, "calendarFeeds", session.classId), {
      classId: session.classId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

export async function markSessionCompleted(sessionId, adminId = "admin") {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) throw new Error("Session not found");
    const session = { id: sessionSnap.id, ...sessionSnap.data() };
    const klass = await loadClassRecord(session.classId, transaction);
    const patch = {
      status: "completed",
      completedBy: adminId,
      completedAt: serverTimestamp(),
      remindersSuppressed: true,
      updatedAt: serverTimestamp(),
    };
    transaction.update(sessionRef, patch);
    transaction.set(attendanceSessionRef(session.classId, sessionId), attendanceMetadata(klass, session, patch), { merge: true });
  });
}

export function resolveSessionChapters(levelId, session) {
  return normalizeAssignmentIds(session)
    .map((assignmentId) => {
      const canonical = assignmentId.includes("-") ? assignmentId : `${String(levelId || "").toUpperCase()}-${assignmentId}`;
      return getCourseDictionaryEntry(canonical) || getCourseDictionaryEntry(assignmentId);
    })
    .filter(Boolean);
}
