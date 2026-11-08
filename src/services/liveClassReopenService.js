import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";

export async function reopenSession(sessionId, { reason, adminId = "admin" } = {}) {
  const correctionReason = String(reason || "").trim();
  if (!correctionReason) throw new Error("Enter a reason for reopening this session.");
  const sessionRef = doc(db, "classSessions", String(sessionId));
  const auditRef = doc(collection(db, "auditLogs"));
  await runTransaction(db, async transaction => {
    const snap = await transaction.get(sessionRef);
    if (!snap.exists()) throw new Error("Session not found.");
    const session = snap.data();
    if (String(session.status || "").toLowerCase() !== "completed") {
      throw new Error("This session is no longer completed. Refresh and try again.");
    }
    const classId = String(session.classRecordId || session.classId || "").trim();
    if (!classId) throw new Error("This session is not linked to a class.");
    const classRef = doc(db, "classes", classId);
    const classSnap = await transaction.get(classRef);
    if (!classSnap.exists()) throw new Error("Class not found.");
    const timestamp = serverTimestamp();
    const patch = {
      status: "scheduled",
      completedAt: null,
      completedBy: null,
      autoCompletedAt: null,
      completionSource: "admin-reopened",
      autoCompletionSuppressed: true,
      remindersSuppressed: true,
      reopenedAt: timestamp,
      reopenedBy: adminId,
      reopenReason: correctionReason,
      sequence: Number(session.sequence || 0) + 1,
      updatedAt: timestamp,
    };
    transaction.update(sessionRef, patch);
    transaction.set(doc(db, "attendance", classId, "sessions", String(sessionId)), {
      ...patch,
      classId,
      classSessionId: String(sessionId),
      sessionStatus: "scheduled",
    }, { merge: true });
    transaction.update(classRef, { sessionScheduleVersion: Date.now(), updatedAt: timestamp });
    transaction.set(auditRef, {
      type: "live-class-session-reopened", classId, sessionId: String(sessionId),
      previousStatus: "completed", nextStatus: "scheduled",
      previousCompletedAt: session.completedAt || null,
      previousCompletedBy: session.completedBy || "",
      previousCompletionSource: session.completionSource || "",
      reason: correctionReason, adminId, createdAt: timestamp,
    });
  });
}
