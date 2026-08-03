import test from "node:test";
import assert from "node:assert/strict";

import { buildEvidenceEssayFeedback } from "../src/utils/essayFeedbackEvidence.js";

const submission = `Hallo Anna,
wie geht es dir? Ich hoffe, dir geht es gut.
Ich schreibe dir, weil ich dich zum Einkaufen einladen möchte. Ich brauche ein Bett, einen Tisch und einen Kleiderschrank für meine neue Wohnung.
Hast du am Samstag Zeit? Wir können uns um 10 Uhr vor dem Möbelhaus treffen.
Wie findest du meine Idee? Kannst du mitkommen? Ich freue mich auf deine Antwort.
Viele Grüße
Diana

Teil 3
1.B
2.B
3.B
4.A
5.B
6.A
7.B

Teil4
1.B
2.B
3.A
4.C
5.C`;

test("single completed writing task uses clear singular wording", () => {
  const feedback = buildEvidenceEssayFeedback({
    result: {
      level: "A2",
      studentName: "Diana Esi Atteh",
      assignmentKey: "A2-7.19",
      writingScore: 75,
      taskCompletion: { completed: 1, total: 1 },
      writingStrengths: ["The invitation is clear and friendly, showing good engagement"],
      nextStep: "Check the correct option letters before submitting",
    },
    submissionText: submission,
    objectiveSentences: [
      "9 of 12 objective answers are correct",
      "Review Teil 3 question 4 and Teil 4 questions 4 and 5",
    ],
  });

  assert.match(feedback, /You completed the required task\./);
  assert.doesNotMatch(feedback, /all 1 task point/i);
});

test("multiple completed task points retain the plural count", () => {
  const feedback = buildEvidenceEssayFeedback({
    result: {
      level: "A2",
      assignmentKey: "A2-test",
      writingScore: 75,
      taskCompletion: { completed: 3, total: 3 },
      writingStrengths: ["The message is clear and organised"],
    },
    submissionText: submission,
  });

  assert.match(feedback, /You addressed all 3 task points\./);
});
