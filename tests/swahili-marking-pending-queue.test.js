import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  filterSwahiliMarkingRows,
  getSwahiliReviewStatus,
} from "../src/utils/swahiliReviewQueue.js";

const ts = (seconds, nanoseconds = 0) => ({
  seconds, nanoseconds, toMillis: () => seconds * 1000 + nanoseconds / 1e6,
});
const row = (uid, day, submittedAt = ts(10)) => ({
  path: `users/${uid}/swahiliLessons/day-${day}`,
  studentId: uid, lessonId: `swahili-day-${day}`, submittedAt,
});
const review = (submission, status, reviewedAt = ts(20)) => ({
  studentId: submission.studentId,
  lessonId: submission.lessonId,
  submissionVersion: `${submission.submittedAt.seconds}:${submission.submittedAt.nanoseconds}`,
  status, reviewedAt,
});

test("Swahili queue hides saved reviews and needs-revision decisions but retains pending", () => {
  const pending = row("pending", 1);
  const reviewed = row("reviewed", 6);
  const revision = row("revision", 1);
  const unavailable = row("failed-read", 6);
  const all = [pending, reviewed, revision, unavailable];
  const statuses = {
    [pending.path]: "awaiting_review",
    [reviewed.path]: getSwahiliReviewStatus(reviewed, review(reviewed, "reviewed")),
    [revision.path]: getSwahiliReviewStatus(revision, review(revision, "needs_revision")),
    [unavailable.path]: "unavailable",
  };
  assert.deepEqual(filterSwahiliMarkingRows(all, statuses).map(item => item.studentId),
    ["pending", "failed-read"]);
});

test("a new Swahili submission is actionable again even when an earlier review exists", () => {
  const first = row("learner", 6, ts(10));
  const markedReview = review(first, "reviewed", ts(20));
  assert.equal(getSwahiliReviewStatus(first, markedReview), "reviewed");
  const updated = row("learner", 6, ts(30));
  assert.equal(getSwahiliReviewStatus(updated, markedReview), "awaiting_review");
  assert.deepEqual(filterSwahiliMarkingRows([updated], {
    [updated.path]: getSwahiliReviewStatus(updated, markedReview),
  }), [updated]);
  // A mismatched version also reopens an otherwise newer marked result.
  const mismatched = row("learner", 6, ts(15));
  assert.equal(getSwahiliReviewStatus(mismatched, markedReview), "awaiting_review");
});

test("incorrect learner or lesson reviews cannot hide another student's submission", () => {
  const submitted = row("student-1", 1);
  assert.equal(getSwahiliReviewStatus(submitted, { ...review(submitted, "reviewed"), studentId: "student-2" }), "awaiting_review");
  assert.equal(getSwahiliReviewStatus(submitted, { ...review(submitted, "reviewed"), lessonId: "swahili-day-6" }), "awaiting_review");
  assert.equal(getSwahiliReviewStatus(submitted, null), "awaiting_review");
});

test("Swahili marking mirrors German pending-only workflow with no duplicate marked archive", () => {
  const page = readFileSync(fileURLToPath(new URL("../src/pages/SwahiliMarkingPage.jsx", import.meta.url)), "utf8");
  const german = readFileSync(fileURLToPath(new URL("../src/pages/MarkingPage.jsx", import.meta.url)), "utf8");
  assert.match(german, /setSubmissionNotifications\(\(prev\) => prev\.filter\(\(row\) => row\.path !== selectedSubmission\.path\)\)/);
  assert.match(page, /filterSwahiliMarkingRows\(page\.rows, reviewStatuses\)/);
  assert.match(page, /onReviewSaved\?\.\(submission, status\)/);
  assert.match(page, /Its score remains in Results/);
  assert.doesNotMatch(page, /Already marked \(/);
  assert.doesNotMatch(page, /queueView/);
});
