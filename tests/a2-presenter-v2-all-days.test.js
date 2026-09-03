import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse, getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import {
  buildTeachingPresenterStages,
  isA2PresenterV2Slide,
  isTeachingPresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const ASSIGNMENT_IDS = [
  "A2-1.1", "A2-1.2", "A2-1.3", "A2-2.4", "A2-2.5",
  "A2-3.6", "A2-3.7", "A2-3.8", "A2-4.9", "A2-4.10",
  "A2-4.11", "A2-5.12", "A2-5.13", "A2-5.14", "A2-6.15",
  "A2-6.16", "A2-6.17", "A2-7.18", "A2-7.19", "A2-7.20",
  "A2-8.21", "A2-8.22", "A2-9.23", "A2-9.24", "A2-9.25",
  "A2-10.26", "A2-10.27", "A2-10.28",
];

const REQUIRED_STAGES = [
  "intro", "warmup", "phrases", "grammar", "examples",
  "practice", "workbook", "mistakes", "questions", "wrapup",
];

test("A2 Teaching Slides expose the complete 28-day workbook-aligned course", () => {
  const slides = getSlidesByCourse("A2");
  assert.equal(slides.length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));
  assert.deepEqual(slides.map((slide) => slide.assignmentId), ASSIGNMENT_IDS);

  slides.forEach((slide) => {
    assert.equal(getTeachingSlideByAssignmentId(slide.assignmentId)?.id, slide.id);
    assert.match(slide.day, /^Day \d+$/);
    assert.ok(slide.title.startsWith(`A2 Day ${slide.dayNumber}`), slide.assignmentId);
  });
});

test("all A2 days use Presenter 2.0 with workbook-aligned classroom support", () => {
  for (const slide of getSlidesByCourse("A2")) {
    assert.equal(isA2PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);

    assert.ok(slide.teacherSupport, `${slide.assignmentId} missing teacherSupport`);
    assert.ok(slide.workbookConnection, `${slide.assignmentId} missing workbookConnection`);
    assert.ok(slide.teacherSupport.grammarFocusEn?.length >= 3, `${slide.assignmentId} missing grammar focus`);
    assert.ok(slide.teacherSupport.modelExamplesDe?.length >= 3, `${slide.assignmentId} missing model examples`);
    assert.ok(slide.teacherSupport.commonMistakesEn?.length >= 3, `${slide.assignmentId} missing common mistakes`);
    assert.ok(slide.workbookConnection.parts?.length >= 4, `${slide.assignmentId} missing workbook bridge`);
    assert.ok(slide.workbookConnection.workbookUrl, `${slide.assignmentId} missing workbook URL`);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    REQUIRED_STAGES.forEach((stageId) => {
      assert.ok(stageIds.includes(stageId), `${slide.assignmentId} missing ${stageId}`);
    });

    const practice = stages.find((stage) => stage.id === "practice");
    const workbook = stages.find((stage) => stage.id === "workbook");
    const questions = stages.find((stage) => stage.id === "questions");

    assert.equal(practice.type, "flow");
    assert.ok(practice.items.length >= 4, `${slide.assignmentId} should have guided phases`);
    assert.ok(practice.items.some((item) => item.minutes > 0), `${slide.assignmentId} should expose timer minutes`);
    assert.equal(workbook.type, "workbook");
    assert.ok(workbook.items.length >= 4, `${slide.assignmentId} should expose workbook sections`);
    assert.match(workbook.workbookUrl, /^\/campus\/course\//, `${slide.assignmentId} workbook route`);
    assert.equal(questions.type, "question-reveal");
    assert.ok(questions.items.length >= 4, `${slide.assignmentId} should have speaking questions`);
    assert.ok(questions.supportItems.length >= 3, `${slide.assignmentId} should reveal model support`);
  }
});

test("A2 retains verified grammar routes while allowing lessons with inline grammar", () => {
  const slides = getSlidesByCourse("A2");
  const day25 = getTeachingSlideByAssignmentId("A2-9.25");
  assert.equal(day25.workbookConnection.grammarUrl, null);

  for (const slide of slides.filter((item) => item.assignmentId !== "A2-9.25")) {
    const grammarUrl = slide.workbookConnection?.grammarUrl;
    if (grammarUrl) assert.match(grammarUrl, /^\/campus\/course\//, slide.assignmentId);
  }
});

test("B1 and B2 remain fully enabled after adding A2", () => {
  const b1Slides = getSlidesByCourse("B1");
  const b2Slides = getSlidesByCourse("B2");
  assert.equal(b1Slides.length, 28);
  assert.equal(b2Slides.length, 28);
  assert.ok(b1Slides.every((slide) => isTeachingPresenterV2Slide(slide)));
  assert.ok(b2Slides.every((slide) => isTeachingPresenterV2Slide(slide)));
});
