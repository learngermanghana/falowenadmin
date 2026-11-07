import test from "node:test";
import assert from "node:assert/strict";
import { manualMarkingLessons, manualScorePayload, matchingManualSubmissions } from "../src/utils/manualMarking.js";
const student = { id: "test-student", studentCode: "TEST-001", name: "Test Student", level: "B1" };
const lesson = manualMarkingLessons("B1").find((row) => row.day === 19);

test("manual marking resolves B1 Day 19 to canonical assignment and reference", () => {
  assert.equal(lesson.assignmentId, "B1-6.19");
  assert.equal(lesson.reference.assignmentKey, "B1-6.19");
  const a1 = manualMarkingLessons("A1").find((row) => row.assignmentId === "A1-11");
  assert.equal(a1.day, 17);
});
test("manual save does not require a submission and binds score to exact student and lesson", () => {
  const payload = manualScorePayload({ student, lesson, score: "89", feedback: "Clear ideas and accurate language." });
  assert.equal(payload.studentCode, "TEST-001");
  assert.equal(payload.assignmentId, "B1-6.19");
  assert.equal(payload.score, 89);
  assert.equal(payload.blockAnyDuplicate, true);
  assert.equal(payload.requireAllTargets, true);
  assert.equal(payload.source, "manual-external-work");
  assert.equal(Object.hasOwn(payload, "submissionPath"), false);
  assert.equal(Object.hasOwn(payload, "submissionText"), false);
});
test("manual save rejects missing identity, invalid reference, empty feedback and invalid marks", () => {
  const base = { student, lesson, score: "89", feedback: "Good work." };
  for (const change of [{ student: null }, { student: { name: "Test" } }, { lesson: { level: "B1", assignmentId: "B1-999" } },
    { score: "" }, { score: "0" }, { score: "101" }, { score: "12.5" }, { score: "NaN" }, { feedback: " " }]) {
    assert.throws(() => manualScorePayload({ ...base, ...change }));
  }
});
test("optional retrieval never substitutes another day or another assignment suffix", () => {
  const rows = [{ id: "right", assignmentId: "B1-6.19" }, { id: "wrong", assignmentId: "B1-6.18" },
    { id: "prefix", assignmentId: "B1-6.190" }, { id: "legacy", assignment: "B1-6.19 · Interview" }];
  assert.deepEqual(matchingManualSubmissions(rows, "B1-6.19").map((row) => row.id), ["right", "legacy"]);
});
