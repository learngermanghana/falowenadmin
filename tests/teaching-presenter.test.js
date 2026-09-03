import test from "node:test";
import assert from "node:assert/strict";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
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

test("B1 Day 1-12 use Presenter 2 stages with question reveal and classroom timing", () => {
  const stages = buildTeachingPresenterStages({
    course: "B1",
    day: "Day 12",
    dayNumber: 12,
    title: "B1 Day 12",
    topic: "Abenteuer in der Natur",
    objective: "Tell a coherent past story.",
    estimatedDuration: "60 minutes",
    warmupQuestionsDe: ["Welches Naturerlebnis erinnerst du?"],
    keyPhrasesDe: ["Als wir ankamen, war ..."],
    studentQuestionsDe: ["Wo war dein Abenteuer?", "Was ist passiert?"],
    teacherNotesEn: ["Never project this teacher note"],
    interactionFlow: [
      { phase: "Timeline sort", detailEn: "7 min: order the events." },
      { phase: "Story rehearsal", detailEn: "12 min: tell the story." },
    ],
    workbookConnection: {
      parts: [
        { label: "Grammar", detailEn: "Perfekt, Präteritum and temporal connectors." },
        { label: "Sprechen", detailEn: "Tell a nature adventure." },
      ],
    },
    teacherSupport: {
      grammarFocusEn: ["Use Perfekt for main completed actions and war/hatte for background."],
      modelExamplesDe: ["Als wir ankamen, war das Wetter noch schön."],
      commonMistakesEn: ["Do not use wenn for a single completed past event."],
    },
    wrapUpTaskDe: "Erzähle dein Abenteuer in sechs Sätzen.",
  }, "4.12 Abenteuer in der Natur");

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
  assert.deepEqual(stages.find((stage) => stage.id === "questions")?.modelItems, ["Als wir ankamen, war das Wetter noch schön."]);
  assert.equal(stages.find((stage) => stage.id === "grammar")?.suggestedMinutes, 10);
  assert.equal(stages.find((stage) => stage.id === "questions")?.suggestedMinutes, 10);
  assert.equal(JSON.stringify(stages).includes("Never project this teacher note"), false);
});

test("the real B1 Day 1-12 lessons all provide complete Presenter 2 classroom stages", () => {
  const assignmentIds = [
    "B1-1.1", "B1-1.2", "B1-1.3",
    "B1-2.4", "B1-2.5", "B1-2.6",
    "B1-3.7", "B1-3.8", "B1-3.9",
    "B1-4.10", "B1-4.11", "B1-4.12",
  ];
  const requiredStageIds = ["grammar", "examples", "guided-practice", "questions", "workbook", "mistakes"];

  assignmentIds.forEach((assignmentId) => {
    const slide = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(slide, `${assignmentId} slide should exist`);
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = new Set(stages.map((stage) => stage.id));

    requiredStageIds.forEach((stageId) => {
      assert.equal(stageIds.has(stageId), true, `${assignmentId} should include ${stageId}`);
    });

    const questionStage = stages.find((stage) => stage.id === "questions");
    assert.equal(questionStage?.type, "question-reveal", `${assignmentId} should use question reveal mode`);
    assert.ok(questionStage?.items?.length > 0, `${assignmentId} should contain speaking questions`);
    assert.ok(questionStage?.modelItems?.length > 0, `${assignmentId} should contain model language`);
    assert.ok(stages.every((stage) => Number(stage.suggestedMinutes || 0) > 0), `${assignmentId} should give every stage a classroom timer suggestion`);
  });
});

test("B1 Day 13 and later remain on the existing presenter until rollout expands", () => {
  const stages = buildTeachingPresenterStages({
    course: "B1",
    day: "Day 13",
    dayNumber: 13,
    title: "B1 Day 13",
    topic: "Filmkritik",
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
