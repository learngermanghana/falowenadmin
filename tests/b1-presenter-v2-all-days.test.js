import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { B1_PRESENTER_KNOWLEDGE_ASSIGNMENTS, getB1PresenterKnowledge } from "../src/data/b1PresenterKnowledge.js";
import {
  buildTeachingPresenterStages,
  isB1PresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const REQUIRED_STAGES = [
  "intro",
  "warmup",
  "knowledge",
  "phrases",
  "grammar",
  "examples",
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
    assert.deepEqual(stageIds, REQUIRED_STAGES, `${slide.assignmentId} should use the stable B1 teaching spine`);

    const knowledge = stages.find((stage) => stage.id === "knowledge");
    assert.equal(knowledge.type, "knowledge");
    assert.equal(knowledge.items.length, 3, `${slide.assignmentId} should have three knowledge checks`);
    assert.ok(knowledge.textDe.split(/\s+/).length >= 55, `${slide.assignmentId} knowledge brief is too thin`);

    const grammar = stages.find((stage) => stage.id === "grammar");
    assert.equal(grammar.type, "b1-grammar");
    assert.ok(grammar.items.length >= 3, `${slide.assignmentId} should keep visible grammar support`);
    assert.ok(grammar.items.every((item) => item.supportEn), `${slide.assignmentId} grammar needs concise English support`);

    const practice = stages.find((stage) => stage.id === "practice");
    assert.equal(practice.type, "flow");
    assert.equal(practice.items.length, 1, `${slide.assignmentId} should use one focused task rather than a drill stack`);
    assert.ok(practice.items[0].prompts?.length >= 2, `${slide.assignmentId} focused task needs actionable prompts`);

    const questions = stages.find((stage) => stage.id === "questions");
    assert.equal(questions.type, "question-reveal");
    assert.equal(questions.items.length, 5, `${slide.assignmentId} should preserve the five speaking questions`);
    assert.equal(questions.questionModels.length, 5, `${slide.assignmentId} should preserve speaking models`);

    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.equal(workbook.type, "workbook");
    assert.ok(workbook.items.length > 0, `${slide.assignmentId} should expose workbook connections`);
    assert.ok(workbook.workbookUrl, `${slide.assignmentId} should expose the workbook URL`);

    for (const removed of [
      "mistakes",
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
    const grammar = stages.find((stage) => stage.id === "grammar");
    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.ok(grammar?.items?.length > 0, `${slide.assignmentId} should still show teacher grammar focus`);
    assert.equal(workbook?.grammarUrl, "", `${slide.assignmentId} should not invent a grammar link`);
    assert.ok(workbook?.workbookUrl, `${slide.assignmentId} should keep the workbook link`);
  }
});
