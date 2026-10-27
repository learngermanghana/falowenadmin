import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

execFileSync(process.execPath, ["scripts/patchGroundedWritingFeedback.mjs"], { stdio: "inherit" });
const { buildNaturalStudentFeedback } = await import("../src/utils/naturalMarkingFeedback.js");

const MAX_SUBMISSION = `Teil 2
Lieber Herr Asadu,

ich möchte Sie zu einem gemeinsamen Wochenende einladen, weil ich gern Zeit mit Ihnen verbringen möchte. Wir können zusammen essen und spazieren gehen. Wann haben Sie Zeit? Wo sollen wir uns treffen? Könnten Sie bitte etwas für unser Abendessen mitbringen, zum Beispiel Brot, Getränke oder einen Salat? Ich freue mich auf Ihre Antwort.

Viele Grüße
Max

Teil 3
1. B
2. D
3. A
4. D
5. B

Teil 4
1. B
2. B
3. B
4. C
5. A`;

function result(overrides = {}) {
  return {
    studentName: "Max",
    level: "A2",
    assignmentKey: "A2-2.4",
    objectiveScore: 90,
    objectiveCorrect: 9,
    objectiveTotal: 10,
    writingScore: 72,
    finalScore: 81,
    hasRegisteredWriting: true,
    objectiveDetails: {
      "teil3.1": { partId: "teil3", correct: true },
      "teil3.2": { partId: "teil3", correct: true },
      "teil3.3": { partId: "teil3", correct: true },
      "teil3.4": { partId: "teil3", correct: true },
      "teil3.5": { partId: "teil3", correct: true },
      "teil4.1": { partId: "teil4", correct: true },
      "teil4.2": { partId: "teil4", correct: true },
      "teil4.3": { partId: "teil4", correct: false },
      "teil4.4": { partId: "teil4", correct: true },
      "teil4.5": { partId: "teil4", correct: true },
    },
    wrongAnswers: [{ partId: "teil4", question: 3 }],
    writingStrengths: ["The invitation is clear and polite and asks about time and place"],
    taskCompletion: { completed: 4, total: 4, missing: [] },
    ...overrides,
  };
}

test("hallucinated article correction is removed when quoted wording is not in the student's writing", () => {
  const feedback = buildNaturalStudentFeedback(result({
    nextStep: "Focus on using the correct articles in German, such as ‘ein’ instead of ‘eine’ for masculine nouns.",
    aiOriginalFeedback: "Focus on using the correct articles in German, such as ‘ein’ instead of ‘eine’ for masculine nouns.",
  }), MAX_SUBMISSION);

  assert.doesNotMatch(feedback, /‘ein’ instead of ‘eine’|correct articles|masculine nouns/i);
  assert.match(feedback, /Teil 3.*all answers correct|Teil 4.*review.*3/i);
});

test("a corrective next step survives when it quotes wording that actually appears in the submission", () => {
  const feedback = buildNaturalStudentFeedback(result({
    nextStep: "Avoid repeating ‘Ich freue mich’ in a longer version; vary the expression.",
  }), MAX_SUBMISSION.replace("Ich freue mich auf Ihre Antwort.", "Ich freue mich auf Ihre Antwort. Ich freue mich auf das Wochenende."));

  assert.match(feedback, /Avoid repeating.*Ich freue mich/i);
});
