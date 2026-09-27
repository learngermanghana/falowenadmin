import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("A2 and B1 use one compact grammar diagnostic instead of reteaching grammar", () => {
  for (const level of ["A2", "B1"]) {
    for (const slide of getSlidesByCourse(level)) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const ids = stages.map((stage) => stage.id);
      const grammar = stages.find((stage) => stage.id === "grammar-check");

      assert.ok(grammar, `${slide.assignmentId} grammar diagnostic missing`);
      assert.equal(grammar.type, "grammar-check");
      assert.equal(grammar.items.length, 3, `${slide.assignmentId} should use three grammar checks`);
      assert.deepEqual(
        grammar.items.map((item) => item.label.split(" · ")[0]),
        ["1", "2", "3"],
        `${slide.assignmentId} should keep the recognise-check-apply progression`,
      );
      assert.ok(grammar.items.every((item) => item.prompt && item.answer), `${slide.assignmentId} needs teacher answer keys`);
      assert.equal(ids.includes("grammar"), false, `${slide.assignmentId} should not keep the old grammar teaching slide`);
      assert.equal(ids.includes("examples"), false, `${slide.assignmentId} should not keep a separate examples slide`);
      assert.equal(ids.includes("mistakes"), false, `${slide.assignmentId} should not keep a separate mistakes slide`);
    }
  }
});

test("every A2-C2 Presenter stage has a student action and teacher action cue", () => {
  for (const level of ["A2", "B1", "B2", "C1", "C2"]) {
    for (const slide of getSlidesByCourse(level)) {
      for (const stage of buildTeachingPresenterStages(slide, slide.topic)) {
        assert.ok(stage.teacherPurpose, `${slide.assignmentId} / ${stage.id} teacher purpose missing`);
        assert.ok(String(stage.teacherPurpose.student || "").trim(), `${slide.assignmentId} / ${stage.id} student cue missing`);
        assert.ok(String(stage.teacherPurpose.teacher || "").trim(), `${slide.assignmentId} / ${stage.id} teacher cue missing`);
      }
    }
  }
});

test("teacher-purpose guidance is normal-view only and Focus view stays clean", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");

  assert.match(presenter, /!focusMode && stage\.teacherPurpose/);
  assert.match(presenter, /aria-label="Teacher purpose"/);
  assert.match(presenter, /stage\.teacherPurpose\.student/);
  assert.match(presenter, /stage\.teacherPurpose\.teacher/);
  assert.match(presenter, /Focus view/);
  assert.match(presenter, /presenter-focus-dock/);
  assert.match(css, /\.presenter-teacher-purpose/);
  assert.match(css, /\.presenter-grammar-check-grid/);
});

test("grammar diagnostic tells the teacher not to reteach the rule", () => {
  const slide = getSlidesByCourse("A2")[0];
  const grammar = buildTeachingPresenterStages(slide, slide.topic)
    .find((stage) => stage.id === "grammar-check");

  assert.match(grammar.instruction, /bereits erklärt/i);
  assert.match(grammar.teacherPurpose.teacher, /Nicht neu unterrichten/i);
  assert.match(grammar.teacherPurpose.teacher, /Correct oder Needs review/i);
});
