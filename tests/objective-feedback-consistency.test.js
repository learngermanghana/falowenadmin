import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

test("A1-1.1 feedback follows deterministic score and wrong-answer table", () => {
  const result = {
    studentName: "Mary Louisa Arlloo",
    assignmentKey: "A1-1.1",
    objectiveScore: 75,
    objectiveCorrect: 1,
    objectiveTotal: 4,
    // Simulates stale AI details that previously leaked into student feedback.
    objectiveDetails: {
      1: { correct: true },
      2: { correct: false },
      3: { correct: false },
      4: { correct: false },
    },
    // This is the deterministic wrong-answer table shown to the tutor.
    wrongAnswers: [
      { question: 3, student: "D", correctAnswer: "A" },
    ],
  };

  const submission = "Hallo, ich heiße Louisa Arlloo und ich komme aus Ghana. Ich wohne in Cape Coast. Tschüss!";
  const feedback = buildNaturalStudentFeedback(result, submission);

  assert.match(feedback, /^Good progress, Mary Louisa Arlloo\./);
  assert.match(feedback, /3 of 4 objective questions correctly/);
  assert.match(feedback, /review question 3 carefully/);
  assert.doesNotMatch(feedback, /1 of 4 objective questions correctly/);
  assert.doesNotMatch(feedback, /questions 2, 3, and 4/);
});

test("an empty deterministic wrong-answer table suppresses stale AI errors", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Student",
    objectiveScore: 100,
    objectiveTotal: 4,
    objectiveDetails: {
      1: { correct: true },
      2: { correct: false },
      3: { correct: false },
      4: { correct: true },
    },
    wrongAnswers: [],
  }, "1. A\n2. B\n3. C\n4. D");

  assert.match(feedback, /4 of 4 objective questions correctly/);
  assert.doesNotMatch(feedback, /review question/i);
});
