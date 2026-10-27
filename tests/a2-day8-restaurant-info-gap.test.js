import test from "node:test";
import assert from "node:assert/strict";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("A2 Day 8 presenter includes a private restaurant menu information gap", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-3.8");
  assert.ok(slide);

  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const practice = stages.find((stage) => stage.id === "practice");
  assert.ok(practice);
  assert.equal(practice.variant, "information-gap");
  assert.equal(practice.title, "Informationslücke · Restaurant-Menü");
  assert.equal(practice.items[0].roleCards.length, 2);
  assert.deepEqual(practice.items[0].roleCards.map((card) => card.id), ["A", "B"]);
  assert.match(practice.items[0].roleCards[0].content, /Gemüsesuppe 6 €/);
  assert.match(practice.items[0].roleCards[1].content, /Salat 8 €/);
  assert.match(practice.items[0].roleCards[0].task, /Wie viel kostet/);
  assert.match(practice.items[0].roleCards[1].task, /Welche Beilage/);
});

test("A2 Day 8 speaking builds from ordering to questions to problem solving", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-3.8");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const speaking = stages.find((stage) => stage.id === "questions");

  assert.ok(speaking);
  assert.equal(speaking.type, "flow");
  assert.equal(speaking.title, "Restaurant-Rollenspiel · 3 Runden");
  assert.deepEqual(speaking.items.map((item) => item.title), [
    "Runde 1 · Bestellen",
    "Runde 2 · Nachfragen",
    "Runde 3 · Problem lösen",
  ]);
  assert.match(speaking.items[0].modelItems[0], /Ich hätte gern/);
  assert.match(speaking.items[1].modelItems.join(" "), /Was empfehlen Sie/);
  assert.match(speaking.items[2].modelItems[0], /Könnten Sie das bitte austauschen/);
});
