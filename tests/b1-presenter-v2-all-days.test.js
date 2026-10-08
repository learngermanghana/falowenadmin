import test from "node:test";
const TEACHER_CHALLENGE_IDS = new Set(["B1-2.5","B1-3.8","B1-4.12","B1-6.19","B1-8.25","B1-9.26"]);

import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { B1_PRESENTER_KNOWLEDGE_ASSIGNMENTS, getB1PresenterKnowledge } from "../src/data/b1PresenterKnowledge.js";
import { getSpeakingDifficultySelection } from "../src/data/presenterSpeakingDifficulty.js";
import {
  buildTeachingPresenterStages,
  isB1PresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const REQUIRED_STAGES = [
  "intro",
  "warmup",
  "knowledge",
  "phrases",
  "grammar-check",
  "practice",
  "questions",
  "workbook",
  "lesson-summary",
];

test("all 28 B1 lessons use the knowledge-first Presenter spine", () => {
  const slides = getSlidesByCourse("B1");
  assert.equal(slides.length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));
  assert.equal(B1_PRESENTER_KNOWLEDGE_ASSIGNMENTS.length, 28);

  for (const slide of slides) {
    assert.equal(isB1PresenterV2Slide(slide), true, `${slide.assignmentId} should use Presenter 2.0`);
    assert.ok(getB1PresenterKnowledge(slide.assignmentId), `${slide.assignmentId} knowledge brief missing`);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    const replacement = slide.assignmentId === "B1-6.18" ? "career-challenge"
      : TEACHER_CHALLENGE_IDS.has(slide.assignmentId) ? "scenario-challenge" : "practice";
    const expectedStages = REQUIRED_STAGES.map((id) => id === "practice" ? replacement : id);
    assert.deepEqual(stageIds, expectedStages, `${slide.assignmentId} should have nine lesson stages without duplicated practice`);

    const knowledge = stages.find((stage) => stage.id === "knowledge");
    assert.equal(knowledge.type, "knowledge");
    assert.equal(knowledge.items.length, 3, `${slide.assignmentId} should have three knowledge checks`);
    assert.ok(knowledge.textDe.split(/\s+/).length >= 55, `${slide.assignmentId} knowledge brief is too thin`);

    const grammar = stages.find((stage) => stage.id === "grammar-check");
    assert.equal(grammar.type, "grammar-check");
    assert.equal(grammar.items.length, 3, `${slide.assignmentId} should use three short grammar diagnostics`);
    assert.ok(grammar.items.every((item) => item.prompt && item.answer), `${slide.assignmentId} grammar diagnostics need teacher keys`);

    if (slide.assignmentId === "B1-6.18") {
      const career = stages.find((stage) => stage.id === "career-challenge");
      assert.equal(career.type, "career-challenge");
      assert.equal(career.items.length, 6);
      assert.equal(stageIds.includes("practice"), false);
    } else if (TEACHER_CHALLENGE_IDS.has(slide.assignmentId)) {
      const challenge = stages.find((stage) => stage.id === "scenario-challenge");
      assert.equal(challenge.type, "scenario-challenge");
      assert.equal(challenge.items.length, 3);
      assert.equal(stageIds.includes("practice"), false);
    } else {
      const practice = stages.find((stage) => stage.id === "practice");
      assert.equal(practice.type, "flow");
      assert.equal(practice.items.length, 1, `${slide.assignmentId} should use one focused task rather than a drill stack`);
      assert.ok(practice.items[0].prompts?.length >= 2, `${slide.assignmentId} focused task needs actionable prompts`);
    }

    assert.equal(stageIds.includes("examples"), false, `${slide.assignmentId} should not keep a separate examples slide`);
    assert.equal(stageIds.includes("mistakes"), false, `${slide.assignmentId} should fold correction into the grammar diagnostic`);

    const questions = stages.find((stage) => stage.id === "questions");
    assert.equal(questions.type, "question-reveal");
    assert.equal(questions.items.length, 3, `${slide.assignmentId} should use three progressive speaking questions`);
    assert.equal(questions.questionModels.length, 3, `${slide.assignmentId} should preserve models for the three selected questions`);
    assert.deepEqual(questions.questionLevels, ["Easy", "Neutral", "Difficult"]);
    const difficulty = getSpeakingDifficultySelection(slide.assignmentId);
    assert.ok(difficulty, `${slide.assignmentId} needs an explicit difficulty map`);
    assert.equal(questions.difficultySource, "curated");
    assert.deepEqual(questions.difficultyIndexes, difficulty.indexes);
    assert.deepEqual(questions.items, difficulty.indexes.map((index) => slide.studentQuestionsDe[index]));

    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.equal(workbook.type, "workbook");
    assert.ok(workbook.items.length > 0, `${slide.assignmentId} should expose workbook connections`);
    assert.ok(workbook.workbookUrl, `${slide.assignmentId} should expose the workbook URL`);

    for (const removed of [
      "b1-grammar-check",
      "b1-vocabulary-retrieval",
      "b1-sentence-builder",
      "b1-guided-action",
      "b1-role-play",
      "weekly-challenge",
      "wrapup",
    ]) {
      assert.equal(stageIds.includes(removed), false, `${slide.assignmentId} still exposes repetitive stage ${removed}`);
    }
  }
});

test("full B1 rollout preserves lessons without a direct grammar URL", () => {
  const slides = getSlidesByCourse("B1");
  const withoutDirectGrammar = slides.filter((slide) => !slide.workbookConnection?.grammarUrl);
  assert.ok(withoutDirectGrammar.length > 0);

  for (const slide of withoutDirectGrammar) {
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const grammar = stages.find((stage) => stage.id === "grammar-check");
    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.equal(grammar?.items?.length, 3, `${slide.assignmentId} should still expose grammar diagnostics`);
    assert.equal(workbook?.grammarUrl, "", `${slide.assignmentId} should not invent a grammar link`);
    assert.ok(workbook?.workbookUrl, `${slide.assignmentId} should keep the workbook link`);
  }
});
