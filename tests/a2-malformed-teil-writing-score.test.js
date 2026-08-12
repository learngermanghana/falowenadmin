import test from "node:test";
import assert from "node:assert/strict";

import { recoverZeroWritingScore, reconcileFinalDeterministicFeedback } from "../src/utils/finalDeterministicFeedback.js";

const DIANA_SUBMISSION = `Liebe Anna,

wie geht es dir? Ich hoffe, dir geht es gut. Ich möchte dich gern zum Mittagessen einladen, weil wir uns lange nicht gesehen haben.

Wir treffen uns am Samstag, den 15. August, um 13 Uhr im Restaurant „Bella“. Ich freue mich sehr, dich zu sehen und mit dir zu essen.

Du musst nichts mitbringen. Ich möchte dich zum Essen einladen. Bitte komm pünktlich.

Liebe Grüße
Diana
   Teil 
1.C
2.A
3.C
4.B
5.C`;

test("A2 writing is not allowed to collapse to zero when a complete letter precedes a malformed bare Teil objective boundary", () => {
  const recovered = recoverZeroWritingScore({
    studentName: "Diana Esi Atteh",
    level: "A2",
    assignmentKey: "A2-8.22",
    objectiveScore: 80,
    objectiveCorrect: 4,
    objectiveTotal: 5,
    writingScore: 0,
    writingScorePercent: 0,
    finalScore: 40,
    score: 40,
    status: "marked",
  }, DIANA_SUBMISSION);

  assert.ok(recovered.writingScore >= 60, `expected a non-zero A2 writing score, got ${recovered.writingScore}`);
  assert.ok(recovered.finalScore > 40, `final score should recover from the false 40, got ${recovered.finalScore}`);
  assert.equal(recovered.status, "needs_review");
  assert.equal(recovered.shouldSendAutomatically, false);
  assert.equal(recovered.ai.recoveredZeroWritingScore, true);
});

test("deterministic objective reconciliation preserves 4/5 and recovers the writing score for A2-8.22", () => {
  const result = reconcileFinalDeterministicFeedback({
    studentName: "Diana Esi Atteh",
    level: "A2",
    assignmentKey: "A2-8.22",
    writingScore: 0,
    writingScorePercent: 0,
    finalScore: 40,
    score: 40,
    feedback: "A useful start, Diana Esi Atteh.",
    status: "marked",
  }, {
    totalCount: 5,
    correctCount: 4,
    details: {
      "teil3.1": { partId: "teil3", questionNumber: 1, correct: true, student: "C", expected: "C" },
      "teil3.2": { partId: "teil3", questionNumber: 2, correct: false, student: "A", expected: "B" },
      "teil3.3": { partId: "teil3", questionNumber: 3, correct: true, student: "C", expected: "C" },
      "teil3.4": { partId: "teil3", questionNumber: 4, correct: true, student: "B", expected: "B" },
      "teil3.5": { partId: "teil3", questionNumber: 5, correct: true, student: "C", expected: "C" },
    },
  }, DIANA_SUBMISSION);

  assert.equal(result.objectiveScore, 80);
  assert.equal(result.objectiveCorrect, 4);
  assert.equal(result.objectiveTotal, 5);
  assert.ok(result.writingScore >= 60);
  assert.ok(result.finalScore >= 70);
  assert.notEqual(result.finalScore, 40);
  assert.equal(result.status, "needs_review");
  assert.match(result.feedback, /review 2|review question 2/i);
});

test("a genuine empty A2 writing response is not recovered", () => {
  const result = recoverZeroWritingScore({
    level: "A2",
    assignmentKey: "A2-8.22",
    objectiveScore: 80,
    writingScore: 0,
    finalScore: 40,
  }, `Teil\n1.C\n2.A\n3.C\n4.B\n5.C`);

  assert.equal(result.writingScore, 0);
  assert.equal(result.finalScore, 40);
  assert.equal(result.ai?.recoveredZeroWritingScore, undefined);
});
