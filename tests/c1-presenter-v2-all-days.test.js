import test from "node:test";
import assert from "node:assert/strict";

import { courseDictionary, getCourseDictionaryEntry } from "../src/data/courseDictionary.js";
import { C1_CANONICAL_TITLES, C1_CANONICAL_GRAMMAR_TITLES } from "../src/data/c1CanonicalCurriculum.js";
import { getSlidesByCourse, getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import {
  buildTeachingPresenterStages,
  isC1PresenterV2Slide,
  isTeachingPresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const REQUIRED_STAGES = [
  "intro", "warmup", "phrases", "grammar", "examples",
  "practice", "workbook", "mistakes", "questions", "weekly-challenge", "lesson-summary",
];


test("C1 Teaching Slides expose a complete 28-day curriculum", () => {
  const slides = getSlidesByCourse("C1");
  assert.equal(slides.length, 28);
  assert.equal(Object.keys(courseDictionary.C1 || {}).length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));

  slides.forEach((slide, index) => {
    const assignmentId = `C1 ${index + 1}`;
    assert.equal(slide.assignmentId, assignmentId);
    assert.match(slide.title, new RegExp(C1_CANONICAL_TITLES[index].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    assert.equal(getTeachingSlideByAssignmentId(assignmentId)?.id, slide.id);
    assert.equal(getCourseDictionaryEntry(assignmentId)?.assignment_id, assignmentId);
  });
});

test("all C1 days use Presenter 2.0 with concise German classroom practice", () => {
  for (const slide of getSlidesByCourse("C1")) {
    assert.equal(isC1PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    REQUIRED_STAGES.forEach((stageId) => {
      assert.ok(stageIds.includes(stageId), `${slide.assignmentId} missing ${stageId}`);
    });

    const grammar = stages.find((stage) => stage.id === "grammar");
    const practice = stages.find((stage) => stage.id === "practice");
    const workbook = stages.find((stage) => stage.id === "workbook");
    const questions = stages.find((stage) => stage.id === "questions");
    const mistakes = stages.find((stage) => stage.id === "mistakes");
    const warmup = stages.find((stage) => stage.id === "warmup");
    const vocabulary = stages.find((stage) => stage.id === "phrases");
    const weeklyChallenge = stages.find((stage) => stage.id === "weekly-challenge");

    assert.ok(grammar.items.length >= 2, `${slide.assignmentId} missing C1 grammar`);
    assert.equal(warmup.questionSupport.length, warmup.items.length, `${slide.assignmentId} should use enhanced warm-up cards`);
    assert.equal(vocabulary.type, "vocabulary");
    assert.ok(vocabulary.items.length >= 6, `${slide.assignmentId} should use vocabulary cards`);
    assert.ok(weeklyChallenge.items.length >= 3, `${slide.assignmentId} should have a weekly challenge`);
    assert.equal(stages.some((stage) => stage.id === "wrapup"), false, `${slide.assignmentId} should not duplicate the final summary with a wrap-up page`);
    assert.ok(grammar.items.every((item) => !/^Use\b|^Structure\b|^Express\b|^Separate\b|^Distinguish\b/i.test(item)), `${slide.assignmentId} grammar should be classroom German`);
    assert.equal(practice.type, "flow");
    assert.equal(practice.items.length, 4, `${slide.assignmentId} should keep guided practice concise`);
    assert.ok(practice.items.every((item) => item.instruction), `${slide.assignmentId} should show actual student instructions`);
    assert.ok(practice.items.every((item) => Array.isArray(item.prompts) && item.prompts.length > 0), `${slide.assignmentId} should show actual prompts`);
    assert.ok(practice.items.every((item) => item.teacherNote), `${slide.assignmentId} should keep short English teacher notes available`);
    assert.ok(practice.items.some((item) => item.minutes > 0), `${slide.assignmentId} missing timer minutes`);
    assert.ok(mistakes.items.every((item) => !/^Using\b|^Giving\b|^Repeating\b|^Overusing\b/i.test(item)), `${slide.assignmentId} mistakes should be classroom German`);
    assert.equal(workbook.type, "workbook");
    assert.ok(workbook.items.length >= 5, `${slide.assignmentId} missing C1 classroom bridge`);
    assert.equal(workbook.grammarUrl, "", slide.assignmentId);
    assert.equal(workbook.workbookUrl, "", slide.assignmentId);
    assert.equal(questions.type, "question-reveal");
    assert.ok(questions.items.length >= 5, `${slide.assignmentId} missing speaking prompts`);
    assert.ok(questions.supportItems.length >= 3, `${slide.assignmentId} missing model language`);
  }
});

test("C1 practice stays student-facing in German while teacher guidance remains optional English", () => {
  const slide = getTeachingSlideByAssignmentId("C1 1");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const practice = stages.find((stage) => stage.id === "practice");
  const visibleText = practice.items.flatMap((item) => [item.title, item.instruction, ...(item.prompts || [])]).join(" ");
  const teacherText = practice.items.map((item) => item.teacherNote).join(" ");

  assert.match(visibleText, /Spontane Position|Satz-Upgrade|Gegenargument|Stellungnahme/);
  assert.match(visibleText, /Antworte|Formuliere|Nutze|Sprich/);
  assert.match(teacherText, /position|precision|counterargument|correct/i);
});

test("C1 grammar stages match the learner-side grammar target for every day", () => {
  for (const slide of getSlidesByCourse("C1")) {
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const grammar = stages.find((stage) => stage.id === "grammar");
    const expected = C1_CANONICAL_GRAMMAR_TITLES[slide.dayNumber - 1];

    assert.ok(expected, slide.assignmentId + " missing canonical grammar title");
    assert.ok(grammar.items.some((item) => item.includes(expected)), slide.assignmentId + " does not expose learner grammar target");
    assert.ok(grammar.items.some((item) => /Kontrollpunkt:/i.test(item)), slide.assignmentId + " missing learner grammar control point");
  }

  const day3 = buildTeachingPresenterStages(getTeachingSlideByAssignmentId("C1 3"), "Medien und Informationskompetenz")
    .find((stage) => stage.id === "grammar").items.join(" ");
  assert.match(day3, /Konjunktiv I für indirekte Rede/i);
  assert.match(day3, /indirekte Rede|Konjunktiv I/i);
});

test("existing A1, A2, B1 and B2 Presenter 2 courses remain enabled", () => {
  for (const course of ["A1", "A2", "B1", "B2"]) {
    const slides = getSlidesByCourse(course).filter((slide) => slide.assignmentId !== "A1-Tutorial");
    assert.ok(slides.length > 0, course);
    assert.ok(slides.every((slide) => isTeachingPresenterV2Slide(slide)), course);
  }
});


test("C1 rotates seven level-appropriate weekly challenge mechanics", () => {
  const titlesByWeek = new Map();
  for (const slide of getSlidesByCourse("C1")) {
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const challenge = stages.find((stage) => stage.id === "weekly-challenge");
    const week = Math.ceil(slide.dayNumber / 4);
    assert.ok(challenge, slide.assignmentId + " missing weekly challenge");
    if (titlesByWeek.has(week)) {
      assert.equal(challenge.title, titlesByWeek.get(week), slide.assignmentId + " should keep one mechanic identity within its week");
    } else {
      titlesByWeek.set(week, challenge.title);
    }
  }
  assert.equal(titlesByWeek.size, 7);
  assert.equal(new Set(titlesByWeek.values()).size, 7, "C1 should use seven distinct weekly mechanics");
});
