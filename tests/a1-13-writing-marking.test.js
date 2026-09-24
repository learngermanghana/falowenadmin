import test from "node:test";
import assert from "node:assert/strict";

import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { autoMarkSubmission } from "../src/utils/autoMarking.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { assignmentHasScoredWriting, enforceRegisteredWritingScore } from "../src/utils/naturalMarkingFeedback.js";

const MOMODOU_SUBMISSION = `TEIL 1
1. A
2. B
3.A
4.A
5.B
6.B

TEIL 2
1. A
2. B
3. B

TEIL 3

Liebe Bina,

ich hoffe, es geht dir gut? Vielen Dank für die Einladung zu deiner Hochzeit. Ich schreibe dir, weil ich leider nicht zu deiner Hochzeit kommen kann. Es kann keine Flüge buchen, weil es einen starken Sturm mit viel Schnee geben wird. Vielleicht können wir uns nächste Woche treffen? Ich wünsche euch einen wunderschönen Tag!momodou`;

function a113Reference() {
  return Object.values(answersDictionary).find((entry) => String(entry?.assignment_id || "").toUpperCase() === "A1-13");
}

test("A1-13 keeps the nine objective answers deterministic", () => {
  const referenceEntry = a113Reference();
  assert.ok(referenceEntry, "A1-13 reference entry must exist");

  const result = computeObjectiveScore(referenceEntry, MOMODOU_SUBMISSION);
  assert.equal(result.correctCount, 9);
  assert.equal(result.totalCount, 9);
});

test("A1-13 explicitly registers Teil 3 as AI-scored Schreiben", () => {
  const referenceEntry = a113Reference();

  assert.deepEqual(referenceEntry.expectedParts, ["main", "teil3"]);
  assert.deepEqual(referenceEntry.referenceAnswerParts, ["main"]);
  assert.deepEqual(referenceEntry.writingParts, ["teil3"]);
  assert.deepEqual(referenceEntry.aiGradedParts, ["teil3"]);
  assert.equal(referenceEntry.partGrading?.teil3?.gradingMode, "ai_written_response");
  assert.match(referenceEntry.partGrading?.teil3?.instruction || "", /wedding/i);
  assert.match(referenceEntry.partGrading?.teil3?.instruction || "", /weather reason/i);
  assert.match(referenceEntry.partGrading?.teil3?.instruction || "", /suggestion/i);
  assert.equal(assignmentHasScoredWriting(referenceEntry), true);
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
    objectiveCorrect: 9,
    objectiveTotal: 9,
    writingScore: 74,
    writingScorePercent: 74,
    finalScore: 87,
    score: 87,
  }, referenceEntry);

  assert.equal(result.writingScore, 74);
  assert.equal(result.writingScorePercent, 74);
  assert.equal(result.finalScore, 87);
});
