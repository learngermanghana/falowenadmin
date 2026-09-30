import test from "node:test";
import assert from "node:assert/strict";
import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };

const REQUIRED_WRITING = new Set([
  "B1-1.1", "B1-1.3", "B1-2.4", "B1-2.6", "B1-3.8", "B1-3.9",
  "B1-4.12", "B1-4.13", "B1-5.14", "B1-5.16", "B1-6.18", "B1-6.20",
  "B1-7.21", "B1-7.23", "B1-8.24", "B1-9.26", "B1-10.27", "B1-10.28",
]);
const NO_WRITING = new Set([
  "B1-1.2", "B1-2.5", "B1-3.7", "B1-4.10", "B1-4.11",
  "B1-5.15", "B1-5.17", "B1-6.19", "B1-7.22", "B1-8.25",
]);

const byId = Object.fromEntries(
  Object.values(answersDictionary)
    .filter((entry) => /^B1-/.test(entry.assignment_id || ""))
    .map((entry) => [entry.assignment_id, entry]),
);

test("B1 uses the 18-day required Schreiben cadence", () => {
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
