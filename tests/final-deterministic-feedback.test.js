import test from "node:test";
import assert from "node:assert/strict";

import { reconcileFinalDeterministicFeedback } from "../src/utils/finalDeterministicFeedback.js";

function objectiveDetails(total, wrong = {}) {
  return Object.fromEntries(Array.from({ length: total }, (_, index) => {
    const question = String(index + 1);
    const mistake = wrong[question];
    return [question, mistake
      ? { student: mistake.student, expected: mistake.expected, correct: false, partId: "main" }
      : { student: "A", expected: "A", correct: true, partId: "main" }];
  }));
}

function perfectA102Result() {
  const staleFeedback = "Keep working steadily, Josh Asante Afriyie. You answered 2 of 12 objective questions correctly. Review questions 1, 2, 3, 4, 5, 8, 9, 10, 11, and 12 carefully.";
  const result = reconcileFinalDeterministicFeedback({
    studentName: "Josh Asante Afriyie",
    level: "A1",
    assignmentKey: "A1-0.2",
    objectiveScore: 17,
    objectiveCorrect: 2,
    objectiveTotal: 12,
    wrongAnswers: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12].map((question) => ({ question })),
    feedback: staleFeedback,
  }, {
    correctCount: 12,
    totalCount: 12,
    details: objectiveDetails(12),
  }, "Q1. C Q2. A Q3. A Q4. A Q5. A Q6. A Q7. B Hören Q1. Wasser Q2. Kaffee Q3. Blume Q4. Schule Q5. Tisch");
  return { result, staleFeedback };
}

test("A1-9 final deterministic result replaces stale 6-of-15 feedback", () => {
  const staleFeedback = "Keep working steadily, Mary Louisa Arlloo. You answered 6 of 15 objective questions correctly. Review questions 1, 2, 3, 12, 13, 14, 15, 4, and 5 carefully.";
  const result = reconcileFinalDeterministicFeedback({
    studentName: "Mary Louisa Arlloo",
    level: "A1",
    assignmentKey: "A1-9",
    objectiveScore: 40,
    objectiveCorrect: 6,
    objectiveTotal: 15,
    wrongAnswers: [1, 2, 3, 12, 13, 14, 15, 4, 5].map((question) => ({ question })),
    feedback: staleFeedback,
    improvementSummary: staleFeedback,
  }, {
    correctCount: 12,
    totalCount: 15,
    details: objectiveDetails(15, {
      1: { student: "A", expected: "B" },
      11: { student: "1", expected: "A" },
      12: { student: "B", expected: "A" },
    }),
  }, "Meine Essgewohnheiten. Ich esse gerne FuFu mit Fisch. Zum Frühstück esse ich Brot und trinke Milo.");

  assert.equal(result.objectiveCorrect, 12);
  assert.equal(result.objectiveTotal, 15);
  assert.equal(Math.round(result.objectiveScore), 80);
  assert.deepEqual(result.wrongAnswers.map((row) => row.question), ["1", "11", "12"]);
  assert.match(result.feedback, /12 of 15 objective questions correctly/);
  assert.match(result.feedback, /questions 1, 11, and 12 carefully/);
  assert.doesNotMatch(result.feedback, /6 of 15|questions 1, 2, 3/);
  assert.equal(result.improvementSummary, result.feedback);
  assert.equal(result.aiDetailedFeedback, staleFeedback);
});

test("A1-0.2 perfect deterministic fields replace stale values", () => {
  const { result } = perfectA102Result();
  assert.equal(result.objectiveCorrect, 12);
  assert.equal(result.objectiveTotal, 12);
  assert.equal(result.objectiveScore, 100);
  assert.deepEqual(result.wrongAnswers, []);
});

test("A1-0.2 perfect feedback states 12 of 12 with no review list", () => {
  const { result } = perfectA102Result();
  assert.match(result.feedback, /12 of 12 objective questions correctly/);
  assert.doesNotMatch(result.feedback, /\b2 of 12\b|Review question/i);
});

test("A1-0.2 perfect reconciliation preserves stale AI feedback only for audit", () => {
  const { result, staleFeedback } = perfectA102Result();
  assert.equal(result.aiDetailedFeedback, staleFeedback);
  assert.notEqual(result.feedback, staleFeedback);
});

test("multipart detail keys preserve the question suffix", () => {
  const result = reconcileFinalDeterministicFeedback({
    studentName: "Nabi",
    level: "A2",
    assignmentKey: "A2-7.18",
    objectiveScore: 0,
    objectiveCorrect: 0,
    objectiveTotal: 4,
    feedback: "Stale objective feedback.",
  }, {
    correctCount: 2,
    totalCount: 4,
    details: {
      "teil3.1": { partId: "teil3", student: "B", expected: "A", correct: false },
      "teil3.2": { partId: "teil3", student: "C", expected: "C", correct: true },
      "teil3.3": { partId: "teil3", student: "A", expected: "A", correct: true },
      "teil3.4": { partId: "teil3", student: "D", expected: "B", correct: false },
    },
  }, "1. B 2. C 3. A 4. D");

  assert.deepEqual(result.wrongAnswers.map((row) => row.question), ["1", "4"]);
  assert.deepEqual(result.wrongAnswers.map((row) => row.partId), ["teil3", "teil3"]);
  assert.match(result.feedback, /In Teil 3, review questions 1 and 4 carefully/);
  assert.doesNotMatch(result.feedback, /questions 3 and 3|question 3 carefully/);
});
