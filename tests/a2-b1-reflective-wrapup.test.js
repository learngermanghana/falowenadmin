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

      assert.deepEqual(ids.slice(-2), ["learning-reflection", "learning-exit-ticket"], `${slide.assignmentId} final two stages`);

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

  test(`${level} wrap-up keeps the lesson task but presents it as connected speech`, () => {
    for (const slide of getSlidesByCourse(level)) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const wrapup = stages.find((stage) => stage.id === "wrapup");
      assert.ok(wrapup, `${slide.assignmentId} missing wrap-up`);
      assert.equal(wrapup.title, "Mini-Präsentation");
      assert.match(wrapup.body, /Heute möchte ich über das Thema/);
      assert.match(wrapup.body, /Zusammenfassend/);

      const original = String(slide.wrapUpTaskDe || "").trim();
      if (original) assert.ok(wrapup.body.includes(original), `${slide.assignmentId} lost lesson-specific wrap-up task`);
    }
  });
}

test("A2 person-description wrap-up preserves the grammar target inside presentation form", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-1.2");
  assert.ok(slide);
  const wrapup = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "wrapup");
  assert.match(wrapup.body, /Heute möchte ich über das Thema/);
  assert.match(wrapup.body, /reale Person/i);
  assert.match(wrapup.body, /ein\/eine\/einen|ein.*Adjektiv.*Nomen/i);
  assert.match(wrapup.body, /weil/i);
});
