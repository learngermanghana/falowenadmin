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

test("B1 Day 1-6 use Presenter 2 stages with question reveal and classroom timing", () => {
  const stages = buildTeachingPresenterStages({
    course: "B1",
    day: "Day 6",
    dayNumber: 6,
    title: "B1 Day 6",
    topic: "Wohnen",
    objective: "Compare options.",
    estimatedDuration: "60 minutes",
    warmupQuestionsDe: ["Wo wohnst du?"],
    keyPhrasesDe: ["Im Vergleich zu ..."],
    studentQuestionsDe: ["Welche Wohnung ist besser?", "Warum?"],
    teacherNotesEn: ["Never project this teacher note"],
    interactionFlow: [
      { phase: "Comparison drill", detailEn: "5 min: compare two flats." },
      { phase: "Pair work", detailEn: "8 min: justify one choice." },
    ],
    workbookConnection: {
      parts: [
        { label: "Grammar", detailEn: "Comparative forms and relative clauses." },
        { label: "Sprechen", detailEn: "Compare two housing options." },
      ],
    },
    teacherSupport: {
      grammarFocusEn: ["Use the comparative to compare two options."],
      modelExamplesDe: ["Diese Wohnung ist größer als die andere."],
      commonMistakesEn: ["Do not forget als after the comparative."],
    },
    wrapUpTaskDe: "Vergleiche zwei Wohnungen.",
  }, "2.6 Wohnen");

  assert.deepEqual(stages.map((stage) => stage.id), [
    "intro",
    "warmup",
    "phrases",
    "grammar",
    "examples",
    "guided-practice",
    "questions",
    "workbook",
    "mistakes",
    "wrapup",
  ]);
  assert.equal(stages.find((stage) => stage.id === "questions")?.type, "question-reveal");
  assert.deepEqual(stages.find((stage) => stage.id === "questions")?.modelItems, ["Diese Wohnung ist größer als die andere."]);
  assert.equal(stages.find((stage) => stage.id === "grammar")?.suggestedMinutes, 10);
  assert.equal(stages.find((stage) => stage.id === "questions")?.suggestedMinutes, 10);
  assert.equal(JSON.stringify(stages).includes("Never project this teacher note"), false);
});

test("B1 Day 7 and later remain on the existing presenter until rollout expands", () => {
  const stages = buildTeachingPresenterStages({
    course: "B1",
    day: "Day 7",
    dayNumber: 7,
    title: "B1 Day 7",
    topic: "Topic",
    objective: "Objective",
    warmupQuestionsDe: ["Warm-up"],
    keyPhrasesDe: ["Phrase"],
    studentQuestionsDe: ["Question"],
    interactionFlow: [{ phase: "Teacher flow", detailEn: "Should stay outside the classic presenter." }],
    teacherSupport: {
      grammarFocusEn: ["Grammar"],
      modelExamplesDe: ["Model"],
      commonMistakesEn: ["Mistake"],
    },
    wrapUpTaskDe: "Wrap up.",
  });

  assert.deepEqual(stages.map((stage) => stage.id), ["intro", "warmup", "phrases", "questions", "wrapup"]);
  assert.equal(stages.find((stage) => stage.id === "questions")?.type, "numbered-list");
  assert.equal(JSON.stringify(stages).includes("Teacher flow"), false);
});

test("presenter navigation index is clamped to available stages", () => {
  assert.equal(clampPresenterIndex(-2, 5), 0);
  assert.equal(clampPresenterIndex(2, 5), 2);
  assert.equal(clampPresenterIndex(12, 5), 4);
});
