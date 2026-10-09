import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { buildA1SlideReviewChecks } from "../src/data/a1SlideReview.js";

test("A1 workbook/self-practice review cards reuse only the lesson's factual teacher answers", () => {
  const slides = getSlidesByCourse("A1").filter((slide) =>
    !["A1-TUTORIAL", "A1-5.9"].includes(String(slide.assignmentId || "").toUpperCase()));
  assert.ok(slides.length >= 20);
  let covered = 0;
  let totalReviewCards = 0;
  for (const slide of slides) {
    const checks = getA1PresenterUnderstandingChecks(
      slide.assignmentId,
      getA1GrammarChecks(slide.assignmentId, slide),
      { slide, support: buildTeacherSlideSupport(slide) },
    );
    const reviews = buildA1SlideReviewChecks(checks, 2);
    assert.ok(reviews.length <= 2, slide.assignmentId + ": too many slide review questions");
    assert.equal(new Set(reviews.map((q) => q.questionDe)).size, reviews.length,
      slide.assignmentId + ": duplicate review prompts");
    for (const review of reviews) {
      const source = checks.find((entry) =>
        entry.questionDe.replace(/\s+/g, " ").trim() === review.questionDe);
      assert.ok(source, slide.assignmentId + ": review question not in authored lesson");
      assert.equal(review.answerDe, String(source.answerDe).replace(/\s+/g, " ").trim(),
        slide.assignmentId + ": answer differs from the lesson's verified answer");
      assert.doesNotMatch(review.answerDe, /^Accept\b|^The teacher\b/i,
        slide.assignmentId + ": generic teacher judgment must not be presented as a correct answer");
      totalReviewCards++;
    }
    if (reviews.length) covered++;
  }
  assert.ok(covered >= 20, "at least 20 A1 lessons need verified slide review questions");
  assert.ok(totalReviewCards >= 30, "A1 needs enough verified answer examples to support lesson review");
});

test("review cards with no verified answers are omitted rather than invented", () => {
  const source = [
    { questionDe: "Was heißt ß?", answerDe: "Eszett." },
    { questionDe: "What do you know?", answerDe: "Accept a short correct A1 answer." },
    { questionDe: "  Was heißt ß?  ", answerDe: "Eszett." },
    { questionDe: "Wie viele?", answerDe: "26." },
  ];
  assert.deepEqual(buildA1SlideReviewChecks(source, 0), []);
  assert.deepEqual(buildA1SlideReviewChecks(source, 2).map((item) => item.questionDe),
    ["Was heißt ß?", "Wie viele?"]);
  assert.equal(buildA1SlideReviewChecks(source, 2)[0].answerDe, "Eszett.");
});

test("A1 assignments and self-practice display hidden answers without progress widgets", () => {
  const source = fs.readFileSync("src/components/A1GrammarPresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");
  assert.match(source, /reviewChecks: buildA1SlideReviewChecks\(mainChecks, 2\)/);
  assert.match(source, /Lesson-specific understanding review/);
  assert.match(source, /stage.reviewChecks\.map/);
  assert.match(source, /<details key=\{item.questionDe\}/);
  assert.match(source, /Richtige Antwort:/);
  assert.match(source, /stage.activityKind === "self-practice"/);
  assert.match(source, /stage.activityKind === "tutor-marked"/);
  assert.match(source, /stage.actionLabel/);
  assert.match(css, /\.presenter-a1-review-checks-grid/);
  assert.doesNotMatch(source, /Student Learning Progress|Self-practice completion tracking/);
});
