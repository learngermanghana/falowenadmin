import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getA2PresenterKnowledge } from "../src/data/a2PresenterKnowledge.js";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("presenter focus view hides teacher chrome but keeps compact navigation", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");

  assert.match(presenter, /const \[focusMode, setFocusMode\] = useState\(false\)/);
  assert.match(presenter, /Focus view/);
  assert.match(presenter, /Show marking/);
  assert.match(presenter, /presenter-focus-dock/);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-topbar/);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-student-picker/);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-footer/);
  assert.match(css, /\.presenter-focus-dock/);
});

test("A2 knowledge tells learners exactly how to use the text and Day 22 discovery is A2-clear", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-8.22");
  assert.ok(slide, "A2-8.22 slide missing");

  const knowledgeStage = buildTeachingPresenterStages(slide, slide.topic)
    .find((stage) => stage.id === "knowledge");
  assert.equal(
    knowledgeStage.instruction,
    "Lest den kurzen Text 1 Minute. Beantwortet danach die Fragen mündlich.",
  );

  const knowledge = getA2PresenterKnowledge("A2-8.22");
  assert.equal(
    knowledge.activity.instruction,
    "Vergleicht die Sätze. Was passiert mit dem Verb, wenn die Zeitangabe am Anfang steht?",
  );
  assert.deepEqual(knowledge.activity.modelItems, [
    "Das konjugierte Verb bleibt auf Position 2.",
    "Nach der Zeitangabe kommt deshalb oft direkt das Verb.",
  ]);
});
