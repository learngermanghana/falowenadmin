import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

test("null objective percentage preserves the explicit correct count", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Mary",
    objectiveScore: null,
    objectiveCorrect: 3,
    objectiveTotal: 4,
  });

  assert.match(feedback, /3 of 4 objective questions correctly/);
  assert.doesNotMatch(feedback, /0 of 4/);
});

test("A2 essay feedback uses task evidence and an exact correction", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Sandra",
    level: "A2",
    assignmentKey: "A2-9.24",
    objectiveScore: 60,
    objectiveTotal: 5,
    wrongAnswers: [{ question: 1 }, { question: 4 }],
    writingScore: 77,
    taskCompletion: { completed: 3, total: 4, missing: ["transport"] },
    strengths: ["Your invitation gives a clear meeting time and place"],
    corrections: [{
      partId: "teil2",
      from: "weil ich möchte mit dir ein Urlaub planen",
      to: "weil ich mit dir einen Urlaub planen möchte",
    }],
  }, "Liebe Sandra, ich möchte mit dir einen Urlaub planen. Wir treffen uns am Samstag um 14 Uhr im Café. Viele Grüße, Catherine.");

  assert.match(feedback, /3 of 5 objective answers are correct/);
  assert.match(feedback, /Review 1 and 4/);
  assert.match(feedback, /clear meeting time and place/);
  assert.match(feedback, /weil ich mit dir einen Urlaub planen möchte/);
  assert.match(feedback, /transport is missing/);
  assert.doesNotMatch(feedback, /Your free-text response is clear/);
  assert.ok(feedback.split(/\s+/).length <= 60);
  assert.match(feedback, /[.!?]$/);
});

test("B1 essay feedback identifies argument strength, missing development and a correction", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Kojo",
    level: "B1",
    assignmentKey: "B1-4.3",
    writingScore: 72,
    strengths: ["Your position is clear and the first reason is well explained"],
    missingTaskPoints: ["a concrete example for the second advantage"],
    corrections: [{
      from: "obwohl es ist flexibel",
      to: "obwohl es flexibel ist",
    }],
  }, "Meiner Meinung nach ist Online-Lernen gut, weil es flexibel ist. Außerdem spart man Zeit. Obwohl es ist flexibel, gibt es Nachteile. Zusammenfassend finde ich beide Formen wichtig.");

  assert.match(feedback, /position is clear and the first reason is well explained/);
  assert.match(feedback, /obwohl es flexibel ist/);
  assert.match(feedback, /concrete example for the second advantage/);
  assert.ok(feedback.split(/\s+/).length <= 75);
  assert.match(feedback, /[.!?]$/);
});

test("recent feedback steers the opening away from repeated wording", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Kojo",
    level: "B1",
    assignmentKey: "B1-4.3",
    writingScore: 72,
    previousFeedback: "Good progress, Kojo. Your position is clear and the first reason is well explained.",
    strengths: ["Your position is clear and the first reason is well explained"],
    corrections: [{ from: "obwohl es ist flexibel", to: "obwohl es flexibel ist" }],
  }, "Meiner Meinung nach ist Online-Lernen gut, weil es flexibel ist. Außerdem spart man Zeit. Obwohl es ist flexibel, gibt es Nachteile. Zusammenfassend finde ich beide Formen wichtig.");

  assert.doesNotMatch(feedback, /^Good progress/);
  assert.match(feedback, /Kojo/);
});
