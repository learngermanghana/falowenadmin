import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";
import * as base from "./liveClassServiceBase.js";

async function markClassScheduleTouched(classId, sessionId, payload = {}) {
  await updateDoc(doc(db, "classes", String(classId)), {
    lastSessionChangeType: "cancelled",
    lastChangedSessionId: String(sessionId),
    lastSessionChangeReason: String(payload.reason || "").trim(),
    lastCancelledSessionId: String(sessionId),
    lastCancelledAt: serverTimestamp(),
    sessionScheduleVersion: Date.now(),
    sessionScheduleUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(() => {});
}

export async function cancelSession(sessionId, payload) {
  const sessionSnap = await getDoc(doc(db, "classSessions", String(sessionId)));
  if (!sessionSnap.exists()) throw new Error("Session not found");

  const session = { id: sessionSnap.id, ...sessionSnap.data() };
  const result = await base.cancelSession(sessionId, payload);
  const classId = String(result?.classId || session.classId || session.classRecordId || "").trim();

  if (classId) {
    await syncClassEndDateFromSessions(classId).catch(() => {});
    await markClassScheduleTouched(classId, sessionId, payload);
  }

  return {
    ...result,
    classId,
    sessionId,
    status: "cancelled",
  };
}
