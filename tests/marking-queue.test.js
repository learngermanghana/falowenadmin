import test from "node:test";
import assert from "node:assert/strict";
import { isResubmission, requiresDuplicateTutorVerification, shouldIncludeInIncomingQueue } from "../src/utils/markingQueue.js";

const failedScore = { score: 45, scoredAt: "2026-06-01T10:00:00Z" };

test("includes a failed assignment resubmitted after its previous score", () => {
  const row = { status: "resubmitted", isResubmission: true, attempt: 2, resubmittedAt: "2026-06-02T10:00:00Z", finalScore: 45, markingStatus: "marked" };
  assert.equal(shouldIncludeInIncomingQueue(row, failedScore), true);
});

test("hides an attempt when the latest score is not older than the submission", () => {
  const row = { status: "pending_review", submittedAt: "2026-06-01T09:00:00Z" };
  assert.equal(shouldIncludeInIncomingQueue(row, failedScore), false);
});

test("includes supported incoming statuses without a score", () => {
  for (const status of ["new", "submitted", "pending", "pending_review", "resubmitted"]) {
    assert.equal(shouldIncludeInIncomingQueue({ status, submittedAt: "2026-06-02T10:00:00Z" }), true);
  }
});

test("recognizes attempt numbers as resubmissions", () => {
  assert.equal(isResubmission({ attempt: 2 }), true);
});

test("recognizes duplicate verification flags stored on the submission", () => {
  assert.equal(requiresDuplicateTutorVerification({ raw: { duplicateScoreBlocked: true } }), true);
  assert.equal(requiresDuplicateTutorVerification({ tutorVerificationRequired: true }), true);
});

test("keeps a blocked duplicate in the tutor queue even when the saved score is newer", () => {
  const row = {
    submittedAt: "2026-06-01T09:00:00Z",
    markingStatus: "needs_review",
    raw: {
      duplicateScoreBlocked: true,
      tutorVerificationRequired: true,
    },
  };
  const newerSavedScore = { score: 78, updatedAt: "2026-06-01T10:00:00Z" };
  assert.equal(shouldIncludeInIncomingQueue(row, newerSavedScore), true);
});

test("new A1, A2 and B1 submissions stay in AI marking while their job is active", () => {
  for (const level of ["A1", "A2", "B1"]) {
    for (const status of ["pending", "marking", "needs_review", "marked"]) {
      const row = {
        level, status: "submitted", markingStatus: status,
        submittedAt: "2026-10-23T07:00:00Z",
        raw: { markingJobCreatedAt: { seconds: 1792738800 } },
      };
      assert.equal(shouldIncludeInIncomingQueue(row), false, level + " " + status);
    }
  }
});

test("missing automatic job remains visible for investigation and duplicate verification is never hidden", () => {
  const row = { level: "B1", status: "submitted", markingStatus: "pending" };
  assert.equal(shouldIncludeInIncomingQueue(row), true);
  assert.equal(shouldIncludeInIncomingQueue({ ...row, raw: {
    markingJobCreatedAt: "2026-10-23T07:00:00Z", duplicateScoreBlocked: true,
  } }), true);
});

test("new AI-controlled resubmission does not enter manual queue because an older score exists", () => {
  const row = { level: "A2", status: "resubmitted", attempt: 2,
    markingStatus: "pending", submittedAt: "2026-10-23T07:00:00Z",
    raw: { markingJobCreatedAt: "2026-10-23T07:00:00Z" } };
  assert.equal(shouldIncludeInIncomingQueue(row, { score: 35, updatedAt: "2026-10-22T12:00:00Z" }), false);
});
