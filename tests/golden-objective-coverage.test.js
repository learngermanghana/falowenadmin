import test from "node:test";
import assert from "node:assert/strict";
import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };

import { computeObjectiveScore, getReferenceAnswers } from "../src/utils/objectiveMarking.js";

function canonicalSubmission(referenceAnswers, marker = ".") {
  return Object.entries(referenceAnswers)
    .map(([number, answer]) => `${number}${marker} ${String(answer)}`)
    .join("\n");
}

test("every objective assignment key accepts its canonical perfect submission", () => {
  const covered = [];
  const failures = [];

  for (const assignmentId of Object.keys(answersDictionary || {})) {
    const referenceAnswers = getReferenceAnswers(assignmentId);
    if (!referenceAnswers || !Object.keys(referenceAnswers).length) continue;

    const expectedTotal = Object.keys(referenceAnswers).length;
    const variants = [canonicalSubmission(referenceAnswers, "."), canonicalSubmission(referenceAnswers, ")")];
    for (const [variantIndex, submission] of variants.entries()) {
      const result = computeObjectiveScore(assignmentId, submission);
      if (result.totalCount !== expectedTotal || result.correctCount !== expectedTotal) {
        failures.push({
          assignmentId,
          variant: variantIndex + 1,
          expectedTotal,
          actualTotal: result.totalCount,
          correctCount: result.correctCount,
        });
      }
    }
    covered.push(assignmentId);
  }

  assert.equal(covered.length > 0, true, "No objective assignments were discovered in answers_dictionary.json");
  assert.deepEqual(failures, [], `Canonical objective goldens failed:\n${JSON.stringify(failures, null, 2)}`);
});
