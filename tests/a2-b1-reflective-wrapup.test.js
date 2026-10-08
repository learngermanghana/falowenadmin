import test from "node:test";
const TEACHER_CHALLENGE_IDS = new Set(["B1-2.5","B1-3.8","B1-4.12","B1-6.19","B1-8.25","B1-9.26"]);

import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const A2_CHALLENGE_IDS = new Set(["A2-2.4","A2-3.8","A2-6.17","A2-7.18","A2-7.20","A2-9.24","A2-3.6","A2-4.11","A2-5.13","A2-8.21","A2-10.27","A2-10.28"]);

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
        : level === "B1" && TEACHER_CHALLENGE_IDS.has(slide.assignmentId)
          ? "scenario-challenge" : level === "A2" && A2_CHALLENGE_IDS.has(slide.assignmentId) ? "scenario-challenge" : "practice";
      const practiceIndex = ids.indexOf(practiceId);
      assert.ok(practiceIndex >= 0, `${slide.assignmentId} should contain its focused practice slot`);
      assert.equal(
        ids.filter((id) => id === "practice" || id === "career-challenge" || id === "scenario-challenge").length,
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
