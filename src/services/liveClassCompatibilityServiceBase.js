import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { courseDictionary } from "../data/courseDictionary.js";
import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import { selectLatestCompletedSession, selectNextSession } from "../utils/liveClassScheduling.js";
import {
  assignmentIdsForSession,
  dedupeCompatibleSessions,
  enrichSessionsWithStableCurriculum,
} from "../utils/liveClassSessionDedupe.js";
import { syncClassCurriculum as syncBaseClassCurriculum } from "./liveClassService.js";

function normalize(value) {
  return String(value || "").trim();
}

function comparable(value) {
  return normalize(value).toLowerCase().replace(/\s+/g, " ");
}

function levelFromValue(value) {
  const match = normalize(value).match(/(?:^|[^a-z0-9])(A1|A2|B1|B2|C1|C2)(?:[^a-z0-9]|$)/i);
  return match ? match[1].toUpperCase() : "";
}

function resolveLevel(klass = {}) {
  const candidates = [
    klass.levelId,
    klass.level,
    klass.levelName,
    klass.languageLevel,
    klass.curriculumLevel,
    klass.courseLevel,
    klass.courseId,
    klass.course,
    klass.program,
    klass.programId,
    klass.name,
    klass.title,
    klass.className,
    klass.classId,
    klass.slug,
    klass.id,
  ];
  for (const candidate of candidates) {
    const level = levelFromValue(candidate);
    if (level) return level;
  }
  return "";
}

function identifiersFor(classId, klass = {}) {
  return [...new Set([classId, klass.id, klass.name, klass.classId, klass.className, klass.slug]
    .map(normalize)
    .filter(Boolean))];
}

function currentAssignmentIds(session = {}) {
  return assignmentIdsForSession(session);
}

function resolveLevelFromSessions(sessions = []) {
  for (const session of sessions) {
    const values = [
      ...currentAssignmentIds(session),
      session.assignmentId,
      session.assignment_id,
      session.chapterId,
      session.curriculumId,
      session.levelId,
      session.level,
    ];
    for (const value of values) {
      const level = levelFromValue(value);
      if (level) return level;
    }
  }

  const topicScores = Object.fromEntries(Object.keys(courseDictionary).map((level) => [level, 0]));
  sessions.forEach((session) => {
    const topic = comparable(session.topic || session.title || session.sessionLabel);
    if (!topic) return;
    Object.entries(courseDictionary).forEach(([level, dictionary]) => {
      Object.values(dictionary).forEach((entry) => {
        const labels = [entry.en, entry.de].map(comparable).filter(Boolean);
        if (labels.some((label) => topic === label || topic.includes(label) || label.includes(topic))) {
          topicScores[level] += 1;
        }
      });
    });
  });

  const ranked = Object.entries(topicScores).sort((left, right) => right[1] - left[1]);
  if (ranked[0]?.[1] > 0 && ranked[0][1] > (ranked[1]?.[1] || 0)) return ranked[0][0];
  return "";
}

async function loadClassRecord(classId) {
  const snap = await getDoc(doc(db, "classes", normalize(classId)));
  if (!snap.exists()) throw new Error("Class not found");
  return { id: snap.id, ...snap.data() };
}

