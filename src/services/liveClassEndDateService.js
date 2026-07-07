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

  if (sessionEndDate && sessionEndDate !== String(klass.sessionDerivedEndDate || "")) {
    await updateDoc(classRef, {
      sessionDerivedEndDate: sessionEndDate,
      sessionDerivedEndDateSyncedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const endDate = String(klass.endDate || "");
  return { endDate, sessionDerivedEndDate: sessionEndDate, configuredEndDate: String(klass.configuredEndDate || klass.endDate || ""), latestSession };
}
