import test from "node:test";
import assert from "node:assert/strict";

import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { autoMarkSubmission, checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { assignmentHasScoredWriting, enforceRegisteredWritingScore } from "../src/utils/naturalMarkingFeedback.js";
import { getA1WritingTaskSpec } from "../src/data/a1WritingTaskSpecs.js";

const MOMODOU_SUBMISSION = `TEIL 1
1. B
2. A
3. A
4. A
5. B

TEIL 2
1. R
2. F
3. F
4. R
5. F

TEIL 3

Liebe Bina,

ich hoffe, es geht dir gut? Vielen Dank für die Einladung zu deiner Hochzeit. Ich schreibe dir, weil ich leider nicht zu deiner Hochzeit kommen kann. Es kann keine Flüge buchen, weil es einen starken Sturm mit viel Schnee geben wird. Vielleicht können wir uns nächste Woche treffen? Ich wünsche euch einen wunderschönen Tag!momodou\n\nTEIL 4\n1. B\n2. A\n3. B\n4. A\n5. B\n6. C`;

function a113Reference() {
  return Object.values(answersDictionary).find((entry) => String(entry?.assignment_id || "").toUpperCase() === "A1-13");
}

test("A1-13 keeps all sixteen objective answers deterministic", () => {
  const referenceEntry = a113Reference();
  assert.ok(referenceEntry, "A1-13 reference entry must exist");

  const result = computeObjectiveScore(referenceEntry, MOMODOU_SUBMISSION);
  assert.equal(result.correctCount, 16);
  assert.equal(result.totalCount, 16);
  const deterministic = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText: MOMODOU_SUBMISSION });
  assert.equal(deterministic.objectiveCorrect, 16);
  assert.equal(deterministic.objectiveTotal, 16);
  assert.equal(deterministic.parts.some((part) => part.partId === "teil3"), false);
  const wrong = computeObjectiveScore(referenceEntry, MOMODOU_SUBMISSION.replace("2. F", "2. R"));
  assert.equal(wrong.correctCount, 15);
  assert.equal(wrong.details["teil2.2"].correct, false);
});

test("A1-13 explicitly registers Teil 3 as AI-scored Schreiben", () => {
  const referenceEntry = a113Reference();

  assert.deepEqual(referenceEntry.expectedParts, ["teil1", "teil2", "teil3", "teil4"]);
  assert.deepEqual(referenceEntry.referenceAnswerParts, ["teil1", "teil2", "teil4"]);
  assert.deepEqual(referenceEntry.writingParts, ["teil3"]);
  assert.deepEqual(referenceEntry.aiGradedParts, ["teil3"]);
  assert.equal(referenceEntry.partGrading?.teil3?.gradingMode, "ai_written_response");
  assert.match(referenceEntry.partGrading?.teil3?.instruction || "", /wedding/i);
  assert.match(referenceEntry.partGrading?.teil3?.instruction || "", /weather reason/i);
  assert.match(referenceEntry.partGrading?.teil3?.instruction || "", /suggestion/i);
  assert.equal(assignmentHasScoredWriting(referenceEntry), true);
});

test("A1-13 is the second letter-writing step with exactly three content points", () => {
  const spec = getA1WritingTaskSpec("A1-13");
  const referenceEntry = a113Reference();

  assert.ok(spec);
  assert.equal(spec.letterWriting, true);
  assert.match(spec.taskText, /Second A1 letter-writing step after A1-12\.3/i);
  assert.equal(spec.taskPoints.length, 3);
  assert.ok(spec.taskPoints.some((point) => /cannot come/i.test(point)));
  assert.ok(spec.taskPoints.some((point) => /weather reason/i.test(point)));
  assert.ok(spec.taskPoints.some((point) => /suggestion/i.test(point)));
  assert.ok(spec.taskPoints.every((point) => !/greeting|closing|name/i.test(point)));
  assert.match(referenceEntry.partGrading?.teil3?.instruction || "", /exactly three content points/i);
  assert.match(referenceEntry.partGrading?.teil3?.instruction || "", /do not count them as extra task points/i);
  assert.match(referenceEntry.partGrading?.teil3?.instruction || "", /neutral weather description alone is not enough/i);
});

test("objective-only A1 assignments remain objective-only", () => {
  const referenceEntry = Object.values(answersDictionary)
    .find((entry) => String(entry?.assignment_id || "").toUpperCase() === "A1-0.1");
  assert.ok(referenceEntry, "A1-0.1 reference entry must exist");
  assert.equal(assignmentHasScoredWriting(referenceEntry), false);
});

test("A1-13 routes Teil 3 to the writing marker instead of objective marking", () => {
  const referenceEntry = a113Reference();
  const calls = [];

  const result = autoMarkSubmission({
    referenceEntry,
    submission: { assignmentKey: "A1-13", level: "A1" },
    submissionText: MOMODOU_SUBMISSION,
    aiWritingMarker: ({ level, partId, text }) => {
      calls.push({ level, partId, text });
      return {
        score: 74,
        passed: true,
        confidence: 0.9,
        feedback: "Task complete, but grammar accuracy needs work.",
        corrections: [{ partId, submitted: "Es kann keine Flüge buchen", suggestion: "Ich kann keine Flüge buchen" }],
        improvementSummary: "Correct subject-verb agreement and keep the informal email form.",
      };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].level, "A1");
  assert.equal(calls[0].partId, "teil3");
  assert.match(calls[0].text, /Liebe Bina/);
  assert.equal(result.writingScore, 74);
  assert.ok(result.parts.some((part) => part.partId === "teil3" && part.partType === "writing"));
});

test("registered Teil 3 writing score is not erased by objective-only safeguards", () => {
  const referenceEntry = a113Reference();
  const result = enforceRegisteredWritingScore({
    objectiveScore: 100,
    objectiveCorrect: 16,
    objectiveTotal: 16,
    writingScore: 74,
    writingScorePercent: 74,
    finalScore: 87,
    score: 87,
  }, referenceEntry);

  assert.equal(result.writingScore, 74);
  assert.equal(result.writingScorePercent, 74);
  assert.equal(result.finalScore, 87);
});
