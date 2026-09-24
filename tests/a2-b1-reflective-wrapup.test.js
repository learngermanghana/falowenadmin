import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

for (const level of ["A2", "B1"]) {
  test(`${level} final presenter stages use reflection instead of repeated topic questions`, () => {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28);

    for (const slide of slides) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const ids = stages.map((stage) => stage.id);

      assert.ok(ids.includes("learning-reflection"), `${slide.assignmentId} missing learning reflection`);
      assert.ok(ids.includes("learning-exit-ticket"), `${slide.assignmentId} missing exit reflection`);
      assert.equal(ids.includes("guided-action"), false, `${slide.assignmentId} still has repeated guided-action stage`);
      assert.equal(ids.includes("role-play"), false, `${slide.assignmentId} still has repeated role-play stage`);
      assert.equal(ids.includes("b1-guided-action"), false, `${slide.assignmentId} still has repeated B1 guided-action stage`);
      assert.equal(ids.includes("b1-role-play"), false, `${slide.assignmentId} still has repeated B1 role-play stage`);

      assert.deepEqual(ids.slice(-3), ["learning-reflection", "learning-exit-ticket", "coursebook-bridge"], `${slide.assignmentId} final reflection, exit ticket and Course Book bridge`);

      const reflection = stages.find((stage) => stage.id === "learning-reflection");
      assert.equal(reflection.title, "Was hast du heute gelernt?");
      assert.ok(reflection.items.some((item) => /Welche Grammatik hast du heute gelernt/i.test(item)), slide.assignmentId);
      assert.ok(reflection.items.some((item) => /eigenen Satz/i.test(item)), slide.assignmentId);

      const exit = stages.find((stage) => stage.id === "learning-exit-ticket");
      assert.equal(exit.title, "Was nimmst du mit?");
      assert.ok(exit.items.some((item) => /besser als vorher/i.test(item)), slide.assignmentId);

      const repeatedQuestions = new Set((slide.studentQuestionsDe || []).map((item) => String(item).trim()));
      for (const item of [...reflection.items, ...exit.items]) {
        assert.equal(repeatedQuestions.has(String(item).trim()), false, `${slide.assignmentId} repeats a student question`);
      }
    }
  });

  test(`${level} removes the redundant mini-presentation page from every lesson`, () => {
    for (const slide of getSlidesByCourse(level)) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const ids = stages.map((stage) => stage.id);
      const renderedText = stages.map((stage) => [
        stage.title,
        stage.body,
        ...(Array.isArray(stage.items) ? stage.items : []),
      ].filter(Boolean).join(" ")).join(" ");

      assert.equal(ids.includes("wrapup"), false, `${slide.assignmentId} still has a wrap-up page`);
      assert.doesNotMatch(renderedText, /Mini-Präsentation/);
      assert.doesNotMatch(renderedText, /Heute möchte ich über das Thema/);
    }
  });
}

test("A2 Day 4 no longer renders the meeting mini-presentation prompt", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-2.4");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const renderedText = stages.map((stage) => [
    stage.title,
    stage.body,
    ...(Array.isArray(stage.items) ? stage.items : []),
  ].filter(Boolean).join(" ")).join(" ");

  assert.doesNotMatch(renderedText, /Plane ein Treffen in 4–5 Sätzen/);
  assert.doesNotMatch(renderedText, /Heute möchte ich über das Thema/);
  assert.equal(stages.some((stage) => stage.id === "wrapup"), false);
});
