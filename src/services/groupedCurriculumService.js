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
import { courseDictionary } from "../data/courseDictionary.js";
import { getCourseSessionGroups } from "../data/courseSessionGroups.js";

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sessionDate(value) {
  if (typeof value?.toDate === "function") return value.toDate().toISOString().slice(0, 10);
  return String(value || "").includes("T") ? String(value).slice(0, 10) : String(value || "");
}

function isProtected(session = {}, nowMs = Date.now()) {
  const status = String(session.status || "scheduled").toLowerCase();
  return ["completed", "cancelled", "live"].includes(status) || toMillis(session.startsAt) < nowMs;
}

function attendanceMetadata(klass, session, patch) {
  const merged = { ...session, ...patch };
  const assignmentIds = Array.isArray(merged.assignmentIds) ? merged.assignmentIds : [];
  return {
    classId: klass.id,
    className: klass.name || "",
    classSessionId: session.id,
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
    curriculumDay: Number(merged.curriculumDay ?? -1),
    curriculumTaskCount: Number(merged.curriculumTaskCount || assignmentIds.length),
    curriculumSource: "courseDictionary-day-groups",
    curriculumVersion: 2,
    updatedAt: serverTimestamp(),
  };
}

export async function applyGroupedCurriculumToClass(classId, { removeExtraFuture = true } = {}) {
  const classRef = doc(db, "classes", String(classId));
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error("Class not found");
  const klass = { id: classSnap.id, ...classSnap.data() };
  const levelId = String(klass.levelId || "").trim().toUpperCase();
  const groups = getCourseSessionGroups(levelId);
  const taskCount = Object.keys(courseDictionary[levelId] || {}).length;
  if (!groups.length) throw new Error(`No course dictionary was found for ${levelId || klass.name || classId}.`);

  const snapshot = await getDocs(query(collection(db, "classSessions"), where("classId", "==", String(classId))));
  const sessions = snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((left, right) => toMillis(left.startsAt) - toMillis(right.startsAt));

  const batch = writeBatch(db);
  const nowMs = Date.now();
  let mapped = 0;
  let removed = 0;
  let preservedExtras = 0;

  sessions.forEach((session, index) => {
    const group = groups[index];
    if (!group) {
      if (removeExtraFuture && !isProtected(session, nowMs)) {
        batch.delete(doc(db, "classSessions", session.id));
        batch.delete(doc(db, "attendance", String(classId), "sessions", session.id));
        removed += 1;
      } else {
        preservedExtras += 1;
      }
      return;
    }

    const patch = {
      assignmentIds: group.assignmentIds,
      chapterIds: group.assignmentIds,
      curriculumIds: group.assignmentIds,
      assignment_id: group.assignmentIds[0] || "",
      topic: group.topic,
      curriculumIndex: index + 1,
      curriculumDay: group.day,
      curriculumTaskCount: group.assignmentIds.length,
      curriculumSource: "courseDictionary-day-groups",
      curriculumVersion: 2,
      curriculumAutoAssigned: true,
      updatedAt: serverTimestamp(),
    };
    batch.update(doc(db, "classSessions", session.id), patch);
    batch.set(
      doc(db, "attendance", String(classId), "sessions", session.id),
      attendanceMetadata(klass, session, patch),
      { merge: true },
    );
    mapped += 1;
  });

  batch.set(classRef, {
    curriculumSyncStatus: "complete",
    curriculumGrouping: "course-day",
    curriculumTaskCount: taskCount,
    curriculumAttendanceDayCount: groups.length,
    curriculumMappedSessionCount: mapped,
    generatedSessionCount: Math.min(sessions.length - removed, groups.length),
    curriculumSyncedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();

  return {
    mapped,
    removed,
    preservedExtras,
    total: Math.min(sessions.length - removed, groups.length),
    availableCurriculumItems: taskCount,
    attendanceDays: groups.length,
  };
}
