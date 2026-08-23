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
    hasRegisteredWriting: true,
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
  }, "Liebe Sandra, weil ich möchte mit dir ein Urlaub planen. Wir treffen uns am Samstag um 14 Uhr im Café. Viele Grüße, Catherine.");

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
    hasRegisteredWriting: true,
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
    hasRegisteredWriting: true,
    writingScore: 72,
    previousFeedback: "Good progress, Kojo. Your position is clear and the first reason is well explained.",
    strengths: ["Your position is clear and the first reason is well explained"],
    corrections: [{ from: "obwohl es ist flexibel", to: "obwohl es flexibel ist" }],
  }, "Meiner Meinung nach ist Online-Lernen gut, weil es flexibel ist. Außerdem spart man Zeit. Obwohl es ist flexibel, gibt es Nachteile. Zusammenfassend finde ich beide Formen wichtig.");

  assert.doesNotMatch(feedback, /^Good progress/);
  assert.match(feedback, /Kojo/);
});

test("empty normalized writing arrays do not turn A2 objective answers into an essay", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Ama",
    level: "A2",
    assignmentKey: "A2-3.8",
    hasRegisteredWriting: false,
    objectiveScore: 75,
    objectiveTotal: 8,
    wrongAnswers: [{ question: 3 }, { question: 7 }],
    taskCompletion: {},
    missingTaskPoints: [],
    writingStrengths: [],
    strengths: [],
    corrections: [],
  }, "1. A.\n2. B.\n3. D.\n4. A.\n5. C.\n6. B.\n7. A.\n8. D.");

  assert.match(feedback, /6 of 8 objective questions correctly/);
  assert.match(feedback, /questions 3 and 7 carefully/);
  assert.doesNotMatch(feedback, /main purpose of your message|practical details|verb position|task point/i);
});

test("a long compact objective response cannot use the old 35-word essay fallback", () => {
  const answers = Array.from({ length: 20 }, (_, index) => `${index + 1}. ${index % 2 ? "B" : "A"}.`).join(" ");
  const feedback = buildNaturalStudentFeedback({
    level: "B1",
    assignmentKey: "B1-2.5",
    hasRegisteredWriting: false,
    objectiveScore: 80,
    objectiveTotal: 20,
    corrections: [],
    strengths: [],
  }, answers);

  assert.match(feedback, /16 of 20 objective questions correctly/);
  assert.doesNotMatch(feedback, /clear direction|central argument|connectors|concrete example/i);
});

test("registered writing activates evidence feedback only when the submission contains prose", () => {
  const proseFeedback = buildNaturalStudentFeedback({
    studentName: "Esi",
    level: "A2",
    assignmentKey: "A2-5.4",
    hasRegisteredWriting: true,
    writingScore: null,
  }, "Liebe Anna, ich schreibe dir wegen unseres Treffens. Wir können uns am Samstag im Café treffen. Viele Grüße, Esi.");
  const objectiveFeedback = buildNaturalStudentFeedback({
    studentName: "Esi",
    level: "A2",
    assignmentKey: "A2-5.4",
    hasRegisteredWriting: true,
    objectiveScore: 50,
    objectiveTotal: 4,
  }, "1. A.\n2. B.\n3. C.\n4. D.");

  assert.match(proseFeedback, /Esi/);
  assert.match(proseFeedback, /message|details|purpose/i);
  assert.doesNotMatch(objectiveFeedback, /main purpose|practical details|verb position/i);
});

test("a meaningful non-empty writing correction can activate essay feedback", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Kwame",
    level: "B1",
    assignmentKey: "B1-7.2",
    hasRegisteredWriting: false,
    writingScore: null,
    corrections: [{
      from: "obwohl es ist teuer",
      to: "obwohl es teuer ist",
    }],
  }, "Meiner Meinung nach ist das Angebot hilfreich. Obwohl es ist teuer, spart es viel Zeit. Deshalb würde ich es weiterhin benutzen.");

  assert.match(feedback, /obwohl es teuer ist/);
  assert.doesNotMatch(feedback, /Your free-text response is clear/);
});
