import test from "node:test";
import assert from "node:assert/strict";

import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { A2_PRESENTER_KNOWLEDGE_ASSIGNMENTS, getA2PresenterKnowledge } from "../src/data/a2PresenterKnowledge.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const A2_ASSIGNMENTS = [
  "A2-1.1", "A2-1.2", "A2-1.3", "A2-2.4", "A2-2.5", "A2-3.6", "A2-3.7", "A2-3.8",
  "A2-4.9", "A2-4.10", "A2-4.11", "A2-5.12", "A2-5.13", "A2-5.14", "A2-6.15", "A2-6.16",
  "A2-6.17", "A2-7.18", "A2-7.19", "A2-7.20", "A2-8.21", "A2-8.22", "A2-9.23", "A2-9.24",
  "A2-9.25", "A2-10.26", "A2-10.27", "A2-10.28",
];

const TEACHING_SPINE = [
  "intro",
  "warmup",
  "knowledge",
  "phrases",
  "grammar-check",
  "practice",
  "questions",
  "workbook",
  "lesson-summary",
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

test("A2 Presenter uses the stable teaching spine and removes repetitive ending drills", () => {
  for (const assignmentId of A2_ASSIGNMENTS) {
    const slide = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(slide, `${assignmentId} slide missing`);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const ids = stages.map((stage) => stage.id);

    assert.deepEqual(ids, TEACHING_SPINE, `${assignmentId} should use the A2 teaching spine`);

    const knowledge = stages.find((stage) => stage.id === "knowledge");
    const grammar = stages.find((stage) => stage.id === "grammar-check");
    const practice = stages.find((stage) => stage.id === "practice");
    const questions = stages.find((stage) => stage.id === "questions");
    const workbook = stages.find((stage) => stage.id === "workbook");

    assert.equal(knowledge.type, "knowledge");
    assert.ok(knowledge.textDe?.length > 100, `${assignmentId} knowledge text missing`);
    assert.equal(knowledge.items.length, 3, `${assignmentId} knowledge checks missing`);

    assert.equal(grammar.type, "grammar-check");
    assert.equal(grammar.items.length, 3, `${assignmentId} grammar should be checked in three short steps`);
    assert.ok(grammar.items.every((item) => item.prompt && item.answer), `${assignmentId} grammar checks need teacher keys`);

    assert.equal(practice.type, "flow");
    assert.equal(practice.items.length, 1, `${assignmentId} should have one focused practice, not a repeated drill stack`);
    assert.ok(practice.items[0].prompts?.length >= 2, `${assignmentId} focused practice should be actionable`);

    assert.equal(questions.type, "question-reveal");
    assert.equal(questions.items.length, 3, `${assignmentId} speaking production should use Easy, Neutral and Difficult`);

    assert.equal(workbook.type, "workbook");
    assert.ok(workbook.items.length >= 4, `${assignmentId} workbook bridge missing`);

    for (const removed of [
      "grammar",
      "examples",
      "mistakes",
      "vocabulary-retrieval",
      "sentence-builder",
      "guided-action",
      "role-play",
      "weekly-challenge",
      "wrapup",
    ]) {
      assert.equal(ids.includes(removed), false, `${assignmentId} still exposes repetitive stage ${removed}`);
    }
  }
});

test("A2 Day 6 checks position versus movement before article transformation", () => {
  const slide = getTeachingSlideByAssignmentId("A2-3.6");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const ids = stages.map((stage) => stage.id);
  const knowledge = stages.find((stage) => stage.id === "knowledge");
  const grammar = stages.find((stage) => stage.id === "grammar-check");
  const practice = stages.find((stage) => stage.id === "practice");

  assert.match(knowledge.textDe, /Wo\?/);
  assert.match(knowledge.textDe, /Wohin\?/);
  assert.match(knowledge.textDe, /Dativ/);
  assert.match(knowledge.textDe, /Akkusativ/);

  const grammarText = grammar.items
    .map((item) => [item.prompt, item.example, item.answer, item.note].filter(Boolean).join(" "))
    .join(" ");
  assert.match(grammarText, /Wo\?/i);
  assert.match(grammarText, /Wohin\?/i);
  assert.match(grammarText, /Wechselpräposition|Dativ|Akkusativ/i);

  assert.match(practice.title, /Position.*Bewegung/i);
  assert.match(practice.items[0].instruction, /Position oder Bewegung/i);
  assert.ok(practice.items[0].prompts.some((item) => /Welcher Kasus/i.test(item)));
  assert.ok(practice.items[0].prompts.some((item) => /Was passiert mit dem Artikel/i.test(item)));
  assert.ok(practice.items[0].modelItems.some((item) => /Position.*Wo\?.*Dativ.*neben dem Fenster/i.test(item)));
  assert.ok(practice.items[0].modelItems.some((item) => /Bewegung.*Wohin\?.*Akkusativ.*neben das Fenster/i.test(item)));
  assert.ok(practice.items[0].modelItems.some((item) => /dem → den/i.test(item)));
  assert.ok(ids.indexOf("knowledge") < ids.indexOf("grammar-check"));
  assert.ok(ids.indexOf("grammar-check") < ids.indexOf("practice"));
  assert.ok(ids.indexOf("practice") < ids.indexOf("questions"));
  assert.ok(ids.indexOf("questions") < ids.indexOf("workbook"));
});
