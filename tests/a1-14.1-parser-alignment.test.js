import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { autoMarkSubmission, checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

const submission = `
Teil 1
1. B
2. B
3. A
4. A
5. B
Teil 2
1. R
2. R
3. R
4. R
5. F

Teil 3
1. A
2. B
3. A
4. A
5. B
6. A
`;

test("A1-14.1 scores reading and new doctor-practice listening including the appointment email", () => {
  const result = computeObjectiveScore("A1-14.1", submission);

  assert.equal(result.totalCount, 16);
  assert.equal(result.correctCount, 16);
  assert.equal(result.details["teil1.1"].student, "B");
  assert.equal(result.details["teil1.5"].correct, true);
  assert.equal(result.details["teil3.1"].student, "A");
  assert.equal(result.details["teil3.6"].student, "A");
  assert.equal(result.details["teil2.5"].correct, true);
});

test("health Teil 2 R/F answers are objective, including full UI labels and the negative statement", () => {
  const entry = answersDictionary["A1 Health and Body Parts 14.1"];
  const fullLabels = submission.replace(/\. R\n/g, ". Richtig\n").replace("5. F", "5. Falsch");
  const result = checkDeterministicObjectiveAnswers({ referenceEntry: entry, submissionText: fullLabels });
  assert.equal(result.objectiveCorrect, 16);
  assert.equal(result.objectiveTotal, 16);
  const wrong = computeObjectiveScore("A1-14.1", fullLabels.replace("5. Falsch", "5. Richtig"));
  assert.equal(wrong.correctCount, 15);
  assert.equal(wrong.details["teil2.5"].correct, false);
  const marked = autoMarkSubmission({ referenceEntry: entry, submissionText: fullLabels,
    aiWritingMarker: () => { throw new Error("Appointment reading must not call the writing marker"); } });
  assert.equal(marked.objectiveTotal, 16);
  assert.equal(marked.objectiveCorrect, 16);
  assert.equal(marked.parts.every((part) => part.partType === "objective"), true);
});

test("A1-14.1 quoted choice letters still match the current objective-only key", () => {
  const quoted = submission.replace(/\. ([AB])(?=\n|$)/g, '. "$1"');
  const result = computeObjectiveScore("A1-14.1", quoted);
  assert.equal(result.correctCount, 16);
  assert.equal(result.totalCount, 16);
});
