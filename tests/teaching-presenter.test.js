import test from "node:test";
import assert from "node:assert/strict";
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

test("student practice preserves detail-based A1 A2 B1 Presenter 2 exercises", () => {
  const stages = buildTeachingPresenterStages({
    assignmentId: "A2-1.1",
    course: "A2",
    day: "Day 1",
    title: "Small Talk",
    topic: "Small Talk",
    objective: "Speak confidently.",
    estimatedDuration: "45 minutes",
    warmupQuestionsDe: ["Wie geht's?"],
    keyPhrasesDe: ["Wie geht's?"],
    studentQuestionsDe: ["Woher kommst du?", "Was machst du gern?"],
    teacherNotesEn: [],
    interactionFlow: [
      { phase: "Mini-Dialog", detailEn: "5 min: Build a short dialogue with a partner." },
      { phase: "Swap roles", detailEn: "4 min: Repeat the dialogue with new information." },
    ],
    wrapUpTaskDe: "Schreibe einen Satz.",
  }, "1.1 Small Talk");

  const practice = stages.find((stage) => stage.id === "practice");
  const normalized = normalizeStudentPracticeItems(practice?.items);

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].title, "Mini-Dialog");
  assert.equal(normalized[0].instruction, "5 min: Build a short dialogue with a partner.");
  assert.equal(normalized[0].minutes, 5);
  assert.deepEqual(normalized[0].prompts, []);
  assert.equal(normalized[1].instruction, "4 min: Repeat the dialogue with new information.");
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
