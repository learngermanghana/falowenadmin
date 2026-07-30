import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

const JEFFREY_SUBMISSION = `Teil 2
Sehr geehrte Frau Abigail,

ich hoffe, es geht Ihnen gut. Ich schreibe Ihnen, weil ich mich für das berufliche Seminar interessiere.

Vielen Dank für Ihren Vorschlag. Ich freue mich über das Seminar, deshalb möchte ich mehr wissen.

Können Sie mir bitte Informationen über den Inhalt, die Termine und die Kosten schicken?

Ich freue mich im Voraus auf Ihre Antwort und hoffe auf eine positive Rückmeldung

Mit freundlichen Grüßen

Jeffrey Danso

Teil 3
1. B
2. C
3. C
4. C
5. C
6. C
7. B
8. D
9. C
10. C
11. C
12. C`;

function baseResult(overrides = {}) {
  return {
    studentName: "Jeffrey Danso",
    level: "A2",
    assignmentKey: "A2-5.14",
    objectiveScore: 100,
    objectiveCorrect: 12,
    objectiveTotal: 12,
    writingScore: 82,
    finalScore: 91,
    hasRegisteredWriting: true,
    objectiveDetails: {
      "teil3.1": { partId: "teil3", correct: true },
      "teil3.2": { partId: "teil3", correct: true },
      "teil3.3": { partId: "teil3", correct: true },
      "teil3.4": { partId: "teil3", correct: true },
      "teil3.5": { partId: "teil3", correct: true },
      "teil3.6": { partId: "teil3", correct: true },
      "teil3.7": { partId: "teil3", correct: true },
      "teil4.1": { partId: "teil4", correct: true },
      "teil4.2": { partId: "teil4", correct: true },
      "teil4.3": { partId: "teil4", correct: true },
      "teil4.4": { partId: "teil4", correct: true },
      "teil4.5": { partId: "teil4", correct: true },
    },
    ...overrides,
  };
}

test("Jeffrey feedback uses the original specific OpenAI writing evidence", () => {
  const rawAiFeedback = "Your formal email clearly asks about the seminar content, dates and costs. Avoid repeating ‘Ich freue mich’ and vary one occurrence with a different expression. All objective answers are correct.";
  const feedback = buildNaturalStudentFeedback(baseResult({
    feedback: rawAiFeedback,
    aiDetailedFeedback: rawAiFeedback,
  }), JEFFREY_SUBMISSION);

  assert.match(feedback, /seminar content, dates and costs/i);
  assert.match(feedback, /Avoid repeating/i);
  assert.doesNotMatch(feedback, /The main purpose of your message is understandable/i);
  assert.doesNotMatch(feedback, /Check verb position, articles and every task point/i);
  assert.ok(feedback.split(/\s+/).length <= 60);
});

test("Jeffrey feedback remains specific when OpenAI returns only generic writing text", () => {
  const genericAiFeedback = "The main purpose of your message is understandable. Check verb position, articles and every task point before submitting.";
  const feedback = buildNaturalStudentFeedback(baseResult({
    feedback: genericAiFeedback,
    aiDetailedFeedback: genericAiFeedback,
  }), JEFFREY_SUBMISSION);

  assert.match(feedback, /seminar content, dates and costs/i);
  assert.match(feedback, /Avoid repeating “Ich freue mich”/i);
  assert.doesNotMatch(feedback, /The main purpose of your message is understandable/i);
  assert.doesNotMatch(feedback, /Check verb position, articles and every task point/i);
  assert.ok(feedback.split(/\s+/).length <= 60);
});
