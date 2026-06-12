import test from "node:test";
import assert from "node:assert/strict";
import { isResubmission, shouldIncludeInIncomingQueue } from "../src/utils/markingQueue.js";

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
