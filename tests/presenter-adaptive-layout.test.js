import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("A2 and B1 presenters expose structured correction cards", () => {
  for (const level of ["A2", "B1"]) {
    const slides = getSlidesByCourse(level);
    assert.ok(slides.length > 0, `${level} slides missing`);

    for (const slide of slides) {
      const stage = buildTeachingPresenterStages(slide, slide.topic)
        .find((item) => item.id === "mistakes");
      assert.ok(stage, `${slide.assignmentId} missing mistakes stage`);
      assert.equal(stage.type, "correction-list");
      assert.ok(stage.items.length >= 1, `${slide.assignmentId} has no correction items`);
      for (const item of stage.items) {
        assert.ok(item.wrong);
        assert.ok(item.correct);
        assert.ok(item.why);
      }
    }
  }
});

test("presenter has adaptive density, paging and slide-type layout rules", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");

  assert.match(presenter, /ResizeObserver/);
  assert.match(presenter, /setFitMode\("compact"\)/);
  assert.match(presenter, /setFitMode\("tight"\)/);
  assert.match(presenter, /setContentPageSize/);
  assert.match(presenter, /presenter-content-pager/);

  for (const selector of [
    "presenter-content-knowledge",
    "presenter-stage-grammar",
    "presenter-content-vocabulary",
    "presenter-content-flow",
    "presenter-stage-questions",
    "presenter-content-workbook",
    "presenter-content-summary",
    "presenter-content-correction-list",
  ]) {
    assert.match(css, new RegExp("\\." + selector));
  }
});
