import test from "node:test";
import assert from "node:assert/strict";

import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

test("A2 Day 19 exposes a real one-minute knowledge slide in Presenter", () => {
  const slide = getTeachingSlideByAssignmentId("A2-7.19");
  assert.ok(slide, "A2-7.19 slide missing");
  assert.ok(slide.knowledgeTextDe, "A2-7.19 knowledge text missing");

  const words = String(slide.knowledgeTextDe).trim().split(/\s+/).filter(Boolean);
  assert.ok(words.length >= 70, `knowledge text is too short: ${words.length} words`);

  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const stageIds = stages.map((stage) => stage.id);
  const knowledgeIndex = stageIds.indexOf("knowledge");
  const warmupIndex = stageIds.indexOf("warmup");
  const phrasesIndex = stageIds.indexOf("phrases");

  assert.ok(knowledgeIndex > warmupIndex, "knowledge slide should follow warm-up");
  assert.ok(knowledgeIndex < phrasesIndex, "knowledge slide should come before key phrases");

  const knowledge = stages[knowledgeIndex];
  assert.equal(knowledge.type, "task");
  assert.equal(knowledge.title, "1-Minute-Wissen");
  assert.equal(knowledge.suggestedMinutes, 1);
  assert.match(knowledge.body, /Wochenmarkt/i);
  assert.match(knowledge.body, /online/i);
  assert.match(knowledge.body, /nachhaltig/i);
});
