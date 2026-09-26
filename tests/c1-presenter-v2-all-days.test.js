import test from "node:test";
import assert from "node:assert/strict";

import { courseDictionary, getCourseDictionaryEntry } from "../src/data/courseDictionary.js";
import { C1_CANONICAL_TITLES, C1_CANONICAL_GRAMMAR_TITLES } from "../src/data/c1CanonicalCurriculum.js";
import { getC1TopicCollocations, C1_TOPIC_COLLOCATION_DAYS } from "../src/data/c1PresenterLanguage.js";
import { getSlidesByCourse, getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import {
  buildTeachingPresenterStages,
  getSpeakingQuestionModel,
  isC1PresenterV2Slide,
  isTeachingPresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const REQUIRED_STAGES = [
  "intro", "warmup", "foundation", "phrases", "grammar", "examples",
  "focus", "questions", "writing", "workbook", "lesson-summary",
];

const FOCUS_TITLES = [
  "Position + Begründung",
  "Perspektiven vergleichen",
  "Paraphrasieren ohne Bedeutungsverlust",
  "Registerwechsel",
  "Kurz zusammenfassen & einordnen",
  "Gegenargument ernst nehmen",
  "Mediation · für ein anderes Publikum",
  "Strukturierte Mini-Debatte",
];


test("C1 Teaching Slides expose a complete 28-day curriculum", () => {
  const slides = getSlidesByCourse("C1");
  assert.equal(slides.length, 28);
  assert.equal(Object.keys(courseDictionary.C1 || {}).length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));
  assert.deepEqual(C1_TOPIC_COLLOCATION_DAYS, Array.from({ length: 28 }, (_, index) => index + 1));

  slides.forEach((slide, index) => {
    const assignmentId = `C1 ${index + 1}`;
    assert.equal(slide.assignmentId, assignmentId);
    assert.match(slide.title, new RegExp(C1_CANONICAL_TITLES[index].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    assert.equal(getTeachingSlideByAssignmentId(assignmentId)?.id, slide.id);
    assert.equal(getCourseDictionaryEntry(assignmentId)?.assignment_id, assignmentId);
    const collocations = getC1TopicCollocations(index + 1);
    assert.equal(collocations.length, 4, assignmentId + " should have four topic collocations");
    collocations.forEach((item) => assert.ok(slide.keyPhrasesDe.includes(item), assignmentId + " missing " + item));
  });
});

test("all C1 days use the stable argumentation teaching spine", () => {
  for (const slide of getSlidesByCourse("C1")) {
    assert.equal(isC1PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    assert.deepEqual(stageIds, REQUIRED_STAGES, slide.assignmentId + " should use the C1 teaching spine");

    const warmup = stages.find((stage) => stage.id === "warmup");
    const foundation = stages.find((stage) => stage.id === "foundation");
    const vocabulary = stages.find((stage) => stage.id === "phrases");
    const grammar = stages.find((stage) => stage.id === "grammar");
    const focus = stages.find((stage) => stage.id === "focus");
    const questions = stages.find((stage) => stage.id === "questions");
    const writing = stages.find((stage) => stage.id === "writing");
    const workbook = stages.find((stage) => stage.id === "workbook");

    assert.equal(warmup.questionSupport.length, warmup.items.length);
    assert.equal(foundation.kicker, "C1 · Thema verstehen");

    assert.equal(vocabulary.type, "vocabulary");
    assert.equal(vocabulary.kicker, "Kollokationen & Argumentationssprache");
    assert.ok(vocabulary.items.length >= 7);
    const lessonCollocations = getC1TopicCollocations(slide.dayNumber);
    assert.ok(
      lessonCollocations.some((term) => vocabulary.items.some((item) => item.term === term)),
      slide.assignmentId + " should expose topic-specific collocations",
    );

    assert.equal(grammar.type, "c1-grammar");
    assert.ok(grammar.items.length >= 3);
    assert.ok(grammar.items.some((item) => item.includes(C1_CANONICAL_GRAMMAR_TITLES[slide.dayNumber - 1])));
    assert.ok(grammar.items.some((item) => /Kontrollpunkt:/i.test(item)));
    assert.ok(grammar.supportEn.length > 25, slide.assignmentId + " should have brief English clarification");
    assert.equal(grammar.attentionDe, slide.canonicalLearnerLesson.mistake);

    assert.equal(focus.type, "flow");
    assert.equal(focus.items.length, 1, slide.assignmentId + " should have one C1 focus task");
    assert.ok(focus.items[0].instruction);
    assert.ok(focus.items[0].prompts.length >= 4);
    assert.equal(focus.items[0].minutes, 10);

    assert.equal(questions.type, "question-reveal");
    assert.equal(questions.items.length, 5);
    assert.equal(questions.questionModels.length, 5);
    questions.items.forEach((question) => {
      assert.ok(getSpeakingQuestionModel(questions, question)?.modelAnswerDe);
    });

    assert.equal(writing.type, "flow");
    assert.equal(writing.items.length, 1);
    assert.match(writing.title, /Schreibbrücke/i);
    assert.match(JSON.stringify(writing), /Gegenargument \+ Reaktion/);
    assert.match(JSON.stringify(writing), /Zielgrammatik kontrolliert einsetzen/);

    assert.equal(workbook.type, "workbook");
    assert.ok(workbook.items.length >= 5);
    assert.equal(workbook.grammarUrl, "");
    assert.equal(workbook.workbookUrl, "");

    for (const removed of ["practice", "mistakes", "grammar-check", "weekly-challenge", "wrapup"]) {
      assert.equal(stageIds.includes(removed), false, slide.assignmentId + " still exposes duplicate stage " + removed);
    }
  }
});

test("C1 rotates eight distinct focus mechanics instead of weekly speaking challenges", () => {
  const slides = getSlidesByCourse("C1");
  const firstCycle = slides.slice(0, 8).map((slide) =>
    buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "focus")?.title
  );
  assert.deepEqual(firstCycle, FOCUS_TITLES);

  for (const slide of slides) {
    const expected = FOCUS_TITLES[(slide.dayNumber - 1) % FOCUS_TITLES.length];
    const focus = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "focus");
    assert.equal(focus.title, expected, slide.assignmentId);
  }
});

test("C1 focus tasks use canonical topic evidence rather than generic filler", () => {
  const day1 = getTeachingSlideByAssignmentId("C1 1");
  const day3 = getTeachingSlideByAssignmentId("C1 3");
  const day8 = getTeachingSlideByAssignmentId("C1 8");

  const focus1 = buildTeachingPresenterStages(day1, day1.topic).find((stage) => stage.id === "focus");
  const focus3 = buildTeachingPresenterStages(day3, day3.topic).find((stage) => stage.id === "focus");
  const focus8 = buildTeachingPresenterStages(day8, day8.topic).find((stage) => stage.id === "focus");

  assert.equal(focus1.title, "Position + Begründung");
  assert.match(JSON.stringify(focus1), /Lernziel|Fortschritt|Beispiel/i);

  assert.equal(focus3.title, "Paraphrasieren ohne Bedeutungsverlust");
  assert.match(JSON.stringify(focus3), /Quelle|Information|Behauptung|Medien/i);

  assert.equal(focus8.title, "Strukturierte Mini-Debatte");
  assert.match(JSON.stringify(focus8), /bezahlbar|Wohnraum|Lebensqualität|Stadt/i);
});

test("C1 grammar stays learner-aligned, German-first and briefly supported in English", () => {
  for (const slide of getSlidesByCourse("C1")) {
    const grammar = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "grammar");
    const expected = C1_CANONICAL_GRAMMAR_TITLES[slide.dayNumber - 1];

    assert.equal(grammar.type, "c1-grammar");
    assert.ok(grammar.items.some((item) => item.includes(expected)), slide.assignmentId + " does not expose learner grammar target");
    assert.ok(grammar.items.some((item) => /Kontrollpunkt:/i.test(item)), slide.assignmentId + " missing learner grammar control point");
    assert.ok(grammar.supportEn.length > 25, slide.assignmentId + " English clarification is missing");
    assert.equal(grammar.attentionDe, slide.canonicalLearnerLesson.mistake);
  }

  const day3 = buildTeachingPresenterStages(
    getTeachingSlideByAssignmentId("C1 3"),
    "Medien und Informationskompetenz",
  ).find((stage) => stage.id === "grammar");

  assert.match(day3.items.join(" "), /Konjunktiv I für indirekte Rede/i);
  assert.match(day3.supportEn, /report someone else's statement|distance/i);
  assert.match(day3.attentionDe, /Konjunktiv I|distanziert/i);
});

test("C1 self-check does not ask for another duplicate mini-presentation", () => {
  for (const slide of getSlidesByCourse("C1")) {
    assert.match(slide.wrapUpTaskDe, /^Selbstcheck:/);
    assert.doesNotMatch(slide.wrapUpTaskDe, /60–90 Sekunden lange Stellungnahme/i);
    const summary = buildTeachingPresenterStages(slide, slide.topic).at(-1);
    assert.equal(summary.id, "lesson-summary");
    assert.ok(summary.items.some((item) => item.label === "Self-check"));
  }
});

test("existing A1, A2, B1 and B2 Presenter 2 courses remain enabled", () => {
  for (const course of ["A1", "A2", "B1", "B2"]) {
    const slides = getSlidesByCourse(course).filter((slide) => slide.assignmentId !== "A1-Tutorial");
    assert.ok(slides.length > 0, course);
    assert.ok(slides.every((slide) => isTeachingPresenterV2Slide(slide)), course);
  }
});
