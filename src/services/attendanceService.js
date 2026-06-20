import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

function normalizeClassId(classId) {
  return String(classId || "").trim();
}

function sessionRefFor(classId, sessionId) {
  return doc(collection(db, "attendance", normalizeClassId(classId), "sessions"), String(sessionId));
}

function normalizeStudentEntry(studentCode, value) {
  if (typeof value === "boolean") {
    return { name: "", email: "", present: value };
  }

  if (value && typeof value === "object") {
    return {
      name: String(value.name || "").trim(),
      email: String(value.email || "").trim(),
      present: Boolean(value.present),
    };
  }

  return { name: "", email: "", present: false };
}

function normalizeSessionDoc(data = {}) {
  const students = {};

  if (data.students && typeof data.students === "object") {
    for (const [studentCode, entry] of Object.entries(data.students)) {
      students[studentCode] = normalizeStudentEntry(studentCode, entry);
    }
  } else if (Array.isArray(data.records)) {
    for (const record of data.records) {
      const studentCode = String(record.studentCode || record.studentId || "").trim();
      if (!studentCode) continue;
      students[studentCode] = {
        name: String(record.studentName || "").trim(),
        email: String(record.email || "").trim(),
        present: String(record.status || "").toLowerCase() === "present",
      };
    }
  }

  const assignmentIds = Array.isArray(data.assignmentIds)
    ? data.assignmentIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [String(data.assignmentId || data.assignment_id || "").trim()].filter(Boolean);

  return {
    title: String(data.title || data.sessionLabel || data.lesson || "").trim(),
    date: String(data.date || "").trim(),
    dateLabel: String(data.dateLabel || "").trim(),
    weekday: String(data.weekday || "").trim(),
    startTime: String(data.startTime || "").trim(),
    endTime: String(data.endTime || "").trim(),
    startsAt: String(data.startsAt || "").trim(),
    endsAt: String(data.endsAt || "").trim(),
    classId: String(data.classId || "").trim(),
    className: String(data.className || "").trim(),
    classSessionId: String(data.classSessionId || "").trim(),
    sessionStatus: String(data.sessionStatus || data.status || "scheduled").trim(),
    cancellationReason: String(data.cancellationReason || "").trim(),
    assignmentIds,
    assignmentId: assignmentIds[0] || "",
    students,
  };
}

export async function loadAttendanceFromFirestore(classId) {
  const safeClassId = normalizeClassId(classId);
  if (!safeClassId) return {};

  const snap = await getDocs(collection(db, "attendance", safeClassId, "sessions"));
  const attendanceMap = {};
  snap.forEach((docSnap) => {
    attendanceMap[docSnap.id] = normalizeSessionDoc(docSnap.data());
  });
  return attendanceMap;
}

export async function saveAttendanceToFirestore(classId, attendanceMap) {
  const safeClassId = normalizeClassId(classId);
  if (!safeClassId) throw new Error("Missing classId. Unable to save attendance.");

  const writes = Object.entries(attendanceMap).map(async ([sessionId, session]) => {
    const sessionDate = String(session?.date || "").trim();
    const assignmentIds = Array.isArray(session?.assignmentIds)
      ? session.assignmentIds.map((value) => String(value || "").trim()).filter(Boolean)
      : [String(session?.assignmentId || session?.assignment_id || "").trim()].filter(Boolean);

    const payload = {
      classId: String(session?.classId || safeClassId).trim(),
      className: String(session?.className || "").trim(),
      classSessionId: String(session?.classSessionId || sessionId).trim(),
      title: String(session?.title || "").trim(),
      date: sessionDate,
      dateLabel: String(session?.dateLabel || "").trim(),
      weekday: String(session?.weekday || "").trim(),
      startTime: String(session?.startTime || "").trim(),
      endTime: String(session?.endTime || "").trim(),
      startsAt: String(session?.startsAt || "").trim(),
      endsAt: String(session?.endsAt || "").trim(),
      sessionStatus: String(session?.sessionStatus || "scheduled").trim(),
      cancellationReason: String(session?.cancellationReason || "").trim(),
      students: session?.students || {},
      assignmentIds,
      assignment_id: assignmentIds[0] || "",
      updatedAt: serverTimestamp(),
    };

    const ref = sessionRefFor(safeClassId, sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) payload.createdAt = serverTimestamp();
    return setDoc(ref, payload, { merge: true });
  });

  await Promise.all(writes);
}

export async function saveCanonicalAttendanceSession({ classRecordId, className, session, students, markedBy }) {
  const safeClassId = normalizeClassId(classRecordId);
  const sessionId = String(session?.id || session?.classSessionId || "").trim();
  if (!safeClassId || !sessionId) throw new Error("Class and session are required to save attendance.");

  const ref = sessionRefFor(safeClassId, sessionId);
  const snap = await getDoc(ref);
  const assignmentIds = Array.isArray(session.assignmentIds)
    ? session.assignmentIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  const startsAt = String(session.startsAt || "");
  const endsAt = String(session.endsAt || "");

  const payload = {
    classId: safeClassId,
    className: String(className || "").trim(),
    classSessionId: sessionId,
    title: String(session.topic || className || "Live class").trim(),
    date: startsAt.includes("T") ? startsAt.slice(0, 10) : startsAt,
    startsAt,
    endsAt,
    sessionStatus: String(session.status || "scheduled").trim(),
    cancellationReason: String(session.cancellationReason || "").trim(),
    assignmentIds,
    assignment_id: assignmentIds[0] || "",
    students: students || {},
    markedBy: String(markedBy || "").trim(),
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) payload.createdAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
}

export async function loadAttendanceSession({ classId, date, sessionId }) {
  const ref = sessionRefFor(classId, sessionId || date);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...normalizeSessionDoc(snap.data()) } : null;
}

export async function saveAttendance({ classId, date, teacherUid, sessionLabel, records, sessionId }) {
  const ref = sessionRefFor(classId, sessionId || date);
  const snap = await getDoc(ref);
  const payload = {
    classId: normalizeClassId(classId),
    date,
    markedBy: teacherUid,
    sessionLabel: String(sessionLabel || "").trim(),
    updatedAt: serverTimestamp(),
    records,
  };
  if (!snap.exists()) payload.createdAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
}

export async function listAttendanceSessions({ classId, dateFrom, dateTo }) {
  const constraints = [];
  if (classId) constraints.push(where("classId", "==", classId));
  if (dateFrom) constraints.push(where("date", ">=", dateFrom));
  if (dateTo) constraints.push(where("date", "<=", dateTo));

  const q = query(collectionGroup(db, "sessions"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, ...normalizeSessionDoc(item.data()) }));
}

export async function listSessionCheckins({ classId, sessionId }) {
  const safeClassId = normalizeClassId(classId);
  const safeSessionId = String(sessionId || "").trim();
  if (!safeClassId || !safeSessionId) return [];

  const snap = await getDocs(collection(db, "attendance", safeClassId, "sessions", safeSessionId, "checkins"));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}
