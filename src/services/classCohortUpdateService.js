import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import {
  buildClassUrl,
  generateSessionOccurrences,
  normalizeScheduleRules,
} from "../utils/liveClassScheduling.js";
import { courseDictionary, getUnifiedTopicLabel } from "../data/courseDictionary.js";

const TUITION = { A1: 2800, A2: 3000, B1: 3000, B2: 3000, C1: 3000 };
const DAY = { sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat" };
const CURRICULUM_SOURCE = "courseDictionary";
const CURRICULUM_VERSION = 1;

function attendanceSessionRef(classId, sessionId) {
  return doc(db, "attendance", String(classId), "sessions", String(sessionId));
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function canonicalRules(rules = []) {
  return normalizeScheduleRules(rules).map((rule) => ({
    day: DAY[rule.day] || rule.day,
    startTime: rule.startTime,
    durationMinutes: Number(rule.durationMinutes || 60),
  }));
}

function cityFromName(name) {
  return String(name || "")
    .replace(/^\s*(A1|A2|B1|B2|C1|C2)\s+/i, "")
    .replace(/\s+Klasse\s*$/i, "")
    .trim();
}

function sameRules(left, right) {
  return JSON.stringify(canonicalRules(left)) === JSON.stringify(canonicalRules(right));
}

function normalizeIds(session = {}) {
  const arrays = [session.assignmentIds, session.chapterIds, session.curriculumIds];
  const selected = arrays.find((value) => Array.isArray(value) && value.some(Boolean));
  const values = selected || (session.assignment_id ? [session.assignment_id] : []);
  return [...new Set(values.map((value) => String(value || "").trim().toUpperCase()).filter(Boolean))];
}

function curriculumFor(levelId, index, existing = {}, force = false) {
  const entry = Object.values(courseDictionary[String(levelId || "").toUpperCase()] || {})[index];
  const currentIds = normalizeIds(existing);
  const automaticIds = entry?.assignment_id ? [String(entry.assignment_id).trim().toUpperCase()] : [];
  const assignmentIds = force || !currentIds.length ? automaticIds : currentIds;
  const existingTopic = String(existing.topic || "").trim();
  const automaticTopic = automaticIds.length
    ? getUnifiedTopicLabel(automaticIds[0], entry?.de || entry?.en || "")
    : "";
  const topic = force || !existingTopic ? automaticTopic : existingTopic;

  return {
    topic,
    assignmentIds,
    chapterIds: assignmentIds,
    curriculumIds: assignmentIds,
    assignment_id: assignmentIds[0] || "",
    curriculumIndex: index + 1,
    curriculumSource: automaticIds.length ? CURRICULUM_SOURCE : String(existing.curriculumSource || ""),
    curriculumVersion: automaticIds.length ? CURRICULUM_VERSION : Number(existing.curriculumVersion || 0),
    curriculumAutoAssigned: automaticIds.length > 0,
  };
}

function attendanceMetadata(klass, session) {
  const assignmentIds = normalizeIds(session);
  return {
    classId: klass.id,
    className: klass.name,
    classSessionId: session.id,
    title: String(session.topic || klass.name || "Live class").trim(),
    topic: String(session.topic || "").trim(),
    date: String(session.startsAt || "").slice(0, 10),
    startsAt: session.startsAt || "",
    endsAt: session.endsAt || "",
    sessionStatus: session.status || "scheduled",
    cancellationReason: String(session.cancellationReason || "").trim(),
    assignmentIds,
    chapterIds: assignmentIds,
    curriculumIds: assignmentIds,
    assignment_id: assignmentIds[0] || "",
    curriculumIndex: Number(session.curriculumIndex || 0),
    curriculumSource: String(session.curriculumSource || ""),
    curriculumVersion: Number(session.curriculumVersion || 0),
    updatedAt: serverTimestamp(),
  };
}

function protectedSession(session, nowMs) {
  const status = String(session.status || "scheduled").toLowerCase();
  return ["completed", "cancelled", "live"].includes(status) || toMillis(session.startsAt) < nowMs;
}

export async function updateClassCohort(classId, payload) {
  const classRef = doc(db, "classes", String(classId));
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error("Class not found");

  const current = { id: classSnap.id, ...classSnap.data() };
  const name = String(payload.name || current.name || "").trim();
  const levelId = String(payload.levelId || current.levelId || "").trim().toUpperCase();
  const startDate = String(payload.startDate || current.startDate || "").trim();
  const endDate = String(payload.endDate || current.endDate || "").trim();
  const timezone = String(payload.timezone || current.timezone || "Africa/Accra").trim();
  const scheduleRules = canonicalRules(payload.scheduleRules || current.scheduleRules || []);

  if (!name) throw new Error("Class name is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error("Valid start and end dates are required");
  }
  if (endDate < startDate) throw new Error("End date must be on or after the start date");
  if (!scheduleRules.length) throw new Error("At least one weekly schedule rule is required");

  const sessionsSnap = await getDocs(query(collection(db, "classSessions"), where("classId", "==", classId)));
  const sessions = sessionsSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
  const nowMs = Date.now();
  const hasStarted = sessions.some((session) => protectedSession(session, nowMs) && String(session.status || "").toLowerCase() !== "cancelled");
  const currentLevel = String(current.levelId || "").toUpperCase();
  const scheduleChanged = startDate !== current.startDate
    || levelId !== currentLevel
    || timezone !== String(current.timezone || "Africa/Accra")
    || !sameRules(scheduleRules, current.scheduleRules);
  if (hasStarted && scheduleChanged) {
    throw new Error("This class has already started. Keep its start date and weekly timetable, then use Reschedule on individual future sessions. You may still extend the graduation date.");
  }

  const tuitionGhs = Number(payload.tuitionGhs ?? current.tuitionGhs ?? TUITION[levelId] ?? 3000);
  const next = {
    ...current,
    id: classId,
    name,
    levelId,
    startDate,
    endDate,
    timezone,
    scheduleRules,
    tutorId: String(payload.tutorId ?? current.tutorId ?? "").trim(),
    zoomProfileId: String(payload.zoomProfileId ?? current.zoomProfileId ?? "").trim(),
    status: String(payload.status || current.status || "upcoming").toLowerCase(),
    city: String(payload.city ?? current.city ?? cityFromName(name)).trim(),
    orientationDate: String(payload.orientationDate ?? current.orientationDate ?? "").trim(),
    tuitionGhs: Number.isFinite(tuitionGhs) && tuitionGhs > 0 ? tuitionGhs : TUITION[levelId] || 3000,
    publicVisible: payload.publicVisible ?? current.publicVisible ?? true,
    registrationOpen: payload.registrationOpen ?? current.registrationOpen ?? true,
    archived: false,
    isArchived: false,
    active: true,
    classId: String(current.classId || name).trim(),
    scheduleUrl: String(payload.scheduleUrl ?? current.scheduleUrl ?? "").trim(),
    classUrl: buildClassUrl(current),
  };

  const occurrences = generateSessionOccurrences(next);
  const desiredFuture = occurrences.filter((occurrence) => toMillis(occurrence.startsAt) >= nowMs);
  const desiredIds = new Set(desiredFuture.map((occurrence) => occurrence.id));
  const existingById = new Map(sessions.map((session) => [session.id, session]));
  const protectedIds = new Set(sessions.filter((session) => protectedSession(session, nowMs)).map((session) => session.id));
  const levelChanged = currentLevel !== levelId;
  const batch = writeBatch(db);
  let removed = 0;
  let created = 0;
  let refreshed = 0;
  let mapped = 0;

  sessions.forEach((session) => {
    if (protectedSession(session, nowMs) || desiredIds.has(session.id)) return;
    batch.delete(doc(db, "classSessions", session.id));
    batch.delete(attendanceSessionRef(classId, session.id));
    removed += 1;
  });

  occurrences.forEach((occurrence, index) => {
    if (toMillis(occurrence.startsAt) < nowMs || protectedIds.has(occurrence.id)) return;
    const existing = existingById.get(occurrence.id) || null;
    const curriculum = curriculumFor(levelId, index, existing || {}, levelChanged || !existing);
    if (curriculum.assignmentIds.length) mapped += 1;
    const session = {
      ...(existing || {}),
      ...occurrence,
      ...curriculum,
      status: "scheduled",
      cancellationReason: "",
      remindersSuppressed: false,
      sequence: Number(existing?.sequence || 0),
      updatedAt: serverTimestamp(),
      ...(existing ? {} : { createdAt: serverTimestamp() }),
    };
    batch.set(doc(db, "classSessions", occurrence.id), session, { merge: true });
    batch.set(attendanceSessionRef(classId, occurrence.id), {
      ...attendanceMetadata(next, session),
      ...(existing ? {} : { createdAt: serverTimestamp(), students: {} }),
    }, { merge: true });
    if (existing) refreshed += 1;
    else created += 1;
  });

  batch.set(classRef, {
    name: next.name,
    levelId: next.levelId,
    startDate: next.startDate,
    endDate: next.endDate,
    timezone: next.timezone,
    scheduleRules: next.scheduleRules,
    tutorId: next.tutorId,
    zoomProfileId: next.zoomProfileId,
    status: next.status,
    city: next.city,
    orientationDate: next.orientationDate,
    tuitionGhs: next.tuitionGhs,
    publicVisible: next.publicVisible,
    registrationOpen: next.registrationOpen,
    archived: next.archived,
    isArchived: next.isArchived,
    active: next.active,
    classId: next.classId,
    scheduleUrl: next.scheduleUrl,
    classUrl: next.classUrl,
    generationStatus: "complete",
    generationError: "",
    generatedSessionCount: occurrences.length,
    curriculumMappedSessionCount: mapped,
    publicDataVersion: 1,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(db, "calendarFeeds", String(classId)), { classId, updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();

  return {
    classId,
    removed,
    created,
    refreshed,
    mapped,
    preserved: protectedIds.size,
    total: occurrences.length,
  };
}

export function defaultTuitionForLevel(levelId) {
  return TUITION[String(levelId || "").toUpperCase()] || 3000;
}
