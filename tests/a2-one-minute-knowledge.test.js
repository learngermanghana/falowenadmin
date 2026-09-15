import test from "node:test";
import assert from "node:assert/strict";

import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const A2_ASSIGNMENTS = [
  "A2-1.1", "A2-1.2", "A2-1.3", "A2-2.4", "A2-2.5", "A2-3.6", "A2-3.7", "A2-3.8",
  "A2-4.9", "A2-4.10", "A2-4.11", "A2-5.12", "A2-5.13", "A2-5.14", "A2-6.15", "A2-6.16",
  "A2-6.17", "A2-7.18", "A2-7.19", "A2-7.20", "A2-8.21", "A2-8.22", "A2-9.23", "A2-9.24",
  "A2-9.25", "A2-10.26", "A2-10.27", "A2-10.28",
];

test("all A2 chapters open with one speaking question and no one-minute reading stage", () => {
  for (const assignmentId of A2_ASSIGNMENTS) {
    const slide = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(slide, `${assignmentId} slide missing`);
    assert.ok(Array.isArray(slide.warmupQuestionsDe) && slide.warmupQuestionsDe.length > 0, `${assignmentId} warm-up question missing`);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    assert.equal(stages.some((stage) => stage.id === "knowledge"), false, `${assignmentId} must not show 1-Minute-Wissen`);

    const warmup = stages.find((stage) => stage.id === "warmup");
    assert.ok(warmup, `${assignmentId} warm-up stage missing`);
    assert.equal(warmup.title, "Warm-up question");
    assert.deepEqual(warmup.items, [slide.warmupQuestionsDe[0]], `${assignmentId} should show exactly the first warm-up question`);
    assert.equal(warmup.suggestedMinutes, 3);
  }
});

test("A2 Day 19 opens with the shopping preference question", () => {
  const slide = getTeachingSlideByAssignmentId("A2-7.19");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const warmup = stages.find((stage) => stage.id === "warmup");

  assert.deepEqual(warmup.items, ["Kaufst du lieber online oder im Geschäft?"]);
});
