import test from "node:test";
import assert from "node:assert/strict";
import { buildCampusTimedAttemptId, isMatchingCampusTimer, normalizeTimedAssignmentKey } from "../src/utils/timedAttemptLookup.js";

test("lookup uses the same deterministic ID as student Campus timed assignment", () => {
  assert.equal(buildCampusTimedAttemptId("Student_123", "a1-11"), "timed__student_123__a1-11");
  assert.equal(buildCampusTimedAttemptId("  A-UID.4 ", "B1-7.21"), "timed__a-uid.4__b1-7.21");
  assert.equal(normalizeTimedAssignmentKey(" a1-11 "), "A1-11");
});

test("lookup rejects invalid or missing identity and assignment codes", () => {
  assert.equal(buildCampusTimedAttemptId("", "A1-11"), "");
  assert.equal(buildCampusTimedAttemptId("uid", "../notes"), "");
  assert.equal(buildCampusTimedAttemptId("uid", "B2-8.1"), "");
});

test("recovered rows must be proper matching timer records", () => {
  const record = {
    id: "timed__uid__a1-11",
    assignmentKey: "A1-11",
    studentId: "uid",
    timerRecord: true,
    status: "expired",
  };
  assert.equal(isMatchingCampusTimer(record, "a1-11"), true);
  assert.equal(isMatchingCampusTimer(record, "A1-12"), false);
  assert.equal(isMatchingCampusTimer({ ...record, timerRecord: false }, "A1-11"), false);
  // Older deterministic timed records predate the explicit timerRecord flag.
  assert.equal(isMatchingCampusTimer({ ...record, timerRecord: undefined }, "A1-11"), true);
  assert.equal(isMatchingCampusTimer({ ...record, id: "other__uid__a1-11" }, "A1-11"), false);
  assert.equal(isMatchingCampusTimer({ ...record, studentId: "" }, "A1-11"), false);
});
