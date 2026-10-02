import test from "node:test";
import assert from "node:assert/strict";
import { a2PresenterKnowledge } from "../src/data/a2PresenterKnowledge.js";
import { teachingSlides } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("A2 Day 8 knowledge activity is food matching, not recipe imperative practice", () => {
  const knowledge = a2PresenterKnowledge["A2-3.8"];
  assert.ok(knowledge);
  assert.match(knowledge.title, /Essen im Restaurant/);
  assert.match(knowledge.activity.instruction, /Gericht, Getränk oder Beilage/);
  assert.doesNotMatch(knowledge.textDe, /Imperativ/i);
  assert.doesNotMatch(knowledge.activity.instruction, /du, ihr oder Sie/i);
});

test("A2 Day 8 vocabulary choices explain the concrete restaurant situation", () => {
  const slide = teachingSlides.find((item) => item.assignmentId === "A2-3.8");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const vocabulary = stages.find((stage) => stage.id === "vocabulary");
  assert.ok(vocabulary);
  const situations = (vocabulary.challengeItems || []).map((item) => item.sentence).join(" ");
  assert.match(situations, /Speisekarte|bestimmtes Essen oder Getränk|Servicepersonal/);
  assert.doesNotMatch(situations, /passende Formulierung für diese Aussage wählen/);
});