function persistResolvedLevel(classId, klass, inferredLevel) {
  const existingLevel = levelFromValue(klass.levelId);
  if (!inferredLevel || existingLevel === inferredLevel) return;
  updateDoc(doc(db, "classes", normalize(classId)), {
    levelId: inferredLevel,
    levelResolutionSource: "automatic-compatibility-repair",
    levelResolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(() => {});
}

async function querySessions(field, identifier) {
  const snap = await getDocs(query(collection(db, "classSessions"), where(field, "==", identifier)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function addSessions(target, results = []) {
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((session) => target.set(session.id, session));
  });
}

async function loadCompatibleSessions(classId, klass = {}) {
  const identifiers = identifiersFor(classId, klass);
  const found = new Map();
  const lookups = identifiers.flatMap((identifier) =>
    ["classId", "classRecordId", "className"].map((field) => [field, identifier]),
  );

  addSessions(found, await Promise.allSettled(
    lookups.map(([field, identifier]) => querySessions(field, identifier)),
  ));

  if (found.size === 0) {
    try {
      const lookup = new Set(identifiers.map(comparable));
      const snap = await getDocs(collection(db, "classSessions"));
      snap.docs.forEach((item) => {
        const session = { id: item.id, ...item.data() };
        const values = [session.classId, session.classRecordId, session.className]
          .map(comparable)
          .filter(Boolean);
        if (values.some((value) => lookup.has(value))) found.set(session.id, session);
      });
    } catch {
      // Return the indexed results already found.
    }
  }

  return dedupeCompatibleSessions([...found.values()], {
    classId,
    timezone: klass.timezone || "Africa/Accra",
  });
}

function enrichSessions(klass, sessions = []) {
  const levelId = resolveLevel(klass);
  const groups = getCourseSessionGroups(levelId);
  return enrichSessionsWithStableCurriculum(klass, sessions, groups);
}

function attendanceMetadata(klass, session, patch) {
  const merged = { ...session, ...patch };
  const assignmentIds = currentAssignmentIds(merged);
  const startsAt = merged.startsAt || "";
  return {
    classId: klass.id,
    className: klass.name || "",
    classSessionId: merged.id,
    title: normalize(merged.topic || klass.name || "Live class"),
    topic: normalize(merged.topic),
    date: String(startsAt).includes("T") ? String(startsAt).slice(0, 10) : String(startsAt),
    startsAt,
    endsAt: merged.endsAt || "",
    sessionStatus: merged.status || "scheduled",
    assignmentIds,
    chapterIds: assignmentIds,
    curriculumIds: assignmentIds,
    assignment_id: assignmentIds[0] || "",
    curriculumIndex: Number(merged.curriculumIndex || 0),
    curriculumDay: Number(merged.curriculumDay ?? -1),
    curriculumTaskCount: Number(merged.curriculumTaskCount || assignmentIds.length),
    curriculumSource: "courseDictionary-day-groups",
    curriculumVersion: 2,
    updatedAt: serverTimestamp(),
  };
}

export async function getCompatibleClassDashboard(classId) {
  const klass = await loadClassRecord(classId);
  const rawSessions = await loadCompatibleSessions(classId, klass);
  const inferredLevel = resolveLevel(klass) || resolveLevelFromSessions(rawSessions);
  persistResolvedLevel(classId, klass, inferredLevel);
  const normalizedClass = {
    ...klass,
    levelId: inferredLevel || normalize(klass.levelId),
    resolvedLevelId: inferredLevel || normalize(klass.levelId),
  };
  const groups = getCourseSessionGroups(normalizedClass.levelId);
  const sessions = enrichSessions(normalizedClass, rawSessions);
  const availableCurriculumItems = Object.keys(courseDictionary[normalizedClass.levelId] || {}).length;

  return {
    klass: normalizedClass,
    sessions,
    curriculumSync: {
      updated: 0,
      mapped: Math.min(sessions.length, groups.length),
      total: sessions.length,
      availableCurriculumItems,
      attendanceDays: groups.length,
      hiddenExtraSessionCount: Math.max(0, rawSessions.length - sessions.length),
      readOnly: true,
    },
    nextSession: selectNextSession(sessions),
    latestCompletedSession: selectLatestCompletedSession(sessions),
  };
}

export async function updateCompatibleSession(classId, sessionId, patch = {}) {
  const [klass, sessionSnap] = await Promise.all([
    loadClassRecord(classId),
    getDoc(doc(db, "classSessions", normalize(sessionId))),
  ]);
  if (!sessionSnap.exists()) throw new Error("Session not found");

  const session = { id: sessionSnap.id, ...sessionSnap.data() };
  const merged = { ...session, ...patch };
  const assignmentIds = currentAssignmentIds(merged);
  const nextPatch = {
    ...patch,
    classId: klass.id,
    classRecordId: klass.id,
    className: klass.name || "",
    assignmentIds,
    chapterIds: assignmentIds,
    curriculumIds: assignmentIds,
    assignment_id: assignmentIds[0] || "",
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.update(doc(db, "classSessions", session.id), nextPatch);
  batch.set(
    doc(db, "attendance", klass.id, "sessions", session.id),
    attendanceMetadata(klass, session, nextPatch),
    { merge: true },
  );
  await batch.commit();
  return { ...session, ...nextPatch };
}

export async function syncCompatibleClassCurriculum(classId, options = {}) {
  return syncBaseClassCurriculum(classId, {
    removeExtraFuture: options.removeExtraFuture !== false,
  });
}
