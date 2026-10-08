import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const OLD_REPETITIVE_IDS = new Set([
  "vocabulary-retrieval",
  "sentence-builder",
  "guided-action",
  "role-play",
  "b1-grammar-check",
  "b1-vocabulary-retrieval",
  "b1-sentence-builder",
  "b1-guided-action",
  "b1-role-play",
  "learning-reflection",
  "learning-exit-ticket",
  "weekly-challenge",
  "wrapup",
]);

for (const level of ["A2", "B1"]) {
  test(`${level} ends with speaking, workbook connection and lesson summary without another speaking challenge`, () => {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);

    for (const slide of slides) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const ids = stages.map((stage) => stage.id);

      assert.deepEqual(ids.slice(-3), ["questions", "workbook", "lesson-summary"], `${slide.assignmentId} should finish with production, workbook and summary`);
      assert.equal(ids.filter((id) => id === "grammar-check").length, 1, `${slide.assignmentId} should contain one compact grammar diagnostic`);
      const practiceId = level === "B1" && slide.assignmentId === "B1-6.18"
        ? "career-challenge"
        : "practice";
      const practiceIndex = ids.indexOf(practiceId);
      assert.ok(practiceIndex >= 0, `${slide.assignmentId} should contain its focused practice slot`);
      assert.equal(
        ids.filter((id) => id === "practice" || id === "career-challenge").length,
        1,
        `${slide.assignmentId} should keep exactly one focused practice slide`,
      );
      assert.ok(ids.indexOf("grammar-check") < practiceIndex, `${slide.assignmentId} grammar diagnostic should happen before practice`);

      for (const oldId of OLD_REPETITIVE_IDS) {
        assert.equal(ids.includes(oldId), false, `${slide.assignmentId} still exposes repetitive ending ${oldId}`);
      }
    }
  });
}

test("B1 Day 15 uses a Homeoffice case study instead of another interview challenge", () => {
  const slide = getSlidesByCourse("B1").find((item) => item.assignmentId === "B1-5.15");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const practice = stages.find((stage) => stage.id === "practice");

  assert.match(practice.title, /Fallstudie/i);
  assert.match(JSON.stringify(practice), /Erreichbarkeitszeiten/i);
  assert.equal(stages.some((stage) => stage.id === "weekly-challenge"), false);
});
