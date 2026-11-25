import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("A2 Day 8 presenter uses a restaurant scenario challenge", () => {
  const slide = getSlidesByCourse("A2").find(item => item.assignmentId === "A2-3.8");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const practice = stages.find(stage => stage.id === "scenario-challenge");
  assert.equal(practice.title, "Restaurant Challenge");
  assert.equal(practice.items.length, 3);
  assert.ok(practice.items.every(item => item.steps.length === 3));
  assert.ok(!stages.some(stage => stage.id === "practice"));
});

test("A2 Day 8 ends with a single restaurant sentence", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-3.8");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const speaking = stages.find((stage) => stage.id === "questions");

  assert.ok(speaking);
  assert.deepEqual(speaking.items, ["Ich hätte gern …"]);
  assert.equal(speaking.suggestedMinutes, 1);
});
