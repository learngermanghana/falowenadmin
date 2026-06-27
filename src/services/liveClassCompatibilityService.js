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
import { courseDictionary, getUnifiedTopicLabel } from "../data/courseDictionary.js";
import { selectLatestCompletedSession, selectNextSession } from "../utils/liveClassScheduling.js";
import { syncClassCurriculum as syncBaseClassCurriculum } from "./liveClassService.js";

function normalize(value) {
  return String(value || "").trim();
}

function comparable(value) {
  return normalize(value).toLowerCase().replace(/\s+/g, " ");
}

function resolveLevel(klass = {}) {
  const candidates = [klass.levelId, klass.level, klass.courseLevel, klass.name, klass.className, klass.classId, klass.id];
  for (const candidate of candidates) {
    const match = normalize(candidate).match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
    if (match) return match[1].toUpperCase();
  }
  return "";
}

function identifiersFor(classId, klass = {}) {
  return [...new Set([classId, klass.id, klass.name, klass.classId, klass.className, klass.slug]
    .map(normalize)
    .filter(Boolean))];
}

function sessionTime(session = {}) {
  if (typeof session.startsAt?.toDate === "function") return session.startsAt.toDate().getTime();
  const parsed = new Date(session.startsAt || 0).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function currentAssignmentIds(session = {}) {
  const arrays = [session.assignmentIds, session.chapterIds, session.curriculumIds];
  const source = arrays.find((value) => Array.isArray(value) && value.length)
    || (session.assignment_id ? [session.assignment_id] : []);
  return [...new Set(source.map((value) => normalize(value).toUpperCase()).filter(Boolean))];
}

async function loadClassRecord(classId) {
  const snap = await getDoc(doc(db, "classes", normalize(classId)));
  if (!snap.exists()) throw new Error("Class not found");
  const klass = { id: snap.id, ...snap.data() };
  const levelId = resolveLevel(klass);
  return levelId ? { ...klass, levelId } : klass;
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
  const primaryLookups = [
    ["classId", normalize(classId)],
    ["classRecordId", normalize(classId)],
    ["className", normalize(klass.name || klass.className)],
  ].filter(([, identifier]) => identifier);

  addSessions(found, await Promise.allSettled(
    primaryLookups.map(([field, identifier]) => querySessions(field, identifier)),
  ));
  if (found.size > 0) {
    return [...found.values()].sort((left, right) => sessionTime(left) - sessionTime(right));
  }

  const primaryKeys = new Set(primaryLookups.map(([field, identifier]) => `${field}:${identifier}`));
  const fallbackLookups = identifiers.flatMap((identifier) =>
    ["classId", "classRecordId", "className"]
      .map((field) => [field, identifier])
      .filter(([field, value]) => !primaryKeys.has(`${field}:${value}`)),
  );
  addSessions(found, await Promise.allSettled(
    fallbackLookups.map(([field, identifier]) => querySessions(field, identifier)),
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
      // Return the results found by indexed lookups.
    }
  }

  return [...found.values()].sort((left, right) => sessionTime(left) - sessionTime(right));
}

function enrichSessions(klass, sessions = []) {
  const levelId = resolveLevel(klass);
  const entries = Object.values(courseDictionary[levelId] || {});
  return sessions.map((session, index) => {
    const entry = entries[index];
    if (!entry) return session;
    const existingIds = currentAssignmentIds(session);
    const assignmentIds = existingIds.length
      ? existingIds
      : [normalize(entry.assignment_id).toUpperCase()];
    return {
      ...session,
      assignmentIds,
      chapterIds: assignmentIds,
      curriculumIds: assignmentIds,
      topic: normalize(session.topic) || getUnifiedTopicLabel(assignmentIds[0], entry.de || entry.en || ""),
      curriculumIndex: Number(session.curriculumIndex || index + 1),
    };
  });
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
    curriculumSource: "courseDictionary",
    curriculumVersion: 1,
    updatedAt: serverTimestamp(),
  };
}

export async function getCompatibleClassDashboard(classId) {
  const klass = await loadClassRecord(classId);
  const normalizedClass = { ...klass, levelId: resolveLevel(klass) || klass.levelId };
  const sessions = enrichSessions(normalizedClass, await loadCompatibleSessions(classId, normalizedClass));
  const availableCurriculumItems = Object.keys(courseDictionary[normalizedClass.levelId] || {}).length;

  return {
    klass: normalizedClass,
    sessions,
    curriculumSync: {
      updated: 0,
      mapped: Math.min(sessions.length, availableCurriculumItems),
      total: sessions.length,
      availableCurriculumItems,
      readOnly: true,
    },
    nextSession: selectNextSession(sessions),
    latestCompletedSession: selectLatestCompletedSession(sessions),
  };
}

export async function syncCompatibleClassCurriculum(classId, { force = false } = {}) {
  try {
    const baseResult = await syncBaseClassCurriculum(classId, { force });
    if (baseResult.total > 0) return baseResult;
  } catch {
    // Repair legacy sessions below.
  }

  const klass = await loadClassRecord(classId);
  const sessions = await loadCompatibleSessions(classId, klass);
  const levelId = resolveLevel(klass);
  const entries = Object.values(courseDictionary[levelId] || {});
  if (!entries.length) {
    throw new Error(`No course dictionary was found for ${klass.name || classId}. Set the class level in Class & settings.`);
  }

  const batch = writeBatch(db);
  let updated = 0;
  let mapped = 0;

  sessions.forEach((session, index) => {
    const entry = entries[index];
    const ids = currentAssignmentIds(session);
    const patch = {
      classId,
      classRecordId: classId,
      className: klass.name || "",
    };

    if (normalize(session.classId) !== normalize(classId)) patch.legacyClassId = session.classId || "";
    if (entry) {
      mapped += 1;
      const assignmentIds = ids.length && !force ? ids : [normalize(entry.assignment_id).toUpperCase()];
      patch.assignmentIds = assignmentIds;
      patch.chapterIds = assignmentIds;
      patch.curriculumIds = assignmentIds;
      patch.topic = !force && normalize(session.topic)
        ? session.topic
        : getUnifiedTopicLabel(assignmentIds[0], entry.de || entry.en || "");
      patch.curriculumIndex = index + 1;
      patch.curriculumSource = "courseDictionary";
      patch.curriculumVersion = 1;
      patch.curriculumAutoAssigned = true;
    }

    const nextPatch = { ...patch, updatedAt: serverTimestamp() };
    batch.update(doc(db, "classSessions", session.id), nextPatch);
    batch.set(
      doc(db, "attendance", classId, "sessions", session.id),
      attendanceMetadata(klass, session, nextPatch),
      { merge: true },
    );
    updated += 1;
  });

  batch.set(doc(db, "classes", classId), {
    levelId,
    generatedSessionCount: sessions.length,
    curriculumSyncStatus: "complete",
    curriculumMappedSessionCount: mapped,
    curriculumSyncedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();

  return {
    updated,
    mapped,
    total: sessions.length,
    availableCurriculumItems: entries.length,
  };
}
