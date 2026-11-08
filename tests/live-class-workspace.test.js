import test from "node:test";
import assert from "node:assert/strict";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { completionLabel, failedClassCommunications, nextTeachingSession, orderedWorkspaceSessions, scheduleChangePreview } from "../src/utils/liveClassWorkspace.js";
import { attendanceFingerprint, assertUndoAvailable, captureFields, restoreFields } from "../src/utils/liveClassUndo.js";
const groups = getCourseSessionGroups("B1");
function lesson(day, date, status = "scheduled") {
  return { id: `day-${day}`, curriculumDay: day, curriculumIndex: day + 1, topic: groups[day].topic, assignmentIds: groups[day].assignmentIds, startsAt: `${date}T07:00:00.000Z`, endsAt: `${date}T08:30:00.000Z`, status, sequence: 1 };
}
test("lesson order is independent of dates and remaining filter excludes taught/cancelled records", () => {
  const rows = [lesson(28, "2026-11-14"), lesson(26, "2026-11-29", "completed"), lesson(27, "2026-11-08", "completed")];
  assert.deepEqual(orderedWorkspaceSessions(rows, "B1", "all").map(row => row.curriculumDay), [26, 27, 28]);
  assert.deepEqual(orderedWorkspaceSessions(rows, "B1").map(row => row.curriculumDay), [28]);
  assert.equal(nextTeachingSession(rows, new Date("2026-11-08T09:00:00Z")).id, "day-28");
});
test("preview changes Day 28 only and derives its end date without rewriting history", () => {
  const rows = [lesson(27, "2026-11-29", "completed"), lesson(28, "2026-11-15")];
  const before = structuredClone(rows);
  const preview = scheduleChangePreview({ klass: { id: "b1", levelId: "B1", timezone: "Africa/Accra" }, sessions: rows, change: { sessionId: "day-28", startsAt: "2026-11-14T07:00", durationMinutes: 90, moveMode: "single" } });
  assert.equal(preview.endDate, "2026-11-14");
  assert.deepEqual(preview.changes.map(row => row.session.id), ["day-28"]);
  assert.deepEqual(rows, before);
});
test("staff and automatic completion remain distinguishable", () => {
  assert.equal(completionLabel({ status: "completed", completionSource: "automatic" }), "Completed automatically");
  assert.equal(completionLabel({ status: "completed", completedBy: "staff" }), "Completed by staff");
});
test("communication attention list only includes reported failures", () => {
  const rows = failedClassCommunications([{ id: "b1", classReminderEmailLastStatus: "failed", attendanceConfirmationEmailLastStatus: "sent" }]);
  assert.equal(rows.length, 1); assert.equal(rows[0].classId, "b1");
});
test("undo restores absent fields without losing stored values", () => {
  const snapshot = captureFields({ startsAt: "old", completedAt: null }, ["startsAt", "manualDateOverride", "completedAt"]);
  assert.deepEqual(restoreFields(snapshot, () => "DELETE"), { startsAt: "old", manualDateOverride: "DELETE", completedAt: null });
});
test("undo refuses stale versions, missing sessions, changed sequences, and taught lessons", () => {
  const undo = { version: 3, changes: [{ id: "day-28", sequence: 2 }] };
  assert.doesNotThrow(() => assertUndoAvailable(undo, { sessionScheduleVersion: 3 }, [{ id: "day-28", sequence: 2, status: "scheduled" }]));
  for (const [klass, rows] of [
    [{ sessionScheduleVersion: 4 }, [{ id: "day-28", sequence: 2 }]],
    [{ sessionScheduleVersion: 3 }, []],
    [{ sessionScheduleVersion: 3 }, [{ id: "day-28", sequence: 3 }]],
    [{ sessionScheduleVersion: 3 }, [{ id: "day-28", sequence: 2, status: "completed" }]],
  ]) assert.throws(() => assertUndoAvailable(undo, klass, rows));
});

test("undo protects attendance saved after a timetable edit", () => {
  const undo = { version: 1, changes: [{ id: "day-28", sequence: 2, attendanceFingerprint: attendanceFingerprint({ students: {} }) }] };
  assert.throws(() => assertUndoAvailable(undo, { sessionScheduleVersion: 1 }, [{ id: "day-28", sequence: 2, status: "scheduled" }], [{ id: "day-28", students: { learner: { present: true } } }]), /Attendance/);
});
