import test from "node:test";
import assert from "node:assert/strict";
import { isNonMarkablePracticeSubmission, shouldIncludeInIncomingQueue } from "../src/utils/markingQueue.js";

const timestamp = "2026-10-10T08:00:00Z";
const basic = { submittedAt: timestamp, status: "submitted", markingStatus: "pending" };

test("exclude A1 Day 6 self-practice and anonymous A1 practice posts from tutor queue", () => {
  const practice = { ...basic, level: "A1", assignmentId: "A1-2.3", path: "submissions/a1-self-practice", raw: {} };
  const unassignedPost = { ...basic, level: "A1", assignmentId: "", path: "classes/A1/posts/random", raw: {} };
  assert.equal(isNonMarkablePracticeSubmission(practice), true);
  assert.equal(shouldIncludeInIncomingQueue(practice), false);
  assert.equal(shouldIncludeInIncomingQueue(unassignedPost), false);
});

test("preserve real tutor-marked A1 work, A2 writing and A1 explicit tutor verification", () => {
  const a1Marked = { ...basic, level: "A1", assignmentId: "A1-9", path: "submissions/a1-9", raw: {} };
  const a2 = { ...basic, level: "A2", assignmentId: "A2-9.24", path: "submissions/a2-9.24", raw: {} };
  const explicit = { ...basic, level: "A1", assignmentId: "A1-2.3", raw: { requiresTutorMarking: true } };
  assert.equal(shouldIncludeInIncomingQueue(a1Marked), true);
  assert.equal(shouldIncludeInIncomingQueue(a2), true);
  assert.equal(shouldIncludeInIncomingQueue(explicit), true);
});

test("source metadata can identify other self-practice activities without broad A1 bans", () => {
  assert.equal(isNonMarkablePracticeSubmission({raw:{activityType:"self-practice"}}),true);
  assert.equal(isNonMarkablePracticeSubmission({raw:{requiresTutorMarking:false}}),true);
  assert.equal(isNonMarkablePracticeSubmission({level:"B1",assignmentId:"B1-9",raw:{}}),false);
});
