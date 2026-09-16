import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

function grammarStage(slide) {
  return buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "b1-grammar-check");
}

test("B1 grammar correction models include teacher-facing explanations", () => {
  const slides = getSlidesByCourse("B1");
  let modelCount = 0;

  for (const slide of slides) {
    const stage = grammarStage(slide);
    if (!stage) continue;

    for (const model of stage.questionModels || []) {
      modelCount += 1;
      assert.ok(Array.isArray(model.teacherGuideItems), `${slide.assignmentId} should expose teacherGuideItems`);
      assert.ok(model.teacherGuideItems.length >= 2, `${slide.assignmentId} needs a useful teacher explanation`);
      assert.ok(model.teacherGuideItems.every((item) => String(item || "").trim()), `${slide.assignmentId} has an empty guide item`);
    }
  }

  assert.ok(modelCount >= 20, "expected B1 correction models across the course");
});

test("B1 Day 12 explains the während word-order correction", () => {
  const slide = getSlidesByCourse("B1").find((entry) => entry.assignmentId === "B1-4.12");
  assert.ok(slide, "B1-4.12 slide missing");
  const stage = grammarStage(slide);
  const model = stage?.questionModels?.find((entry) => entry.questionDe.includes("Während wir wanderten"));
  assert.ok(model, "während correction model missing");
  assert.equal(model.modelAnswerDe, "Während wir wanderten, begann es zu regnen.");

  const guide = model.teacherGuideItems.join(" ");
  assert.match(guide, /subordinate clause|Nebensatz/i);
  assert.match(guide, /begann es/i);
  assert.match(guide, /position 1/i);
  assert.match(guide, /While we were hiking/i);
});

test("B1 Day 12 explains Plusquamperfekt after nachdem", () => {
  const slide = getSlidesByCourse("B1").find((entry) => entry.assignmentId === "B1-4.12");
  const stage = grammarStage(slide);
  const model = stage?.questionModels?.find((entry) => entry.questionDe.includes("Nachdem wir sind angekommen"));
  assert.ok(model, "nachdem correction model missing");
  assert.equal(model.modelAnswerDe, "Nachdem wir angekommen waren, bauten wir das Zelt auf.");

  const guide = model.teacherGuideItems.join(" ");
  assert.match(guide, /Plusquamperfekt/);
  assert.match(guide, /Präteritum/);
  assert.match(guide, /sind angekommen/);
  assert.match(guide, /waren angekommen/);
  assert.match(guide, /After we had arrived/i);
});
