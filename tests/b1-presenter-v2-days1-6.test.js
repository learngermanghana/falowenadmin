import test from "node:test";
import assert from "node:assert/strict";

import { b1WorkbookAlignedSlidesDays1To10 } from "../src/data/b1WorkbookAlignedSlidesDays1To10.js";
import {
  buildTeachingPresenterStages,
  isB1PresenterV2Slide,
  parsePresenterMinutes,
} from "../src/utils/teachingPresenter.js";

const firstSix = b1WorkbookAlignedSlidesDays1To10.filter((slide) => slide.dayNumber >= 1 && slide.dayNumber <= 6);

test("B1 Day 1-6 use Presenter 2.0 stages", () => {
  assert.equal(firstSix.length, 6);

  firstSix.forEach((slide) => {
    assert.equal(isB1PresenterV2Slide(slide), true, slide.assignmentId);
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);

    ["intro", "warmup", "phrases", "grammar", "examples", "practice", "workbook", "mistakes", "questions", "wrapup"]
      .forEach((stageId) => assert.ok(stageIds.includes(stageId), `${slide.assignmentId} missing ${stageId}`));

    const questionStage = stages.find((stage) => stage.id === "questions");
    assert.equal(questionStage.type, "question-reveal");
    assert.ok(questionStage.items.length >= 1);
    assert.ok(questionStage.supportItems.length >= 1);

    const practiceStage = stages.find((stage) => stage.id === "practice");
    assert.ok(practiceStage.items.some((item) => item.minutes > 0));
  });
});

test("B1 Day 7 remains on the classic presenter until rollout expands", () => {
  const day7 = b1WorkbookAlignedSlidesDays1To10.find((slide) => slide.dayNumber === 7);
  assert.ok(day7);
  assert.equal(isB1PresenterV2Slide(day7), false);

  const stages = buildTeachingPresenterStages(day7, day7.topic);
  assert.deepEqual(stages.map((stage) => stage.id), ["intro", "warmup", "phrases", "questions", "wrapup"]);
  assert.equal(stages.find((stage) => stage.id === "questions")?.type, "numbered-list");
});

test("presenter minute parser reads the B1 interaction-flow format", () => {
  assert.equal(parsePresenterMinutes("6 min: students discuss."), 6);
  assert.equal(parsePresenterMinutes("12 min: speaking rehearsal."), 12);
  assert.equal(parsePresenterMinutes("No timer"), 0);
});
