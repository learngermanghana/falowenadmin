import test from "node:test";
import assert from "node:assert/strict";
import { getAdminRole, getPostLoginPath, isTeachingWorkspace } from "../src/utils/authRoles.js";
import { canonicalSwahiliSubmission, getSwahiliReviewStatus, swahiliReviewDocId } from "../src/utils/swahiliReviewQueue.js";

test("verified legacy accounts and individually assigned staff have distinct access from learner accounts", () => {
  assert.equal(getAdminRole({ email: "staff@falowen.app" }), null);
  assert.equal(getAdminRole({ email: "staff@falowen.app", email_verified: true }), "staff");
  assert.equal(getAdminRole({ role: "tutor" }), "staff");
  assert.equal(getAdminRole({ admin: true, staff: true }), "admin");
  assert.equal(getAdminRole({ role: "student" }), null);
  assert.equal(getPostLoginPath({ pathname: "/students" }, "staff"), "/marking");
  assert.equal(getPostLoginPath({ pathname: "/marking", search: "?language=swahili" }, "staff"), "/marking?language=swahili");
  assert.equal(getPostLoginPath({ pathname: "//example.com" }, "admin"), "/");
  assert.equal(isTeachingWorkspace("/teaching-slides/course/SWAHILI/swahili-day-6"), true);
  assert.equal(isTeachingWorkspace("/teaching-slides-studio"), false);
  assert.equal(isTeachingWorkspace("/marking/answer-keys"), false);
});

test("Swahili queue binds identity to the learner path and distinguishes resubmitted work", () => {
  const row = { program: "swahili", lessonId: "swahili-day-6", status: "submitted", submittedAt: { toMillis: () => 50 } };
  const snapshot = (path, data = row) => ({ ref: { path }, data: () => data });
  const path = "users/learner/swahiliLessons/day-6";
  assert.equal(canonicalSwahiliSubmission(snapshot("submissions/german"), 6), null);
  assert.equal(canonicalSwahiliSubmission(snapshot(path, { ...row, studentId: "someone-else" }), 6), null);
  assert.equal(canonicalSwahiliSubmission(snapshot(path), 1), null);
  const submission = canonicalSwahiliSubmission(snapshot(path), 6);
  assert.equal(submission.studentId, "learner");
  assert.equal(swahiliReviewDocId("learner", 6), "learner_day-6");
  const review = { studentId: "learner", lessonId: row.lessonId, status: "reviewed" };
  assert.equal(getSwahiliReviewStatus(submission, { ...review, reviewedAt: { toMillis: () => 49 } }), "awaiting_review");
  assert.equal(getSwahiliReviewStatus(submission, { ...review, reviewedAt: { toMillis: () => 51 } }), "reviewed");
});
