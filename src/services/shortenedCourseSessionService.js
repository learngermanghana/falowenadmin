import {
  collection, doc, getDoc, getDocs, query, serverTimestamp, where, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { sessionDateInTimezone } from "../utils/liveClassScheduling.js";

const safeDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const protectedStatuses = new Set(["completed", "cancelled", "canceled", "live", "superseded", "deleted"]);

export async function applyShortenedCourseEndDate({ classId, endDate, adminId = "admin" } = {}) {
  const id = String(classId || "").trim();
  const cutoff = String(endDate || "").trim();
  if (!id || id.includes("/")) throw new Error("A valid class ID is required.");
  if (!safeDate(cutoff)) throw new Error("Choose a valid final class date.");

  const classRef = doc(db, "classes", id);
  const klassSnap = await getDoc(classRef);
  if (!klassSnap.exists()) throw new Error("Class not found.");
  const klass = { id, ...klassSnap.data() };
  if (safeDate(klass.startDate) && cutoff < klass.startDate) {
    throw new Error("The final date cannot be before the class start date.");
  }

  // Query by exact class identity; a shared class name must never retire
  // another cohort's sessions.
  const snapshots = await Promise.all([
    getDocs(query(collection(db, "classSessions"), where("classId", "==", id))),
    getDocs(query(collection(db, "classSessions"), where("classRecordId", "==", id))),
  ]);
  const sessions = new Map();
  snapshots.forEach((snapshot) => snapshot.docs.forEach((item) => {
    const session = { id: item.id, ...item.data() };
    const ownerId = String(session.classRecordId || "").trim();
    if (ownerId && ownerId !== id) return;
    sessions.set(item.id, session);
  }));

  const timezone = String(klass.timezone || "Africa/Accra");
  const obsolete = [...sessions.values()].filter((session) => {
    const status = String(session.status || "scheduled").trim().toLowerCase();
    if (protectedStatuses.has(status)) return false;
    const date = sessionDateInTimezone(session.startsAt, timezone);
    return Boolean(date && date > cutoff);
  });
  if (obsolete.length > 240) {
    throw new Error("Too many sessions for a safe single update. Contact the administrator.");
  }

  const batch = writeBatch(db);
  obsolete.forEach((session) => {
    const patch = {
      status: "superseded",
      superseded: true,
      isSuperseded: true,
      shortenedCourseSuperseded: true,
      remindersSuppressed: true,
      reminderSuppressionSource: "shortened-course",
      reminderSuppressionReason: "Outside the administrator-approved final course date.",
      updatedAt: serverTimestamp(),
    };
    batch.set(doc(db, "classSessions", session.id), patch, { merge: true });
    batch.set(doc(db, "attendance", id, "sessions", session.id), {
      classId: id,
      classSessionId: session.id,
      sessionStatus: "superseded",
      shortenedCourseSuperseded: true,
      remindersSuppressed: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  batch.set(classRef, {
    endDate: cutoff,
    configuredEndDate: cutoff,
    shortenedCourseEndDate: cutoff,
    shortenedCourseReconciledAt: serverTimestamp(),
    shortenedCourseReconciledBy: String(adminId || "admin"),
    shortenedCourseRetiredSessionCount: obsolete.length,
    sessionScheduleVersion: Date.now(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(collection(db, "auditLogs")), {
    type: "shortened-course-sessions-retired",
    classId: id,
    finalClassDate: cutoff,
    retiredSessionIds: obsolete.map((item) => item.id),
    adminId: String(adminId || "admin"),
    createdAt: serverTimestamp(),
  });
  await batch.commit();

  return { classId: id, endDate: cutoff, retired: obsolete.length };
}
