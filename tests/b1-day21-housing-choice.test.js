import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { getB1FocusedPractice } from "../src/data/b1PresenterKnowledge.js";

test("B1-7.21 has eight readable, distinct housing choices matching the three profiles", () => {
  const activity = getB1FocusedPractice("B1-7.21");
  assert.equal(activity.title, "Lebensform für drei Profile");
  assert.equal(activity.prompts.length, 3);
  assert.equal(activity.housingOptions.length, 8);
  assert.equal(new Set(activity.housingOptions.map((option) => option.id)).size, 8);
  assert.ok(activity.housingOptions.every((option) => option.de && option.en && option.note));
  assert.ok(activity.housingOptions.some((option) => /kleine Wohnung/.test(option.de)));
  assert.ok(activity.housingOptions.some((option) => /Erdgeschoss/.test(option.de)));
  assert.ok(activity.housingOptions.some((option) => /WG/.test(option.de)));
  assert.ok(activity.housingOptions.some((option) => /Mehrgenerationenhaus/.test(option.de)));
  assert.match(activity.instruction, /Wählt/);
  assert.match(activity.instruction, /Einschränkung/);
  assert.match(activity.housingSentenceStarter, /weil/);
  assert.match(activity.housingSentenceStarter, /Allerdings/);
  assert.equal(activity.modelItems.length, 3);
});

test("Day 21 presenter receives the housing list on its existing decision stage", () => {
  const slide = getTeachingSlideByAssignmentId("B1-7.21");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const practice = stages.find((stage) => stage.id === "practice");
  assert.equal(practice.type, "flow");
  assert.equal(practice.variant, "decision-task");
  assert.equal(practice.weekNumber, 7);
  assert.equal(practice.items[0].housingOptions.length, 8);
  assert.deepEqual(practice.items[0].prompts, getB1FocusedPractice("B1-7.21").prompts);
});

test("Vocabulary bank has interactive choices without breaking other presenter activities", () => {
  const jsx = readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const choices = readFileSync(new URL("../src/components/B1HousingChoicePractice.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/B1HousingChoicePractice.css", import.meta.url), "utf8");
  assert.match(jsx, /<B1HousingChoicePractice/);
  assert.match(jsx, /item\.housingOptions/);
  assert.match(jsx, /presenter-practice-prompts/);
  assert.match(choices, /onChange/);
  assert.match(choices, /housingOptions\.map/);
  assert.match(choices, /Mehrere Lösungen sind möglich/);
  assert.match(choices, /aria-label="Wohnformen auswählen"/);
  assert.match(css, /max-width:680px/);
});
