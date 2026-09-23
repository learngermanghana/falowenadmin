import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

for (const level of ["A2", "B1"]) {
  test(level + " warm-up questions expose keyword and optional support", () => {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);

    for (const slide of slides) {
      const warmup = buildTeachingPresenterStages(slide, slide.topic)
        .find((stage) => stage.id === "warmup");

      assert.ok(warmup, slide.assignmentId + " warm-up missing");
      assert.equal(warmup.questionSupport.length, warmup.items.length, slide.assignmentId + " support count");

      warmup.questionSupport.forEach((support, index) => {
        assert.ok(Array.isArray(support.keywords), slide.assignmentId + " keywords missing");
        assert.ok(support.keywords.length >= 1 && support.keywords.length <= 3, slide.assignmentId + " keyword count");
        assert.ok(String(support.hintEn || "").trim(), slide.assignmentId + " English hint missing");
        assert.ok(String(support.answerStarterDe || "").trim(), slide.assignmentId + " answer starter missing");
        assert.ok(String(support.followUpDe || "").trim(), slide.assignmentId + " follow-up missing");
        assert.ok(["Easy", "Extend", "Challenge"].includes(support.difficulty), slide.assignmentId + " difficulty marker");
        if (index === 0) assert.equal(support.difficulty, "Easy", slide.assignmentId + " first warm-up should start easy");
      });

      if (warmup.questionSupport.length >= 3) {
        assert.equal(
          warmup.questionSupport[warmup.questionSupport.length - 1].difficulty,
          "Challenge",
          slide.assignmentId + " final warm-up should be the challenge",
        );
      }
    }
  });
}

test("advanced B2/C1/C2 warm-ups keep the existing simple list behavior", () => {
  for (const level of ["B2", "C1", "C2"]) {
    const slide = getSlidesByCourse(level)[0];
    const warmup = buildTeachingPresenterStages(slide, slide.topic)
      .find((stage) => stage.id === "warmup");

    assert.ok(warmup);
    assert.deepEqual(warmup.questionSupport || [], [], level + " should not get A2/B1 support controls");
  }
});

test("presenter renders highlighted keywords with optional hint, starter and follow-up", () => {
  const source = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");

  assert.match(source, /presenter-warmup-keyword/);
  assert.match(source, /Hint \(EN\)/);
  assert.match(source, /Answer starter/);
  assert.match(source, /Follow-up/);
  assert.match(source, /presenter-warmup-difficulty/);
  assert.match(css, /\.presenter-warmup-question-card/);
  assert.match(css, /\.presenter-warmup-keyword/);
  assert.match(css, /\.presenter-warmup-support-actions/);
});
