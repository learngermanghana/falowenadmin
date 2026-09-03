import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse, getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import {
  buildTeachingPresenterStages,
  isB2PresenterV2Slide,
  isTeachingPresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const TOPICS = [
  "Persönliche Identität und Selbstverständnis",
  "Beziehungen und Kommunikation",
  "Öffentliches vs. Privates Leben",
  "Beruf und Karriere",
  "Bildung und Lernen",
  "Kultur und Gesellschaft",
  "Medien und digitale Welt",
  "Wissenschaft und Technologie",
  "Politik und Gesellschaft",
  "Wirtschaft und Finanzen",
  "Umwelt und Nachhaltigkeit",
  "Gesundheit und Wohlbefinden",
  "Ernährung und Lebensstil",
  "Reisen und Mobilität",
  "Wohnen und Lebensräume",
  "Freizeit, Hobbys und Interessen",
  "Feste und Traditionen",
  "Werte und Normen",
  "Migration und Integration",
  "Diskriminierung und Gleichstellung",
  "Recht und Ordnung",
  "Konfliktmanagement",
  "Globalisierung",
  "Zukunft und Innovation",
  "Kommunikation im Berufsleben",
  "Wissenschaftliches Arbeiten",
  "Zeitmanagement und Organisation",
  "Zusammenfassung & Prüfungsvorbereitung",
];

const REQUIRED_STAGES = [
  "intro", "warmup", "phrases", "grammar", "examples",
  "practice", "workbook", "mistakes", "questions", "wrapup",
];

function expectedAssignmentId(day) {
  return `B2-${Math.ceil(day / 4)}.${day}`;
}

test("B2 Teaching Slides expose the complete 28-day LLEA curriculum", () => {
  const slides = getSlidesByCourse("B2");
  assert.equal(slides.length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));

  slides.forEach((slide, index) => {
    const day = index + 1;
    assert.equal(slide.assignmentId, expectedAssignmentId(day));
    assert.match(slide.title, new RegExp(TOPICS[index].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    assert.equal(getTeachingSlideByAssignmentId(slide.assignmentId)?.id, slide.id);
  });
});

test("B2 assignment mapping follows the verified early workbook sequence", () => {
  assert.equal(getTeachingSlideByAssignmentId("B2-1.1")?.dayNumber, 1);
  assert.equal(getTeachingSlideByAssignmentId("B2-1.4")?.dayNumber, 4);
  assert.equal(getTeachingSlideByAssignmentId("B2-2.5")?.dayNumber, 5);
  assert.equal(getTeachingSlideByAssignmentId("B2-7.28")?.dayNumber, 28);
});

test("all B2 days use Presenter 2.0 with rich classroom stages", () => {
  const slides = getSlidesByCourse("B2");

  for (const slide of slides) {
    assert.equal(isB2PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    REQUIRED_STAGES.forEach((stageId) => {
      assert.ok(stageIds.includes(stageId), `${slide.assignmentId} missing ${stageId}`);
    });

    const grammar = stages.find((stage) => stage.id === "grammar");
    const questions = stages.find((stage) => stage.id === "questions");
    const practice = stages.find((stage) => stage.id === "practice");
    const workbook = stages.find((stage) => stage.id === "workbook");

    assert.ok(grammar.items.length >= 3, `${slide.assignmentId} should have B2 grammar support`);
    assert.equal(questions.type, "question-reveal");
    assert.ok(questions.items.length >= 5, `${slide.assignmentId} should have speaking questions`);
    assert.ok(questions.supportItems.length >= 3, `${slide.assignmentId} should have model language`);
    assert.equal(practice.type, "flow");
    assert.ok(practice.items.length >= 5, `${slide.assignmentId} should have guided classroom phases`);
    assert.ok(practice.items.some((item) => item.minutes > 0), `${slide.assignmentId} should expose timer minutes`);
    assert.equal(workbook.type, "workbook");
    assert.ok(workbook.items.length >= 5, `${slide.assignmentId} should expose the workbook bridge`);
  }
});

test("B2 does not invent unverified direct workbook or grammar URLs", () => {
  for (const slide of getSlidesByCourse("B2")) {
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.equal(workbook.grammarUrl, "", slide.assignmentId);
    assert.equal(workbook.workbookUrl, "", slide.assignmentId);
  }
});

test("B1 remains fully enabled after adding B2", () => {
  const b1Slides = getSlidesByCourse("B1");
  assert.equal(b1Slides.length, 28);
  assert.ok(b1Slides.every((slide) => isTeachingPresenterV2Slide(slide)));
});
