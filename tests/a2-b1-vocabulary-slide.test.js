import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

for (const level of ["A2", "B1"]) {
  test(`${level} replaces the old repeated key-phrases page with one vocabulary slide`, () => {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);

    for (const slide of slides) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const vocabulary = stages.find((stage) => stage.id === "phrases");

      assert.ok(vocabulary, `${slide.assignmentId} vocabulary stage missing`);
      assert.equal(vocabulary.type, "vocabulary", `${slide.assignmentId} should use vocabulary renderer`);
      assert.equal(vocabulary.kicker, "Wortschatz");
      assert.equal(vocabulary.title, "Wortschatz für heute");
      assert.match(vocabulary.instruction, /mindestens zwei/i);
      assert.ok(vocabulary.items.length >= 4, `${slide.assignmentId} needs useful vocabulary`);

      vocabulary.items.forEach((item, index) => {
        assert.equal(typeof item.term, "string");
        assert.ok(item.term.trim().length > 0, `${slide.assignmentId} vocabulary item ${index + 1} is empty`);
        assert.equal(item.number, index + 1);
        assert.ok(!item.example || item.example !== item.term, `${slide.assignmentId} should not repeat the exact term as its example`);
      });
    }
  });
}

test("the vocabulary change does not add an extra presenter stage", () => {
  for (const level of ["A2", "B1"]) {
    for (const slide of getSlidesByCourse(level)) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      assert.equal(stages.filter((stage) => stage.id === "phrases").length, 1, `${slide.assignmentId} duplicated vocabulary stage`);
      assert.equal(stages.some((stage) => stage.id === "vocabulary"), false, `${slide.assignmentId} should replace, not add, a stage`);
    }
  }
});

test("TeachingSlidePresenter renders vocabulary cards and a speaking prompt", () => {
  const source = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");

  assert.match(source, /stage\.type === "vocabulary"/);
  assert.match(source, /presenter-vocabulary-card/);
  assert.match(source, /Beispiel:/);
  assert.match(source, /<strong>Sprich:<\/strong>/);
  assert.match(css, /\.presenter-vocabulary-grid/);
  assert.match(css, /\.presenter-vocabulary-card/);
});
