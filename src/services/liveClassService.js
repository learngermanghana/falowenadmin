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
  updateDoc,
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
import {
  courseDictionary,
  getCourseDictionaryEntry,
  getUnifiedTopicLabel,
} from "../data/courseDictionary.js";
import { saveAnnouncementRow } from "./communicationService.js";
import { listStudentsByClass } from "./studentsService.js";
import {
  buildCancellationAnnouncement,
  findNextScheduledSession,
  getCancellationRecipients,
} from "../utils/liveClassCancellationEmail.js";

const CURRICULUM_SOURCE = "courseDictionary";
const CURRICULUM_VERSION = 1;

function attendanceSessionRef(classId, sessionId) {
  return doc(db, "attendance", String(classId), "sessions", String(sessionId));
}

function arrayWithValues(value) {
  return Array.isArray(value) ? value.filter((item) => String(item || "").trim()) : [];
}

function normalizeAssignmentIds(session = {}) {
  const assignmentIds = arrayWithValues(session.assignmentIds);
  const chapterIds = arrayWithValues(session.chapterIds);
  const curriculumIds = arrayWithValues(session.curriculumIds);
  const singularId = String(session.assignment_id || "").trim();
  const source = assignmentIds.length
    ? assignmentIds
    : chapterIds.length
      ? chapterIds
      : curriculumIds.length
        ? curriculumIds
        : singularId
          ? [singularId]
          : [];
  return [...new Set(source.map((value) => String(value || "").trim().toUpperCase()).filter(Boolean))];
}

function arraysEqual(left = [], right = []) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function curriculumEntries(levelId) {
  const level = String(levelId || "").trim().toUpperCase();
  return Object.values(courseDictionary[level] || {});
}

function buildCurriculumPatch(levelId, sessionIndex, session = {}, { force = false } = {}) {
  const entry = curriculumEntries(levelId)[sessionIndex];
  if (!entry?.assignment_id) return null;

  const assignmentIds = [String(entry.assignment_id).trim().toUpperCase()];
  const currentIds = normalizeAssignmentIds(session);
  const currentTopic = String(session.topic || "").trim();
  const topic = getUnifiedTopicLabel(assignmentIds[0], entry.de || entry.en || "");
  const patch = {};

  if (force || !currentIds.length) {
    patch.assignmentIds = assignmentIds;
    patch.chapterIds = assignmentIds;
    patch.curriculumIds = assignmentIds;
  } else {
    const currentAssignmentIds = arrayWithValues(session.assignmentIds)
      .map((value) => String(value).trim().toUpperCase());
    const currentChapterIds = arrayWithValues(session.chapterIds)
      .map((value) => String(value).trim().toUpperCase());
    const currentCurriculumIds = arrayWithValues(session.curriculumIds)
      .map((value) => String(value).trim().toUpperCase());
    if (!arraysEqual(currentAssignmentIds, currentIds)) patch.assignmentIds = currentIds;
    if (!arraysEqual(currentChapterIds, currentIds)) patch.chapterIds = currentIds;
    if (!arraysEqual(currentCurriculumIds, currentIds)) patch.curriculumIds = currentIds;
  }

  if (force || !currentTopic) patch.topic = topic;
  if (Number(session.curriculumIndex || 0) !== sessionIndex + 1) patch.curriculumIndex = sessionIndex + 1;
  if (session.curriculumSource !== CURRICULUM_SOURCE) patch.curriculumSource = CURRICULUM_SOURCE;
  if (Number(session.curriculumVersion || 0) !== CURRICULUM_VERSION) patch.curriculumVersion = CURRICULUM_VERSION;
  if (session.curriculumAutoAssigned !== true && (!currentIds.length || !currentTopic || force)) {
    patch.curriculumAutoAssigned = true;
  }

  return Object.keys(patch).length ? patch : null;
}

function sessionDate(startsAt) {
  const value = String(startsAt || "");
  return value.includes("T") ? value.slice(0, 10) : value;
}

