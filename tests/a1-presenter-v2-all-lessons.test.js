import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { a1WorkbookAlignedSlidesDays1To5 } from "../src/data/a1WorkbookAlignedSlidesDays1To5.js";
import { a1WorkbookAlignedSlidesDays6To10 } from "../src/data/a1WorkbookAlignedSlidesDays6To10.js";
import {
  buildTeachingPresenterStages,
  isA1PresenterV2Slide,
  isTeachingPresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const REQUIRED_CORE_STAGES = [
  "intro", "warmup", "phrases", "grammar", "examples",
  "practice", "mistakes", "questions", "wrapup",
];

const WORKBOOK_ALIGNED = [
  ...a1WorkbookAlignedSlidesDays1To5,
  ...a1WorkbookAlignedSlidesDays6To10,
];

function isTutorial(slide = {}) {
  return String(slide.assignmentId || "").trim().toUpperCase() === "A1-TUTORIAL";
}

test("all real A1 teaching lessons use Presenter 2.0 while orientation stays classic", () => {
  const slides = getSlidesByCourse("A1");
  assert.ok(slides.length > WORKBOOK_ALIGNED.length, "A1 should include later lessons beyond Day 10");

  for (const slide of slides) {
    if (isTutorial(slide)) {
      assert.equal(isA1PresenterV2Slide(slide), false);
      continue;
    }

    assert.equal(isA1PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const ids = stages.map((stage) => stage.id);
    REQUIRED_CORE_STAGES.forEach((stageId) => {
      assert.ok(ids.includes(stageId), `${slide.assignmentId} missing ${stageId}`);
    });

    const questions = stages.find((stage) => stage.id === "questions");
    const practice = stages.find((stage) => stage.id === "practice");
    assert.equal(questions.type, "question-reveal", slide.assignmentId);
    assert.ok(questions.supportItems.length >= 3, `${slide.assignmentId} missing model support`);
    assert.equal(practice.type, "flow", slide.assignmentId);
    assert.ok(practice.items.some((item) => item.minutes > 0), `${slide.assignmentId} missing timer-ready practice`);
  }
});

test("A1 workbook-aligned Day 1-10 lessons retain their real workbook bridge", () => {
  assert.ok(WORKBOOK_ALIGNED.length >= 10);

  for (const slide of WORKBOOK_ALIGNED) {
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.ok(workbook, `${slide.assignmentId} missing workbook stage`);
    assert.ok(workbook.items.length >= 3, `${slide.assignmentId} missing workbook parts`);
    assert.match(workbook.workbookUrl, /^\/campus\/course\//, `${slide.assignmentId} workbook route`);
  }
});

test("later A1 generic lessons do not invent workbook links", () => {
  const alignedIds = new Set(WORKBOOK_ALIGNED.map((slide) => String(slide.assignmentId || "").toUpperCase()));
  const laterSlides = getSlidesByCourse("A1").filter((slide) => !isTutorial(slide) && !alignedIds.has(String(slide.assignmentId || "").toUpperCase()));
  assert.ok(laterSlides.length > 0);

  for (const slide of laterSlides) {
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const workbook = stages.find((stage) => stage.id === "workbook");
    if (workbook) {
      assert.equal(workbook.workbookUrl, "", `${slide.assignmentId} should not invent a workbook URL`);
      assert.equal(workbook.grammarUrl, "", `${slide.assignmentId} should not invent a grammar URL`);
    }
  }
});
