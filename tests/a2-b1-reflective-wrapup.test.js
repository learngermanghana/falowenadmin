import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const OLD_REPETITIVE_IDS = new Set([
  "grammar-check",
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
