import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { latestSessionDateInTimezone } from "../utils/liveClassScheduling.js";
import * as base from "./liveClassServiceBase.js";

export async function syncClassEndDateFromSessions(classId) {
  const classRef = doc(db, "classes", String(classId));
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error("Class not found");
  const klass = { id: classSnap.id, ...classSnap.data() };
  const sessions = await base.listClassSessions(classId);
  const validSessions = sessions
    .filter((session) => String(session.status || "scheduled").toLowerCase() !== "cancelled")
    .filter((session) => !Number.isNaN(new Date(session.startsAt || 0).getTime()))
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt));
  const latestSession = validSessions[validSessions.length - 1] || null;
  const sessionEndDate = latestSessionDateInTimezone(validSessions, klass.timezone);

  if (sessionEndDate && sessionEndDate !== String(klass.endDate || "")) {
    await updateDoc(classRef, {
      endDate: sessionEndDate,
      sessionDerivedEndDate: sessionEndDate,
      endDateSyncedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return { endDate: sessionEndDate || String(klass.endDate || ""), latestSession };
}
