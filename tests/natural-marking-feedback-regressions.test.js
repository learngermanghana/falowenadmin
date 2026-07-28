import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

test("A1-1.1 feedback ignores stale AI counts and reports 3 of 4 with only question 3 wrong", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Mary Louisa Arlloo",
    objectiveScore: 75,
    objectiveCorrect: 1,
    objectiveTotal: 4,
    objectiveDetails: {
      1: { correct: true },
      2: { correct: true },
      3: { correct: false },
      4: { correct: true },
    },
  }, "Hallo, ich heiBe Louisa Arllo und ich komme aus Ghana. Ich wohne in Cape Coast. Tschüss!");

  assert.match(feedback, /You answered 3 of 4 objective questions correctly/);
  assert.match(feedback, /review question 3 carefully/);
  assert.doesNotMatch(feedback, /1 of 4 objective questions correctly/);
  assert.doesNotMatch(feedback, /questions 2, 3, and 4/);
});

test("A2-9.24 feedback ignores stale AI counts and reports 1 of 5 with all four wrong questions", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Catherine Etornam Agbleze",
    objectiveScore: 20,
    objectiveCorrect: 2,
    objectiveTotal: 5,
    objectiveDetails: {
      1: { correct: false },
      2: { correct: false },
      3: { correct: true },
      4: { correct: false },
      5: { correct: false },
    },
  }, "Liebe Sandra, ich möchte mit dir zusammen einen Urlaub planen.");

  assert.match(feedback, /You answered 1 of 5 objective questions correctly/);
  assert.match(feedback, /review questions 1, 2, 4, and 5 carefully/);
  assert.doesNotMatch(feedback, /2 of 5 objective questions correctly/);
});
