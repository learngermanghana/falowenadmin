import test from "node:test";
import assert from "node:assert/strict";

import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { A2_PRESENTER_KNOWLEDGE_ASSIGNMENTS, getA2PresenterKnowledge, getA2FocusedPractice } from "../src/data/a2PresenterKnowledge.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const A2_ASSIGNMENTS = [
  "A2-1.1", "A2-1.2", "A2-1.3", "A2-2.4", "A2-2.5", "A2-3.6", "A2-3.7", "A2-3.8",
  "A2-4.9", "A2-4.10", "A2-4.11", "A2-5.12", "A2-5.13", "A2-5.14", "A2-6.15", "A2-6.16",
  "A2-6.17", "A2-7.18", "A2-7.19", "A2-7.20", "A2-8.21", "A2-8.22", "A2-9.23", "A2-9.24",
  "A2-9.25", "A2-10.26", "A2-10.27", "A2-10.28",
];

test("all 28 A2 lessons have a lesson-specific Wissensimpuls and one focused activity", () => {
  assert.deepEqual([...A2_PRESENTER_KNOWLEDGE_ASSIGNMENTS].sort(), [...A2_ASSIGNMENTS].sort());

  for (const assignmentId of A2_ASSIGNMENTS) {
    const knowledge = getA2PresenterKnowledge(assignmentId);
    assert.ok(knowledge, `${assignmentId} knowledge missing`);
    assert.ok(knowledge.title?.length >= 8, `${assignmentId} knowledge title too short`);
    assert.ok(knowledge.textDe?.split(/\s+/).length >= 45, `${assignmentId} knowledge text is too thin`);
    assert.equal(knowledge.checks?.length, 3, `${assignmentId} should have exactly three short knowledge checks`);
    assert.ok(knowledge.activity?.title, `${assignmentId} focused activity title missing`);
    assert.ok(knowledge.activity?.instruction, `${assignmentId} focused activity instruction missing`);
    assert.ok(knowledge.activity?.prompts?.length >= 2, `${assignmentId} focused activity prompts missing`);
  }
});

test("A2 scenarios follow the grammar check and precede workbook presentation", () => {
  for (const assignmentId of A2_ASSIGNMENTS) {
    const slide = getTeachingSlideByAssignmentId(assignmentId);
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const ids = stages.map(stage => stage.id);
    assert.equal(ids.filter(id => id === "scenario-challenge").length, 1, assignmentId);
    assert.ok(!ids.includes("practice"), assignmentId);
    assert.ok(ids.indexOf("grammar-check") < ids.indexOf("scenario-challenge"), assignmentId);
    assert.ok(ids.indexOf("scenario-challenge") < ids.indexOf("workbook-presentation"), assignmentId);
    const challenge = stages.find(stage => stage.id === "scenario-challenge");
    assert.equal(challenge.items.length, 3);
    assert.ok(challenge.items.every(item => item.steps.length === 3));
  }
});
test("Day 6 keeps Wo/Wohin grammar and room makeover", () => {
  const slide = getTeachingSlideByAssignmentId("A2-3.6");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const grammar = stages.find(stage => stage.id === "grammar-check");
  const challenge = stages.find(stage => stage.id === "scenario-challenge");
  assert.match(JSON.stringify(grammar), /Dativ|Akkusativ/i);
  assert.equal(challenge.title, "Room Makeover");
  assert.match(JSON.stringify(challenge), /Wo\?|Wohin\?|Dativ|Akkusativ/i);
});
test("A2 Day 14 uses career-coaching choices with three relevant alternatives", () => {
  const focused = getA2FocusedPractice("A2-5.14");
  assert.match(focused.title, /Karriere-Coach/);
  assert.doesNotMatch(focused.title, /Mini-Wissensquiz/);
  assert.equal(focused.decisionCases.length, 3);
  assert.deepEqual(focused.decisionCases.map((item) => item.correctIndex), [1, 2, 0]);
  for (const item of focused.decisionCases) {
    assert.ok(item.id && item.name && item.situation && item.question);
    assert.equal(item.options.length, 3);
    assert.ok(item.options.every((option) => option.split(/\s+/).length >= 4));
    assert.ok(item.explanation.split(/\s+/).length >= 18);
    assert.match(item.model, /, um .* zu (?:bearbeiten|werden|leiten)\./);
  }
  const slide = getTeachingSlideByAssignmentId("A2-5.14");
  const practice = buildTeachingPresenterStages(slide, slide.topic).find(stage => stage.id === "scenario-challenge");
  assert.equal(practice.title, "Karriere-Coach Challenge");
  assert.equal(practice.items.length, 3);
  assert.ok(practice.items.every(item => item.steps.some(step => /um .* zu/.test(step.modelDe))));
});

test("A2 Day 14 options are clickable and answers are revealed on demand", async () => {
  const fs = await import("node:fs");
  const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  assert.match(presenter, /activeCareerDecisionCase\.options\.map/);
  assert.match(presenter, /aria-pressed=\{careerCaseSelections\[activeCareerDecisionCase\.id\] === optionIndex\}/);
  assert.match(presenter, /setCareerCaseSelections/);
  assert.match(presenter, /Modell anzeigen/);
  assert.match(presenter, /Beste Antwort:/);
  assert.match(presenter, /activeCareerDecisionCase\.explanation/);
  assert.match(presenter, /activeCareerDecisionCase\.model/);
  assert.match(presenter, /careerCaseModelsOpen\[activeCareerDecisionCase\.id\] \? \(/);
  assert.match(presenter, /Nächster Fall/);
  assert.match(presenter, /setCareerCaseIndex\(0\)/);
  assert.match(presenter, /setCareerCaseModelsOpen\(\{\}\)/);
  assert.match(presenter, /!item\.decisionCases\?\.length && Array\.isArray\(item\.modelItems\)/);
  assert.match(css, /\.presenter-career-options button\.is-selected/);
  assert.match(css, /\.presenter-career-model/);
  assert.match(css, /\.presenter-career-transfer summary/);
});
