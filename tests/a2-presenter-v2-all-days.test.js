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
  "intro", "warmup", "common-mistakes", "reading", "grammar-check",
  "workbook-presentation", "questions", "workbook", "lesson-summary",
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
    assert.ok(slide.workbookConnection.parts?.length >= 3, `${slide.assignmentId} missing workbook bridge`);
    assert.ok(slide.workbookConnection.workbookUrl, `${slide.assignmentId} missing workbook URL`);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    REQUIRED_STAGES.forEach((stageId) => {
      assert.ok(stageIds.includes(stageId), `${slide.assignmentId} missing ${stageId}`);
    });
    assert.equal(stageIds.includes("wrapup"), false, `${slide.assignmentId} should not show the redundant mini-presentation slide`);

    const grammarCheck = stages.find((stage) => stage.id === "grammar-check");
    const practice = stages.find((stage) => stage.id === "practice");
    const challenge = stages.find((stage) => stage.id === "scenario-challenge");
    const workbook = stages.find((stage) => stage.id === "workbook");
    const questions = stages.find((stage) => stage.id === "questions");

    assert.equal(grammarCheck.type, "grammar-check");
    assert.equal(grammarCheck.items.length, 3, `${slide.assignmentId} should use three short grammar diagnostics`);
    assert.deepEqual(
      grammarCheck.items.map((item) => item.id),
      ["recognise-rule", grammarCheck.items[1].id, "build-sentence"],
    );
    assert.ok(grammarCheck.items.every((item) => item.prompt && item.answer), `${slide.assignmentId} grammar checks need teacher keys`);
    assert.equal(stageIds.includes("grammar"), false, `${slide.assignmentId} should not reteach grammar in a separate slide`);
    assert.equal(stageIds.includes("examples"), false, `${slide.assignmentId} should not keep a separate examples slide`);
    assert.equal(stageIds.includes("mistakes"), false, `${slide.assignmentId} should fold correction into the grammar check`);

    // Every A2 day uses exactly one modern scenario in the existing practice slot.
    assert.equal(practice, undefined, slide.assignmentId);
    assert.ok(challenge, slide.assignmentId);
    assert.equal(challenge.type, "scenario-challenge");
    assert.equal(challenge.items.length, 3, slide.assignmentId);
    assert.ok(challenge.items.every(item => item.steps.length === 3), slide.assignmentId);
    assert.ok(challenge.suggestedMinutes > 0, slide.assignmentId);
    assert.equal(workbook.type, "clarification");
    assert.equal(workbook.items.length, 3);
    assert.equal(workbook.title, "Was ist noch unklar?");
    assert.ok(stageIds.indexOf("questions") < stageIds.indexOf("workbook"), `${slide.assignmentId} production should come before workbook bridge`);
    assert.equal(questions.type, "list");
    assert.equal(questions.title, "Ein Satz zum Schluss");
    assert.equal(questions.suggestedMinutes, 1);
    assert.equal(questions.items.length, 1);
    assert.match(questions.items[0], /…/);
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
