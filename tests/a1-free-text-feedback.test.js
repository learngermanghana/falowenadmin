import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

const PRINCESS_SUBMISSION = `Teil 1.
1. Ich komme aus Deutschland. Ich spreche Deutsch.
2. Sie kommt aus Frankriech. Sie spricht Fanzössich
3. Sie kommen aus Russland. Sie sprechen Kussisch
4. Wir kommen aus Japan. Wir sprechen Japanisch.
5. Er kommt aus England. Er spricht Englisch.
Teil 2.
1. Neun
2. Polish
3. Niederländisch
4. Deutsch
5. Paris.
6. Amsterdam
7. in der Schweiz
Teil 3.
1. In Italien und Frankreich.
2. Paris
3. Das Essen
4. Paris
5. Madrid order Barcelona`;

test("A1 unscored prose receives evidence-based feedback instead of the free-text fallback", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Princess Ugoma Omanye Ukekwe",
    level: "A1",
    objectiveScore: 83.333,
    objectiveCorrect: 10,
    objectiveTotal: 12,
    wrongAnswers: [
      { question: 9, student: "Paris", expected: "C", correct: false },
      { question: 12, student: "Madrid order Barcelona", expected: "A", correct: false },
    ],
    aiOriginalFeedback: "Your free-text response is clear; read it through once more before submitting to catch small language mistakes.",
    aiDetailedFeedback: "Your free-text response is clear; read it through once more before submitting to catch small language mistakes.",
  }, PRINCESS_SUBMISSION);

  assert.match(feedback, /10 of 12 objective questions correctly/i);
  assert.match(feedback, /questions 9 and 12/i);
  assert.match(feedback, /“Frankriech” to “Frankreich”/);
  assert.match(feedback, /“Fanzössich” to “Französisch”/);
  assert.match(feedback, /“Kussisch” to “Russisch”/);
  assert.doesNotMatch(feedback, /free-text response/i);
  assert.ok(feedback.split(/\s+/).length <= 60);
});

test("A1 prose reuses a grounded specific AI correction when no known spelling correction exists", () => {
  const submission = `Teil 1
Ich komme aus Deutschland. Ich spreche Deutsch.
Wir wohnt in Accra.`;

  const feedback = buildNaturalStudentFeedback({
    studentName: "A1 Student",
    objectiveScore: 100,
    objectiveCorrect: 2,
    objectiveTotal: 2,
    aiOriginalFeedback: "Correct “Wir wohnt” to “Wir wohnen” so that the verb agrees with the subject.",
  }, submission);

  assert.match(feedback, /Wir wohnt.*Wir wohnen/i);
  assert.doesNotMatch(feedback, /free-text response/i);
});
