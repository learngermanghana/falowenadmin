import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages, clampPresenterIndex } from "../src/utils/teachingPresenter.js";
import { normalizeStudentPracticeItems } from "../src/utils/studentSlidePractice.js";

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

test("B1 Presenter uses one lesson-specific focused task instead of the legacy interaction-flow stack", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-1.1");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const practice = stages.find((stage) => stage.id === "practice");
  const normalized = normalizeStudentPracticeItems(practice?.items);

  assert.equal(normalized.length, 1);
  assert.match(normalized[0].title, /Zeitlinie/i);
  assert.ok(normalized[0].prompts.length >= 2);
  assert.ok(normalized[0].modelItems.length >= 2);
  assert.equal(normalized[0].minutes, 7);
});

test("student practice keeps richer B2 C1 prompts and model support", () => {
  const normalized = normalizeStudentPracticeItems([
    {
      title: "Satz-Upgrade",
      instruction: "Formuliere den Satz neu.",
      prompts: ["Nutze hingegen.", "Nutze im Gegensatz dazu."],
      modelItems: ["Im Beruf bin ich ruhig. Privat hingegen spreche ich viel."],
      minutes: 8,
    },
  ]);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].instruction, "Formuliere den Satz neu.");
  assert.deepEqual(normalized[0].prompts, ["Nutze hingegen.", "Nutze im Gegensatz dazu."]);
  assert.deepEqual(normalized[0].modelItems, ["Im Beruf bin ich ruhig. Privat hingegen spreche ich viel."]);
  assert.equal(normalized[0].minutes, 8);
});

test("presenter navigation index is clamped to available stages", () => {
  assert.equal(clampPresenterIndex(-2, 5), 0);
  assert.equal(clampPresenterIndex(2, 5), 2);
  assert.equal(clampPresenterIndex(12, 5), 4);
});


test("A2 Presenter finishes with a lesson summary instead of Course Book Bridge", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-2.5");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const summary = stages.at(-1);

  assert.equal(summary?.id, "lesson-summary");
  assert.equal(summary?.type, "summary");
  assert.match(summary?.subtitle || "", /You should now be able to/i);
  assert.match(summary?.items?.[0]?.detail || "", /^You can describe free time/i);
  assert.ok(summary?.nextSteps?.some((item) => item.label === "1. Grammar"));
  assert.ok(summary?.nextSteps?.some((item) => item.label === "4. Workbook / Submit"));
  assert.equal(stages.some((stage) => stage.id === "coursebook-bridge"), false);
});
