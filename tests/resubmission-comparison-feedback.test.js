import test from "node:test";
import assert from "node:assert/strict";
import { withResubmissionComparison } from "../src/utils/resubmissionFeedback.js";

test("resubmission feedback explicitly reports an improved score", () => {
  const result = withResubmissionComparison({ finalScore: 75, feedback: "You now completed the vocabulary section. Review question 7." }, { isResubmission: true, previousScore: 33 });
  assert.match(result.feedback, /^This resubmission improved from 33% to 75%\./);
  assert.equal(result.resubmissionComparison.improved, true);
  assert.equal(result.improvementSummary, result.feedback);
});

test("resubmission feedback explicitly reports when the score did not improve", () => {
  const result = withResubmissionComparison({ finalScore: 33, feedback: "Review the missing answer." }, { attempt: 2, previous_score: 33 });
  assert.match(result.feedback, /^This resubmission did not improve the score; it remains 33%\./);
  assert.equal(result.resubmissionComparison.improved, false);
});
