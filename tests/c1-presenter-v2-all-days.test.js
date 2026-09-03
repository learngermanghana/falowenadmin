import test from "node:test";
import assert from "node:assert/strict";

import { courseDictionary, getCourseDictionaryEntry } from "../src/data/courseDictionary.js";
import { getSlidesByCourse, getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import {
  buildTeachingPresenterStages,
  isC1PresenterV2Slide,
  isTeachingPresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const REQUIRED_STAGES = [
  "intro", "warmup", "phrases", "grammar", "examples",
  "practice", "workbook", "mistakes", "questions", "wrapup",
];

const EXPECTED_TOPICS = [
  "Wissenschaft und Forschung",
  "Kunst und Kultur",
  "Künstliche Intelligenz und Arbeitswelt",
  "Digitalisierung und Datenschutz",
  "Personalisierte Werbung",
  "Online- und Offline-Identität",
  "Gesellschaftlicher Zusammenhalt",
  "Mehrsprachigkeit",
  "Migration und Integration",
  "Ehrenamt und gesellschaftlicher Pflichtdienst",
  "Demokratie und soziale Medien",
  "Bildung und Prüfungsformate",
  "Lebenslanges Lernen",
  "Homeoffice und moderne Arbeitsformen",
  "Fachkräftemangel und berufliche Mobilität",
  "Bedingungsloses Grundeinkommen",
  "Nachhaltigkeit in der Wirtschaft",
  "Klimawandel und Verkehr",
  "Nachhaltiger Konsum",
  "Reisen und Nachhaltigkeit",
  "Gesundheit und Impfpflicht",
  "Ernährung und moderner Lebensstil",
  "Wohnen, Mieten und soziale Gerechtigkeit",
  "Zukunftstechnologien und Innovation",
  "Globalisierung und internationale Zusammenarbeit",
  "Wissenschaftliches Arbeiten und Quellen",
  "Stellungnahme und formelle Korrespondenz",
  "Prüfungsvorbereitung und spontane Argumentation",
];

test("C1 Teaching Slides expose a complete 28-day curriculum", () => {
  const slides = getSlidesByCourse("C1");
  assert.equal(slides.length, 28);
  assert.equal(Object.keys(courseDictionary.C1 || {}).length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));

  slides.forEach((slide, index) => {
    const assignmentId = `C1 ${index + 1}`;
    assert.equal(slide.assignmentId, assignmentId);
    assert.match(slide.title, new RegExp(EXPECTED_TOPICS[index].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
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

    assert.ok(grammar.items.length >= 2, `${slide.assignmentId} missing C1 grammar`);
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

test("existing A1, A2, B1 and B2 Presenter 2 courses remain enabled", () => {
  for (const course of ["A1", "A2", "B1", "B2"]) {
    const slides = getSlidesByCourse(course).filter((slide) => slide.assignmentId !== "A1-Tutorial");
    assert.ok(slides.length > 0, course);
    assert.ok(slides.every((slide) => isTeachingPresenterV2Slide(slide)), course);
  }
});
