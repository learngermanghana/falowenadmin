import { collection, deleteField, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";
import { assertUndoAvailable, restoreFields } from "../utils/liveClassUndo.js";

export async function undoLastScheduleChange(classId, adminId = "admin") {
  const classRef = doc(db, "classes", classId);
  const auditRef = doc(collection(db, "auditLogs"));
  await runTransaction(db, async tx => {
    const classSnap = await tx.get(classRef);
    if (!classSnap.exists()) throw new Error("Class not found.");
    const klass = classSnap.data(), undo = klass.lastScheduleUndo;
    if (!undo?.changes?.length) throw new Error("No reversible schedule change is available.");
    const allSnapshots = await Promise.all([
      ...undo.changes.map(change => tx.get(doc(db, "classSessions", change.id))),
      ...undo.changes.map(change => tx.get(doc(db, "attendance", classId, "sessions", change.id))),
    ]);
    const snapshots = allSnapshots.slice(0, undo.changes.length);
    const attendances = allSnapshots.slice(undo.changes.length).map((snap, index) => ({ ...(snap.exists() ? snap.data() : {}), id: undo.changes[index].id }));
    const sessions = snapshots.map((snap, index) => snap.exists() ? { ...snap.data(), id: undo.changes[index].id } : null).filter(Boolean);
    assertUndoAvailable(undo, klass, sessions, attendances);
    const version = Date.now(), timestamp = serverTimestamp();
    undo.changes.forEach(change => {
      tx.update(doc(db, "classSessions", change.id), { ...restoreFields(change.session, deleteField), sequence: change.sequence + 1, updatedAt: timestamp });
      tx.set(doc(db, "attendance", classId, "sessions", change.id), { ...restoreFields(change.attendance, deleteField), reminderScheduleVersion: version, updatedAt: timestamp }, { merge: true });
    });
    tx.update(classRef, { ...restoreFields(undo.klass, deleteField), lastScheduleUndo: deleteField(), sessionScheduleVersion: version, reminderScheduleVersion: version, sessionScheduleUpdatedAt: timestamp, reminderScheduleUpdatedAt: timestamp, updatedAt: timestamp });
    tx.set(doc(db, "calendarFeeds", classId), { classId, sessionScheduleVersion: version, updatedAt: timestamp }, { merge: true });
    tx.set(auditRef, { type: "live-class-schedule-undone", classId, originalAuditLogId: undo.auditLogId, affectedSessionIds: undo.changes.map(change => change.id), adminId, createdAt: timestamp });
  });
}
