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

test("all A2 chapters keep a usable warm-up and no one-minute reading stage", () => {
  for (const assignmentId of A2_ASSIGNMENTS) {
    const slide = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(slide, `${assignmentId} slide missing`);
    assert.ok(Array.isArray(slide.warmupQuestionsDe) && slide.warmupQuestionsDe.length > 0, `${assignmentId} warm-up question missing`);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    assert.equal(stages.some((stage) => stage.id === "knowledge"), false, `${assignmentId} must not show 1-Minute-Wissen`);
    const warmup = stages.find((stage) => stage.id === "warmup");
    assert.ok(warmup, `${assignmentId} warm-up stage missing`);
    assert.ok(Array.isArray(warmup.items) && warmup.items.length > 0, `${assignmentId} warm-up items missing`);
  }
});

test("A2 Day 19 adds five actionable activity slides without removing core lesson stages", () => {
  const slide = getTeachingSlideByAssignmentId("A2-7.19");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const ids = stages.map((stage) => stage.id);

  for (const id of ["intro", "warmup", "phrases", "grammar", "examples", "practice", "workbook", "mistakes", "questions", "wrapup"]) {
    assert.ok(ids.includes(id), `Day 19 missing core stage ${id}`);
  }
  for (const id of ["grammar-check", "vocabulary-retrieval", "sentence-builder", "guided-action", "role-play"]) {
    const stage = stages.find((entry) => entry.id === id);
    assert.ok(stage, `Day 19 missing interactive stage ${id}`);
    assert.equal(stage.type, "question-reveal", `${id} must use actionable question UI`);
    assert.ok(stage.items.length >= 3, `${id} needs enough questions for classroom rotation`);
    assert.equal(stage.requiresQuestionModel, true, `${id} must expose model-answer checking`);
  }
  assert.equal(new Set(ids).size, ids.length, "Day 19 presenter must not contain duplicate stage IDs");
  assert.ok(stages.length >= 15, `Day 19 should expose at least 15 slides, got ${stages.length}`);
});
