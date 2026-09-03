import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import {
  buildTeachingPresenterStages,
  isB1PresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const REQUIRED_STAGES = [
  "intro",
  "warmup",
  "phrases",
  "grammar",
  "examples",
  "practice",
  "workbook",
  "mistakes",
  "questions",
  "wrapup",
];

test("all 28 B1 lessons use Presenter 2.0", () => {
  const slides = getSlidesByCourse("B1");
  assert.equal(slides.length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));

  for (const slide of slides) {
    assert.equal(isB1PresenterV2Slide(slide), true, `${slide.assignmentId} should use Presenter 2.0`);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    REQUIRED_STAGES.forEach((stageId) => {
      assert.ok(stageIds.includes(stageId), `${slide.assignmentId} missing ${stageId}`);
    });

    const questions = stages.find((stage) => stage.id === "questions");
    assert.equal(questions?.type, "question-reveal", `${slide.assignmentId} should reveal one question at a time`);
    assert.ok(questions?.items?.length > 0, `${slide.assignmentId} should have speaking questions`);
    assert.ok(questions?.supportItems?.length > 0, `${slide.assignmentId} should have model support`);

    const practice = stages.find((stage) => stage.id === "practice");
    assert.equal(practice?.type, "flow");
    assert.ok(practice?.items?.length >= 4, `${slide.assignmentId} should expose guided classroom flow`);
    assert.ok(practice.items.some((item) => item.minutes > 0), `${slide.assignmentId} should expose activity timing`);

    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.equal(workbook?.type, "workbook");
    assert.ok(workbook?.items?.length > 0, `${slide.assignmentId} should expose workbook connections`);
    assert.ok(workbook?.workbookUrl, `${slide.assignmentId} should expose the workbook URL`);
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
