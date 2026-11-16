import test from "node:test";
import assert from "node:assert/strict";
import { dateOf, presentFor, held, participationFor } from "../api/weekly-engagement-summary.js";

test("weekly digest counts only held classes and verified attendance", () => {
  assert.equal(held({ status: "cancelled", opened: true }), false);
  assert.equal(held({ status: "scheduled" }), false);
  assert.equal(held({ opened: true }), true);
  const student = { studentCode: "FLW-123", email: "student@example.com" };
  assert.equal(presentFor({ attendance: { "FLW-123": { present: true } } }, student), true);
  assert.equal(presentFor({ students: { "FLW-123": { status: "absent" } } }, student), false);
  assert.equal(presentFor({ records: [{ studentCode: "FLW-123", status: "late" }] }, student), true);
});

test("weekly digest only uses matching class, student and week participation records", () => {
  const student = { email: "student@example.com", studentCode: "FLW-123" };
  const rows = [
    { classId: "class-a", studentEmailNormalized: "student@example.com", sessionDate: "2026-11-16", classSessionId: "session-1", turns: 4, correct: 3, needsReview: 1 },
    { classId: "class-a", studentEmailNormalized: "other@example.com", sessionDate: "2026-11-16", classSessionId: "session-2", turns: 9, correct: 9 },
    { classId: "class-b", studentEmailNormalized: "student@example.com", sessionDate: "2026-11-16", classSessionId: "session-3", turns: 9 },
    { classId: "class-a", studentEmailNormalized: "student@example.com", sessionDate: "2026-11-01", classSessionId: "session-4", turns: 9 },
  ];
  assert.deepEqual(participationFor(rows, student, "class-a", "2026-11-16", "2026-11-22"), {
    participatedSessions: 1, turns: 4, correct: 3, needsReview: 1,
  });
  assert.equal(dateOf("2026-11-16"), "2026-11-16");
});
