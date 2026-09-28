import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getA2PresenterKnowledge } from "../src/data/a2PresenterKnowledge.js";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("presenter focus view hides teacher chrome but keeps compact navigation and participation controls", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");
  const pickerCss = fs.readFileSync("src/components/PresenterStudentPicker.css", "utf8");
  const picker = fs.readFileSync("src/components/PresenterStudentPicker.jsx", "utf8");

  assert.match(presenter, /const \[focusMode, setFocusMode\] = useState\(false\)/);
  assert.match(presenter, /Present full screen/);
  assert.doesNotMatch(presenter, /Show marking/);
  assert.match(presenter, /aria-label="Restore presenter controls"/);
  assert.match(presenter, /presenter-focus-dock/);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-topbar/);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-footer/);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-student-picker,[\s\S]*\.presenter-stage\.is-focus-mode > \.presenter-participation-dock\s*\{[\s\S]*display:\s*block/);
  assert.match(css, /Focus mode keeps only the live participation actions needed while teaching/);
  assert.match(css, /top:\s*clamp\(0\.55rem/);
  assert.match(css, /left:\s*clamp\(0\.55rem/);
  assert.match(picker, />Correct<\/button>/);
  assert.match(picker, />Needs review<\/button>/);
  assert.match(picker, /current \? "Next student →" : "Pick student"/);
  assert.match(pickerCss, /Minimal participation toolbar inside Focus Mode/);
  assert.match(pickerCss, /\.presenter-stage\.is-focus-mode \.presenter-student-class-select,[\s\S]*display:\s*none !important/);
  assert.match(pickerCss, /\.presenter-stage\.is-focus-mode \.presenter-student-actions/);
  assert.match(pickerCss, /\.presenter-stage\.is-focus-mode \.presenter-pick-student/);
  assert.match(css, /\.presenter-focus-dock/);
});

test("A2 knowledge tells learners how to use the text and Day 22 uses vocabulary gap guessing", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-8.22");
  assert.ok(slide, "A2-8.22 slide missing");

  const knowledgeStage = buildTeachingPresenterStages(slide, slide.topic)
    .find((stage) => stage.id === "knowledge");
  assert.equal(
    knowledgeStage.instruction,
    "Lest den kurzen Text 1 Minute. Beantwortet danach die Fragen mündlich.",
  );

  const knowledge = getA2PresenterKnowledge("A2-8.22");
  assert.equal(knowledge.activity.title, "Welches Wort passt?");
  assert.equal(
    knowledge.activity.instruction,
    "Wählt aus drei Wörtern. Welches Wort passt in die Lücke?",
  );
  assert.equal(knowledge.activity.prompts.length, 4);
  assert.ok(knowledge.activity.prompts.every((item) => item.includes("______") && item.includes("Wählt:")));
  assert.deepEqual(knowledge.activity.modelItems, [
    "Termine",
    "Verfügbarkeit",
    "Pflicht",
    "verplanen",
  ]);
});