function normalizeClassLookup(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function canRestoreClassRecord(record = null) {
  if (!record) return false;
  return ["archived", "draft"].includes(String(record.status || "").toLowerCase())
    || record.archived === true
    || record.isArchived === true
    || !record.startDate
    || !record.endDate;
}

async function findExistingClassForCreate({ name, slug }) {
  const candidates = new Map();
  const addSnap = (snap) => {
    if (snap?.exists?.()) candidates.set(snap.id, { id: snap.id, ...snap.data() });
  };
  const addDocs = (snap) => {
    snap?.docs?.forEach((item) => candidates.set(item.id, { id: item.id, ...item.data() }));
  };

  addSnap(await getDoc(doc(db, "classes", name)));
  addDocs(await getDocs(query(collection(db, "classes"), where("slug", "==", slug))));
  addDocs(await getDocs(query(collection(db, "classes"), where("name", "==", name))));
  addDocs(await getDocs(query(collection(db, "classes"), where("classId", "==", name))));

  const normalizedName = normalizeClassLookup(name);
  const matching = [...candidates.values()].filter((item) => {
    const identifiers = [item.id, item.name, item.classId, item.className, item.slug];
    return identifiers.some((value) => normalizeClassLookup(value) === normalizedName || String(value || "").trim() === slug);
  });

  return matching.find(canRestoreClassRecord) || matching[0] || null;
}

function attendanceMetadata(klass = {}, session = {}, patch = {}) {
  const merged = { ...session, ...patch };
  const assignmentIds = normalizeAssignmentIds(merged);
  return {
    classId: klass.id || merged.classId || "",
    className: klass.name || "",
    classSessionId: merged.id || "",
    title: String(merged.topic || klass.name || "Live class").trim(),
    topic: String(merged.topic || "").trim(),
    date: sessionDate(merged.startsAt),
    startsAt: merged.startsAt || "",
    endsAt: merged.endsAt || "",
    sessionStatus: merged.status || "scheduled",
    cancellationReason: String(merged.cancellationReason || "").trim(),
    assignmentIds,
    chapterIds: assignmentIds,
    curriculumIds: assignmentIds,
    assignment_id: assignmentIds[0] || "",
    curriculumIndex: Number(merged.curriculumIndex || 0),
    curriculumSource: String(merged.curriculumSource || ""),
    curriculumVersion: Number(merged.curriculumVersion || 0),
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
  const existing = await findExistingClassForCreate({ name, slug });
  if (existing && !canRestoreClassRecord(existing)) throw new Error("A class with this name or URL already exists");

  const classRef = existing ? doc(db, "classes", existing.id) : doc(collection(db, "classes"));
  const record = {
    ...(existing || {}),
    id: classRef.id,
    slug,
    name,
    levelId: String(payload.levelId || existing?.levelId || "").toUpperCase(),
    tutorId: String(payload.tutorId ?? existing?.tutorId ?? "").trim(),
    startDate: payload.startDate,
    endDate: payload.endDate,
    timezone: payload.timezone || existing?.timezone || "Africa/Accra",
    status: payload.status || "upcoming",
    zoomProfileId: String(payload.zoomProfileId ?? existing?.zoomProfileId ?? "").trim(),
    scheduleRules: payload.scheduleRules || existing?.scheduleRules || [],
    publicVisible: payload.publicVisible ?? existing?.publicVisible ?? true,
    registrationOpen: payload.registrationOpen ?? existing?.registrationOpen ?? true,
    archived: false,
    isArchived: false,
    active: true,
    classId: existing?.classId || name,
    classUrl: buildClassUrl({ slug }),
    generationStatus: "pending",
    generationError: "",
    updatedAt: serverTimestamp(),
    ...(existing ? {} : { createdAt: serverTimestamp() }),
  };

  await setDoc(classRef, record, { merge: true });
  try {
    const generation = await generateClassSessions(classRef.id, record);
    await updateDoc(classRef, {
      status: record.status,
      startDate: record.startDate,
      endDate: record.endDate,
      timezone: record.timezone,
      scheduleRules: record.scheduleRules,
      publicVisible: record.publicVisible,
      registrationOpen: record.registrationOpen,
      archived: false,
      isArchived: false,
      active: true,
      classId: record.classId,
      slug: record.slug,
      classUrl: record.classUrl,
      generationStatus: "complete",
      generationError: "",
      generatedSessionCount: generation.total,
      curriculumMappedSessionCount: generation.mapped,
      updatedAt: serverTimestamp(),
    });
    return {
      ...record,
      generationStatus: "complete",
      generatedSessionCount: generation.total,
      curriculumMappedSessionCount: generation.mapped,
    };
  } catch (error) {
    await updateDoc(classRef, {
      generationStatus: "failed",
      generationError: error?.message || "Session generation failed",
      updatedAt: serverTimestamp(),
    });
    throw new Error(`Class was saved, but session generation failed: ${error?.message || "Unknown error"}. You can safely retry session generation for this class without creating duplicate sessions.`);
  }
}

export async function generateClassSessions(classId, classRecord = null) {
  const klass = classRecord || (await loadClassRecord(classId));
  const occurrences = generateSessionOccurrences({ classId, ...klass });
  const existingSnap = await getDocs(query(collection(db, "classSessions"), where("classId", "==", classId)));
  const existingById = new Map(existingSnap.docs.map((item) => [item.id, { id: item.id, ...item.data() }]));
  const batch = writeBatch(db);
  let created = 0;
  let enriched = 0;
  let mapped = 0;

  occurrences.forEach((occurrence, index) => {
    const existing = existingById.get(occurrence.id);
    const curriculumPatch = buildCurriculumPatch(klass.levelId, index, existing || {}, { force: !existing });
    if (curriculumPatch) mapped += 1;

    if (existing) {
      if (!curriculumPatch) return;
      const nextPatch = { ...curriculumPatch, updatedAt: serverTimestamp() };
      batch.update(doc(db, "classSessions", occurrence.id), nextPatch);
      batch.set(
        attendanceSessionRef(classId, occurrence.id),
        attendanceMetadata(klass, existing, nextPatch),
        { merge: true },
      );
      enriched += 1;
      return;
    }

    const session = {
      ...occurrence,
      assignmentIds: [],
      chapterIds: [],
      curriculumIds: [],
      ...(curriculumPatch || {}),
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

  if (created > 0 || enriched > 0) await batch.commit();
  return { created, enriched, mapped, total: occurrences.length };
}

export async function listClassSessions(classId) {
  const snap = await getDocs(
    query(collection(db, "classSessions"), where("classId", "==", classId), orderBy("startsAt", "asc")),
  );
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function syncClassCurriculum(classId, { force = false } = {}) {
  const [klass, sessions] = await Promise.all([loadClassRecord(classId), listClassSessions(classId)]);
  const batch = writeBatch(db);
  let updated = 0;
  let mapped = 0;

  sessions.forEach((session, index) => {
    const patch = buildCurriculumPatch(klass.levelId, index, session, { force });
    if (!patch) return;
    mapped += 1;
    const nextPatch = { ...patch, updatedAt: serverTimestamp() };
    batch.update(doc(db, "classSessions", session.id), nextPatch);
    batch.set(attendanceSessionRef(classId, session.id), attendanceMetadata(klass, session, nextPatch), { merge: true });
    updated += 1;
  });

  if (updated > 0) {
    batch.set(doc(db, "classes", classId), {
      curriculumSyncStatus: "complete",
      curriculumMappedSessionCount: mapped,
      curriculumSyncedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await batch.commit();
  }

  return {
    updated,
    mapped,
    total: sessions.length,
    availableCurriculumItems: curriculumEntries(klass.levelId).length,
  };
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
  const klass = await loadClassRecord(classId);
  let sessions = await listClassSessions(classId);
  const syncResult = await syncClassCurriculum(classId);
  if (syncResult.updated > 0) sessions = await listClassSessions(classId);
  return {
    klass,
    sessions,
    curriculumSync: syncResult,
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
    const hasCurriculumPatch = Object.prototype.hasOwnProperty.call(patch, "assignmentIds")
      || Object.prototype.hasOwnProperty.call(patch, "chapterIds")
      || Object.prototype.hasOwnProperty.call(patch, "curriculumIds");
    const assignmentIds = hasCurriculumPatch ? normalizeAssignmentIds(patch) : normalizeAssignmentIds(session);
    const nextPatch = {
      ...patch,
      assignmentIds,
      chapterIds: assignmentIds,
      curriculumIds: assignmentIds,
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
