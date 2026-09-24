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


test("A1-12.1 objective-only feedback never adds a writing point from stale AI corrections", () => {
  const result = {
    studentName: "Adu Yaw Andrews",
    assignmentKey: "A1-12.1",
    level: "A1",
    objectiveScore: 80,
    objectiveCorrect: 12,
    objectiveTotal: 15,
    hasRegisteredWriting: false,
    writingScore: null,
    writingScorePercent: null,
    wrongAnswers: [
      { partId: "teil1", question: 2, student: "C", expected: "A" },
      { partId: "teil3", question: 2, student: "Falsch", expected: "A" },
      { partId: "teil3", question: 3, student: "Falsch", expected: "A" },
    ],
    corrections: [
      { partId: "teil1", from: "same witht is", to: "same with this" },
    ],
  };
  const submission = `TEIL 1
1. B
2. C
3. B
4. C
5. C

TEIL 2
1. Falsch
2. Falsch
3. Falsch
4. Falsch
5. Falsch

TEIL 3
1. Richtig
2. Falsch
3. Falsch
4. Richtig
5. Richtig`;

  const feedback = buildNaturalStudentFeedback(result, submission);

  assert.match(feedback, /12 of 15 objective questions correctly/i);
  assert.match(feedback, /Teil 1 question 2/i);
  assert.match(feedback, /Teil 3 questions 2 and 3/i);
  assert.doesNotMatch(feedback, /writing point|free-text response|language mistakes/i);
  assert.doesNotMatch(feedback, /same with/i);
});

test("A1-12.2 objective-only feedback never adds a writing point from sentence-style objective answers", () => {
  const result = {
    studentName: "Adu Yaw Andrews",
    assignmentKey: "A1-12.2",
    level: "A1",
    objectiveScore: 86.67,
    objectiveCorrect: 13,
    objectiveTotal: 15,
    hasRegisteredWriting: false,
    writingScore: null,
    writingScorePercent: null,
    wrongAnswers: [
      { partId: "teil1", question: 4, student: "Er arbeitet von 7:30 Uhr bis 17:00 Uhr.", expected: "Um 7:30 Uhr" },
      { partId: "teil3", question: 3, student: "C", expected: "A" },
    ],
    corrections: [
      { partId: "teil1", from: "Er arbeitet von 7:30 Uhr bis 17:00 Uhr.", to: "Um 7:30 Uhr" },
    ],
  };
  const submission = `TEIL 1
1. Er wohnt in Berlin.
2. Mit seiner Frau und seinen drei Kindern.
3. Er fährt mit seinem Auto zur arbeit.
4. Er arbeitet von 7:30 Uhr bis 17:00 Uhr.
5. A

TEIL 2
1. B
2. B
3. B
4. B
5. D

TEIL 3
1. B
2. B
3. C
4. C
5. C`;

  const feedback = buildNaturalStudentFeedback(result, submission);

  assert.match(feedback, /13 of 15 objective questions correctly/i);
  assert.match(feedback, /Teil 1 question 4/i);
  assert.match(feedback, /Teil 3 question 3/i);
  assert.doesNotMatch(feedback, /writing point|free-text response|language mistakes/i);
});
