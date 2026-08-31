import test from "node:test";
import assert from "node:assert/strict";
import { buildTeachingPresenterStages, clampPresenterIndex } from "../src/utils/teachingPresenter.js";

test("presenter builds student-facing lesson stages without teacher notes", () => {
  const stages = buildTeachingPresenterStages({
    course: "A2",
    day: "Day 1",
    title: "Small Talk",
    topic: "Small Talk",
    objective: "Speak confidently.",
    estimatedDuration: "45 minutes",
    warmupQuestionsDe: ["Wie geht's?"],
    keyPhrasesDe: ["Wie geht's?"],
    studentQuestionsDe: ["Woher kommst du?"],
    teacherNotesEn: ["Teacher-only note"],
    interactionFlow: [{ phase: "Demo", detailEn: "Teacher-only flow" }],
    wrapUpTaskDe: "Schreibe einen Satz.",
  }, "1.1 Small Talk");

  assert.deepEqual(stages.map((stage) => stage.id), ["intro", "warmup", "phrases", "questions", "wrapup"]);
  assert.equal(JSON.stringify(stages).includes("Teacher-only note"), false);
  assert.equal(JSON.stringify(stages).includes("Teacher-only flow"), false);
  assert.equal(stages[0].topic, "1.1 Small Talk");
});

test("presenter navigation index is clamped to available stages", () => {
  assert.equal(clampPresenterIndex(-2, 5), 0);
  assert.equal(clampPresenterIndex(2, 5), 2);
  assert.equal(clampPresenterIndex(12, 5), 4);
});
