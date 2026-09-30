import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse, getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const ALLOWED_VARIANTS = new Set([
  "sentence-jumble",
  "sorting-match",
  "information-gap",
  "error-detective",
  "transformation",
  "scenario-task",
  "decision-task",
  "exam-challenge",
  "quick-check",
]);

function practiceFor(slide) {
  return buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "practice");
}

test("A2 and B1 focused practice now exposes visible weekly variation", () => {
  for (const level of ["A2", "B1"]) {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);

    const variants = new Set();
    const weeklyFamilies = new Set();

    for (const slide of slides) {
      const practice = practiceFor(slide);
      assert.ok(practice, `${slide.assignmentId} practice missing`);
      assert.equal(practice.type, "flow");
      assert.ok(ALLOWED_VARIANTS.has(practice.variant), `${slide.assignmentId} has unsupported practice variant ${practice.variant}`);
      assert.ok(practice.variantLabel, `${slide.assignmentId} variant label missing`);
      assert.ok(practice.weekNumber >= 1 && practice.weekNumber <= 10, `${slide.assignmentId} week missing`);
      assert.ok(practice.weekFamily, `${slide.assignmentId} weekly family missing`);
      assert.ok(["weekly-profile", "lesson-override"].includes(practice.variantSource));
      variants.add(practice.variant);
      weeklyFamilies.add(practice.weekFamily);
    }

    assert.ok(variants.size >= 6, `${level} should visibly rotate across at least six activity formats`);
    assert.deepEqual(
      [...weeklyFamilies],
      [
        "Jumbled sentences & sorting",
        "Information gaps & matching",
        "Error detective & transformation",
        "Scenarios & decisions",
        "Exam-style challenge",
      ],
      `${level} should preserve the five planned weekly practice families`,
    );
  }
});

test("sentence-jumble weeks build real jumbled German from lesson model sentences", () => {
  for (const level of ["A2", "B1"]) {
    const slides = getSlidesByCourse(level);
    const jumbleStages = slides
      .map((slide) => ({ slide, practice: practiceFor(slide) }))
      .filter(({ practice }) => practice.variant === "sentence-jumble");

    assert.ok(jumbleStages.length >= 1, `${level} should keep at least one real jumbled-sentence lesson`);

    for (const { slide, practice } of jumbleStages) {
      const jumbles = practice.items[0]?.jumbles || [];
      assert.ok(jumbles.length >= 1, `${slide.assignmentId} should generate a jumbled sentence`);
      for (const jumble of jumbles) {
        assert.ok(jumble.answer.split(/\s+/).length >= 4);
        assert.ok(jumble.words.length >= 4);
        assert.notEqual(jumble.words.join(" "), jumble.answer.replace(/[.!?]+$/g, ""), `${slide.assignmentId} must not show the answer in original word order`);
      }
    }
  }
});

test("lesson-specific activities override the weekly fallback when their format is explicit", () => {
  const cases = [
    ["A2-2.4", "information-gap"],
    ["A2-4.9", "error-detective"],
    ["A2-5.13", "transformation"],
    ["B1-3.9", "scenario-task"],
    ["B1-9.26", "decision-task"],
  ];

  for (const [assignmentId, expectedVariant] of cases) {
    const slide = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(slide, `${assignmentId} slide missing`);
    const practice = practiceFor(slide);
    assert.equal(practice.variant, expectedVariant, assignmentId);
    assert.equal(practice.variantSource, "lesson-override", assignmentId);
  }
});

test("weekly fallback reaches exam-style practice in weeks 9 and 10", () => {
  for (const level of ["A2", "B1"]) {
    const slides = getSlidesByCourse(level).filter((slide) => {
      const practice = practiceFor(slide);
      return practice.weekNumber >= 9 && practice.variantSource === "weekly-profile";
    });
    assert.ok(slides.length >= 1, `${level} should keep at least one weekly-profile lesson in the exam phase`);
    for (const slide of slides) {
      assert.equal(practiceFor(slide).variant, "exam-challenge", slide.assignmentId);
    }
  }
});
