import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

const A1_12_2_REFERENCE = {
  assignmentKey: "A1-12.2",
  level: "A1",
  expectedParts: ["teil1", "teil2", "teil3"],
  referenceAnswerParts: ["teil1", "teil2", "teil3"],
  parts: {
    teil1: {
      answers: {
        Answer1: "In Berlin",
        Answer2: "Mit seiner Frau und seinen drei Kindern",
        Answer3: "Mit seinem Auto",
        Answer4: "Um 7:30 Uhr",
        Answer5: "A) Barzahlung (cash)",
      },
    },
    teil2: {
      answers: {
        Answer1: "B) Um 9:00 Uhr",
        Answer2: "B) Um 12:00 Uhr",
        Answer3: "B) Um 18:00 Uhr",
        Answer4: "B) Um 21:00 Uhr",
        Answer5: "D) Alles Genannte",
      },
    },
    teil3: {
      answers: {
        Answer1: "B) Um 9 Uhr",
        Answer2: "B) Um 12 Uhr",
        Answer3: "A) ein Computer und ein Drucker",
        Answer4: "C) in einer Bar",
        Answer5: "C) bar",
      },
    },
  },
};

const DEBORAH_SUBMISSION = `Teil 1. Lesen Sie den Aufsatz und schreiben Sie die richtige Antwort.
1. Felix wohnt in Berlin.
2. Felix wohnt mit seiner Frau und seinen drei Kindern.
3. Felix fährt mit seinem Auto zur Arbeit.
4. Felix Arbeitstag beginnt um 7:30 Uhr.
5. A) Barzahlung ( cash )

Teil 2. Lesen Sie die Anzeigen und beantworten Sie die Fragen.
1. B) Um 9:00 Uhr
2. B) Um 12:00 Uhr
3. B) Um 18:00 Uhr
4. B) Um 21:00 Uhr
5. D) Alles Genannte

Teil 3. Hören
1. B) Um 9:00 Uhr
2. B) Um 12:00 Uhr
3. C) Ein Computer und ein Telefon
4. C) In einem Aktenschrank
5. C) Bar`;

test("A1-12.2 preserves 7:30 inside a complete sentence and scores 14 of 15", () => {
  const result = computeObjectiveScore(A1_12_2_REFERENCE, DEBORAH_SUBMISSION);

  assert.equal(result.correctCount, 14);
  assert.equal(result.totalCount, 15);
  assert.equal(result.details["teil1.4"].correct, true);
  assert.match(result.details["teil1.4"].student, /7:30 Uhr/i);

  const wrongKeys = Object.entries(result.details)
    .filter(([, detail]) => detail.correct === false)
    .map(([key]) => key);
  assert.deepEqual(wrongKeys, ["teil3.3"]);
});

test("multipart feedback labels each group with question or questions", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Diana Esi Atteh",
    level: "A2",
    assignmentKey: "A2-car-rental",
    objectiveScore: 75,
    objectiveCorrect: 9,
    objectiveTotal: 12,
    wrongAnswers: [
      { partId: "teil3", question: 6 },
      { partId: "teil3", question: 7 },
      { partId: "teil4", question: 2 },
    ],
  }, "");

  assert.match(feedback, /9 of 12 objective questions correctly/);
  assert.match(feedback, /Teil 3 questions 6 and 7/);
  assert.match(feedback, /Teil 4 question 2/);
  assert.doesNotMatch(feedback, /Teil 3 6 and 7|Teil 4 2/);
});
