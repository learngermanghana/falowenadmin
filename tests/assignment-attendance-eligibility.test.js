import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  hasMeaningfulSubmissionWork,
  assignmentAttendanceEligibility,
} = require("../functions/assignmentAttendanceEligibility.js");

test("accepts genuine written work", () => {
  assert.equal(hasMeaningfulSubmissionWork({ submissionText: "Meine Antwort ist A." }), true);
});

test("accepts objective answers including false and zero", () => {
  assert.equal(hasMeaningfulSubmissionWork({ answers: { q1: "B" } }), true);
  assert.equal(hasMeaningfulSubmissionWork({ objectiveAnswers: { q1: false, q2: 0 } }), true);
});

test("accepts uploaded or recorded work", () => {
  assert.equal(hasMeaningfulSubmissionWork({ attachments: [{ downloadURL: "https://files.example/work.pdf" }] }), true);
  assert.equal(hasMeaningfulSubmissionWork({ audioUrl: "https://files.example/answer.webm" }), true);
});

test("rejects empty, whitespace-only, punctuation-only, and metadata-only submissions", () => {
  assert.equal(hasMeaningfulSubmissionWork({ submissionText: "" }), false);
  assert.equal(hasMeaningfulSubmissionWork({ answer: "   " }), false);
  assert.equal(hasMeaningfulSubmissionWork({ workContent: "... !!! —" }), false);
  assert.equal(hasMeaningfulSubmissionWork({ assignmentKey: "A1-1", studentCode: "ST001" }), false);
});

test("rejects non-final submission statuses", () => {
  for (const status of ["draft", "deleted", "rejected"]) {
    assert.deepEqual(assignmentAttendanceEligibility({ status, answer: "A" }), {
      eligible: false,
      reason: `submission_${status}`,
    });
  }
});

test("a low score does not affect eligibility", () => {
  assert.deepEqual(assignmentAttendanceEligibility({ answer: "A", score: 0 }), {
    eligible: true,
    reason: "eligible",
  });
});
