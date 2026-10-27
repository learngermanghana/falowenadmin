import test from "node:test";
import assert from "node:assert/strict";
import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };

const REQUIRED_WRITING = new Set([
  "A2-1.1", "A2-1.3", "A2-2.4", "A2-3.6", "A2-3.7", "A2-4.9",
  "A2-4.10", "A2-5.12", "A2-5.13", "A2-6.15", "A2-6.16", "A2-7.18",
  "A2-7.20", "A2-8.21", "A2-8.22", "A2-9.24", "A2-10.26", "A2-10.28",
]);
const NO_WRITING = new Set([
  "A2-1.2", "A2-2.5", "A2-3.8", "A2-4.11", "A2-5.14", "A2-6.17",
  "A2-7.19", "A2-9.23", "A2-9.25", "A2-10.27",
]);

const byId = Object.fromEntries(
  Object.values(answersDictionary)
    .filter((entry) => /^A2-/.test(entry.assignment_id || ""))
    .map((entry) => [entry.assignment_id, entry]),
);

test("A2 uses the 18-day required Schreiben cadence", () => {
  for (const assignmentId of REQUIRED_WRITING) {
    const entry = byId[assignmentId];
    assert.ok(entry, assignmentId);
    assert.ok(entry.expectedParts?.includes("teil2"), assignmentId);
    assert.ok(entry.writingParts?.includes("teil2"), assignmentId);
    assert.ok(entry.aiGradedParts?.includes("teil2"), assignmentId);
  }

  for (const assignmentId of NO_WRITING) {
    const entry = byId[assignmentId];
    assert.ok(entry, assignmentId);
    assert.ok(!entry.expectedParts?.includes("teil2"), assignmentId);
    assert.ok(!entry.writingParts?.includes("teil2"), assignmentId);
    assert.ok(!entry.aiGradedParts?.includes("teil2"), assignmentId);
    assert.equal(entry.partGrading?.teil2, undefined, assignmentId);
  }
});
