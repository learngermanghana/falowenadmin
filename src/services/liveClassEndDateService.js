import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { classScheduleBoundsFromSessions } from "../utils/attendanceSessionOverride.js";
import * as base from "./liveClassServiceBase.js";

export async function syncClassEndDateFromSessions(classId) {
  const classRef = doc(db, "classes", String(classId));
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error("Class not found");
  const klass = { id: classSnap.id, ...classSnap.data() };
  const sessions = await base.listClassSessions(classId);
  const bounds = classScheduleBoundsFromSessions(sessions, klass.timezone || "Africa/Accra");

  const patch = {};
  if (bounds.sessionDerivedStartDate && bounds.sessionDerivedStartDate !== String(klass.sessionDerivedStartDate || "")) {
    patch.sessionDerivedStartDate = bounds.sessionDerivedStartDate;
    patch.sessionDerivedStartDateSyncedAt = serverTimestamp();
  }
  if (bounds.sessionDerivedEndDate && bounds.sessionDerivedEndDate !== String(klass.sessionDerivedEndDate || "")) {
    patch.sessionDerivedEndDate = bounds.sessionDerivedEndDate;
    patch.sessionDerivedEndDateSyncedAt = serverTimestamp();
  }

  if (Object.keys(patch).length) {
    await updateDoc(classRef, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  }

  const endDate = String(klass.endDate || "");
  return {
    startDate: String(klass.startDate || ""),
    endDate,
    sessionDerivedStartDate: bounds.sessionDerivedStartDate,
    sessionDerivedEndDate: bounds.sessionDerivedEndDate,
    configuredStartDate: String(klass.configuredStartDate || klass.startDate || ""),
    configuredEndDate: String(klass.configuredEndDate || klass.endDate || ""),
    firstSession: bounds.firstSession,
    latestSession: bounds.latestSession,
  };
}
