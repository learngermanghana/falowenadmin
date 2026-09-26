import test from "node:test";
import assert from "node:assert/strict";
import {
  isArchivedStudent,
  isTrialOrUnpaidStudent,
  resolveStudentLearningStatus,
  sortStudentsByAttention,
  summarizeStudentAttention,
} from "../src/utils/studentAttention.js";

const NOW = Date.parse("2026-09-26T12:00:00Z");

test("flags failed work ahead of inactivity and attendance", () => {
  const status = resolveStudentLearningStatus({
    name: "Student",
    level: "B1",
    latestScore: 48,
    attendanceRate: 62,
    lastActivityAt: "2026-09-20T12:00:00Z",
  }, NOW);

  assert.equal(status.attention, true);
  assert.equal(status.primaryReason.key, "needs-improvement");
  assert.deepEqual(
    status.reasons.map((reason) => reason.key),
    ["needs-improvement", "inactive", "attendance"],
  );
});

test("marks submitted work as waiting for tutor", () => {
  const status = resolveStudentLearningStatus({
    latestSubmissionStatus: "submitted",
    awaitingReview: 1,
  }, NOW);

  assert.equal(status.primaryReason.key, "waiting-for-tutor");
  assert.equal(status.awaitingReview, 1);
});

test("flags trial expiry and payment problems without creating synthetic activity", () => {
  const status = resolveStudentLearningStatus({
    status: "trial_expired",
    paymentStatus: "pending",
    balanceDue: 2800,
  }, NOW);

  assert.equal(status.primaryReason.key, "access");
  assert.equal(status.activity.inactiveDays, null);
  assert.equal(status.activity.lastActivityAt, null);
});

test("adds A1 finish attention at 80 percent or above", () => {
  const status = resolveStudentLearningStatus({
    level: "A1",
    courseCompletionPercent: 88,
  }, NOW);

  assert.equal(status.attention, true);
  assert.equal(status.reasons.some((reason) => reason.key === "a1-finish"), true);
});

test("does not flag a healthy student when no risk signal exists", () => {
  const status = resolveStudentLearningStatus({
    level: "A2",
    latestScore: 74,
    attendanceRate: 92,
    completionPercent: 45,
    lastActivityAt: "2026-09-26T08:00:00Z",
  }, NOW);

  assert.equal(status.attention, false);
  assert.deepEqual(status.reasons, []);
});

test("separates trials/unpaid from archived students", () => {
  assert.equal(isTrialOrUnpaidStudent({ paymentStatus: "partial", balanceDue: 400 }), true);
  assert.equal(isTrialOrUnpaidStudent({ status: "trial_expired", balanceDue: 2800 }), true);
  assert.equal(isArchivedStudent({ status: "archived" }), true);
  assert.equal(isTrialOrUnpaidStudent({ status: "archived", balanceDue: 500 }), false);
});

test("attention queue excludes archived students and sorts urgent cases first", () => {
  const rows = sortStudentsByAttention([
    { id: "inactive", name: "Inactive", lastActivityAt: "2026-09-18T12:00:00Z" },
    { id: "failed", name: "Failed", latestScore: 40 },
    { id: "archived", name: "Archived", status: "archived", latestScore: 20 },
  ], NOW);

  assert.deepEqual(rows.map(({ student }) => student.id), ["failed", "inactive"]);
});

test("summary counts reasons from the already-loaded student array", () => {
  const summary = summarizeStudentAttention([
    { id: "a", latestScore: 55 },
    { id: "b", latestSubmissionStatus: "submitted", awaitingReview: 1 },
    { id: "c", lastActivityAt: "2026-09-20T12:00:00Z" },
    { id: "d", attendanceRate: 60 },
  ], NOW);

  assert.equal(summary.total, 4);
  assert.equal(summary.needsImprovement, 1);
  assert.equal(summary.waitingForTutor, 1);
  assert.equal(summary.inactive, 1);
  assert.equal(summary.lowAttendance, 1);
});
