import test from "node:test";
import assert from "node:assert/strict";

import { reconcileFinalDeterministicFeedback } from "../src/utils/finalDeterministicFeedback.js";

const submission = `Herren,

ich hoffe, es geht Ihnen gut.

Ich schreibe Ihnen, weil ich einen Termin beim Arzt bekommen möchte. Wann kann ich zu Ihnen kommen?

Ich möchte auch wissen, wie viel die Behandlung kostet. Zahlt meine Krankenversicherung die Behandlung?

Welche Untersuchungen oder Behandlungen empfehlen Sie?

Ich freue mich auf Ihre Antwort.

Mit freundlichen Grüßen

Diana Atteh

Teil 3
1.B
2.A
3.B
4.C
5.A

Teil 4
1.B
2.A
3.A
4.B
5.A`;

const objectiveResult = {
  correctCount: 9,
  totalCount: 10,
  details: {
    "teil3.1": { partId: "teil3", student: "B", expected: "B", correct: true },
    "teil3.2": { partId: "teil3", student: "A", expected: "A", correct: true },
    "teil3.3": { partId: "teil3", student: "B", expected: "B", correct: true },
    "teil3.4": { partId: "teil3", student: "C", expected: "C", correct: true },
    "teil3.5": { partId: "teil3", student: "A", expected: "A", correct: true },
    "teil4.1": { partId: "teil4", student: "B", expected: "B", correct: true },
    "teil4.2": { partId: "teil4", student: "A", expected: "C) 30 Minuten", correct: false },
    "teil4.3": { partId: "teil4", student: "A", expected: "A", correct: true },
    "teil4.4": { partId: "teil4", student: "B", expected: "B", correct: true },
    "teil4.5": { partId: "teil4", student: "A", expected: "A", correct: true },
  },
};

test("Diana feedback rejects stale structured objective advice after deterministic reconciliation", () => {
  const result = reconcileFinalDeterministicFeedback({
    level: "A2",
    assignmentKey: "A2-health-letter",
    studentName: "Diana Esi Atteh",
    score: 80,
    finalScore: 80,
    objectiveScore: 60,
    objectiveCorrect: 6,
    objectiveTotal: 10,
    writingScorePercent: 70,
    hasRegisteredWriting: true,
    writingStrengths: ["The letter is polite and clearly states the purpose of the request"],
    taskCompletion: { completed: 1, total: 1 },
    nextStep: "Focus on improving your objective answers, especially for questions 1, 3, and 4 in Teil 3, where you selected incorrect options",
    feedback: "Solid work. Focus on improving your objective answers, especially for questions 1, 3, and 4 in Teil 3.",
  }, objectiveResult, submission);

  assert.equal(result.objectiveCorrect, 9);
  assert.equal(result.objectiveTotal, 10);
  assert.equal(Math.round(result.objectiveScore), 90);
  assert.deepEqual(result.wrongAnswers.map((row) => `${row.partId}.${row.question}`), ["teil4.2"]);
  assert.match(result.feedback, /Teil 3 is excellent/i);
  assert.match(result.feedback, /Teil 4.*review.*2/i);
  assert.match(result.feedback, /Sehr geehrte Damen und Herren/i);
  assert.match(result.feedback, /Herren/i);
  assert.doesNotMatch(result.feedback, /questions? 1, 3,? and 4/i);
  assert.doesNotMatch(result.feedback, /improving your objective answers/i);
  assert.doesNotMatch(result.feedback, /incorrect options/i);
  assert.ok(result.feedback.split(/\s+/).filter(Boolean).length <= 60, result.feedback);
});

test("structured writing strengths that contradict objective results are also ignored", () => {
  const result = reconcileFinalDeterministicFeedback({
    level: "A2",
    assignmentKey: "A2-health-letter",
    studentName: "Diana Esi Atteh",
    writingScorePercent: 70,
    hasRegisteredWriting: true,
    writingStrengths: ["Teil 3 questions 1, 3 and 4 need more practice"],
    nextStep: "Review the correct answers for Teil 3",
  }, objectiveResult, submission);

  assert.match(result.feedback, /appointment|Termin beim Arzt|treatment costs|Krankenversicherung/i);
  assert.doesNotMatch(result.feedback, /Teil 3 questions 1, 3 and 4/i);
  assert.doesNotMatch(result.feedback, /Review the correct answers for Teil 3/i);
});
