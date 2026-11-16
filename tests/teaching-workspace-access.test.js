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

test("explicit page grants override role defaults for staff routes and login", async () => {
  const { canOpenStaffPage, staffPageIds } = await import("../src/utils/staffPageAccess.js");
  const claims = { staffRole: "teacher", staffLanguages: ["swahili"], staffPages: ["attendance"] };
  const pages = staffPageIds(claims.staffPages, claims.staffRole);
  assert.equal(canOpenStaffPage("/attendance/session/assigned-class", pages), true);
  assert.equal(canOpenStaffPage("/attendance/other-class", pages), false);
  assert.equal(canOpenStaffPage("/marking", pages), false);
  assert.equal(canOpenStaffPage("/teaching-slides/course/SWAHILI/day-1", pages), false);
  assert.equal(getPostLoginPath({ pathname: "/marking" }, "staff", claims), "/attendance");
  assert.equal(getPostLoginPath({ pathname: "/attendance/session/assigned-class" }, "staff", claims), "/attendance/session/assigned-class");
  assert.deepEqual(staffPageIds([], "teacher"), []);
  assert.deepEqual(staffPageIds(undefined, "reviewer"), ["marking"]);
  assert.deepEqual(staffPageIds(["attendance", "staff", "students"], "teacher"), ["attendance"]);
});

test("Music Studio is opt-in even for existing teachers", async () => {
  const { canOpenStaffPage, staffPageIds } = await import("../src/utils/staffPageAccess.js");
  assert.equal(canOpenStaffPage("/music-studio", staffPageIds(undefined, "teacher")), false);
  assert.equal(canOpenStaffPage("/music-studio", staffPageIds(["music-studio"], "teacher")), true);
  assert.equal(canOpenStaffPage("/ai-studio", staffPageIds(["music-studio"], "teacher")), false);
});
