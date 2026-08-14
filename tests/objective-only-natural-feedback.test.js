import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

test("A1-0.1 objective-only test does not get generic free-text writing feedback", () => {
  const result = {
    studentName: "MATEY RUTH",
    assignmentKey: "A1-0.1",
    objectiveScore: 100,
    objectiveCorrect: 10,
    objectiveTotal: 10,
    writingScore: null,
    writingScorePercent: null,
    maxWritingScore: null,
    hasRegisteredWriting: false,
    wrongAnswers: [],
  };
  const submission = `1. C (Guten Morgen)\n2. D (Guten Tag)\n3. B (Guten Abend)\n4. B (Guten Nacht)\n5. C (Guten Morgen)\n6. C Wie geht es Ihnen?\n7. B (Auf Wiedersehen)\n8. A (Tschüss)\n9. C (Guten Abend)\n10. D (Gute Nacht)`;

  const feedback = buildNaturalStudentFeedback(result, submission);

  assert.match(feedback, /^Good work, MATEY RUTH\./);
  assert.match(feedback, /10 of 10 objective questions correctly/);
  assert.doesNotMatch(feedback, /free-text response/i);
  assert.doesNotMatch(feedback, /language mistakes/i);
});

test("registered writing can still receive the generic proofreading tip", () => {
  const result = {
    studentName: "Anna",
    objectiveScore: 80,
    objectiveCorrect: 8,
    objectiveTotal: 10,
    writingScore: 75,
    hasRegisteredWriting: true,
  };
  const submission = "Hallo Anna. Ich schreibe dir heute. Ich hoffe, es geht dir gut.";

  const feedback = buildNaturalStudentFeedback(result, submission);
  assert.match(feedback, /free-text response/i);
});
