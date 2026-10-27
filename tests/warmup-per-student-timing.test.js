import test from "node:test";
import assert from "node:assert/strict";

import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

function slideFor(course, assignmentId) {
  return {
    course,
    assignmentId,
    day: "Lesson 1",
    title: course + " warm-up timing",
    topic: "Warm-up timing",
    objective: "Students answer four warm-up questions before the main lesson.",
    warmupQuestionsDe: [
      "Frage 1?",
      "Frage 2?",
      "Frage 3?",
      "Frage 4?",
    ],
    keyPhrasesDe: ["eins"],
    studentQuestionsDe: ["Frage?"],
    interactionFlow: [{ phase: "Warm-up", detailEn: "1 min: legacy shared warm-up timing." }],
    wrapUpTaskDe: "Abschluss.",
  };
}

test("A2 and B1 warm-up timing is teacher-paced and points to the shared Activity timer", () => {
  for (const [course, assignmentId] of [["A2", "A2-1.1"], ["B1", "B1-1.1"]]) {
    const stages = buildTeachingPresenterStages(slideFor(course, assignmentId), "Warm-up timing");
    const warmup = stages.find((stage) => stage.id === "warmup");

    assert.ok(warmup, course + " warm-up stage missing");
    assert.equal(warmup.suggestedMinutes, 5);
    assert.equal(warmup.timingMode, "per-student");
    assert.equal(warmup.timingLabel, "Teacher-paced · 4 warm-up questions · use Activity timer");
  }
});

test("B2 through C2 keep their existing five-minute per-student timing", () => {
  for (const [course, assignmentId] of [["B2", "B2-1.1"], ["C1", "C1 1"], ["C2", "C2 1"]]) {
    const stages = buildTeachingPresenterStages(slideFor(course, assignmentId), "Warm-up timing");
    const warmup = stages.find((stage) => stage.id === "warmup");
    assert.equal(warmup.suggestedMinutes, 5);
    assert.equal(warmup.timingLabel, "5 min per student · 4 warm-up questions");
  }
});

test("A1 keeps its existing warm-up timing behavior", () => {
  const stages = buildTeachingPresenterStages(slideFor("A1", "A1-1.1"), "Warm-up timing");
  const warmup = stages.find((stage) => stage.id === "warmup");

  assert.ok(warmup);
  assert.equal(warmup.suggestedMinutes, 1);
  assert.equal(warmup.timingMode, "");
  assert.equal(warmup.timingLabel, "");
});
