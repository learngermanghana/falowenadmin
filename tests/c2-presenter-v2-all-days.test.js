import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import {
  buildTeachingPresenterStages,
  getSpeakingQuestionModel,
  isC2PresenterV2Slide,
  isTeachingPresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const EXPECTED = [
  ["1.1","Sprache, Identität und Gesellschaft","Registerwechsel"],
  ["1.2","Bildung und Wissensvermittlung","Thema–Rhema"],
  ["1.3","Wissenschaft und Erkenntnis","Nominalstil"],
  ["1.4","Medien und öffentliche Meinung","Indirekte Rede"],
  ["1.5","Politik und demokratische Prozesse","Subjektive Modalität"],
  ["1.6","Wirtschaft und soziale Ungleichheit","Kausalität"],
  ["1.7","Arbeit, Leistung und gesellschaftlicher Wandel","Funktionsverbgefüge"],
  ["2.1","Technologie und künstliche Intelligenz","Partizipialattribute"],
  ["2.2","Datenschutz und digitale Freiheit","sich lassen"],
  ["2.3","Medizin, Ethik und Verantwortung","Subjektive Modalverben"],
  ["2.4","Umwelt und Nachhaltigkeit","wenngleich"],
  ["2.5","Migration und gesellschaftliche Teilhabe","Rektion"],
  ["2.6","Kultur und kulturelles Gedächtnis","Komposition"],
  ["2.7","Literatur und Interpretation","Denotation"],
  ["3.1","Konsum, Vergleich und Bewertung","Vergleichs- und Intensivierungsstrukturen"],
  ["3.2","Konsum und Werbewirkung","Informationsverdichtung"],
  ["3.3","Bedingungen und Voraussetzungen","sofern"],
  ["3.4","Freiheit und Verantwortung","Konjunktiv II Vergangenheit"],
  ["3.5","Globalisierung und Machtverhältnisse","insofern"],
  ["4.1","Diskurspartikeln und Haltung","eben"],
  ["4.2","Idiomatische Verb-Nomen-Verbindungen","feste Verb-Nomen-Verbindungen"],
  ["4.3","Geschichte und Erinnerungskultur","nachdem"],
  ["4.4","Internationale Zusammenarbeit und Diplomatie","Hedging"],
  ["4.5","Gesellschaftliche Kontroversen","These"],
  ["5.1","Forschung, Daten und Statistik","belegen"],
  ["5.2","Philosophie und abstraktes Denken","Satzperioden"],
  ["5.3","Professionelle und akademische Kommunikation","Redundanz"],
  ["5.4","C2 Synthese","Register"],
];

test("C2 Admin slides match the canonical Falowen Course Book day 1–28 sequence", () => {
  const slides = getSlidesByCourse("C2");
  assert.equal(slides.length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));
  assert.deepEqual(slides.map((slide) => slide.chapter), EXPECTED.map(([chapter]) => chapter));
  assert.deepEqual(slides.map((slide) => slide.assignmentId), EXPECTED.map(([chapter]) => `C2-${chapter}`));
  assert.deepEqual(slides.map((slide) => String(slide.title).replace(/^C2 Day \d+ · /, "")), EXPECTED.map(([, title]) => title));

  slides.forEach((slide, index) => {
    assert.match(slide.topic, new RegExp(EXPECTED[index][0].replace(".", "\\.")));
    assert.match(slide.teacherNotesEn.join(" "), new RegExp(EXPECTED[index][2], "i"));
  });
});

test("every C2 lesson uses the new text-first Presenter 2.0 teaching standard", () => {
  const slides = getSlidesByCourse("C2");
  for (const slide of slides) {
    assert.equal(isC2PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);
    assert.ok(slide.warmupQuestionsDe.length >= 4, `${slide.assignmentId} needs four warm-up prompts`);
    assert.ok(slide.keyPhrasesDe.length >= 6, `${slide.assignmentId} needs topic language`);
    assert.equal(slide.grammarTeachDe.length, 3, `${slide.assignmentId} needs when/why + structure grammar teaching`);
    assert.ok(slide.commonMistakesDe.length >= 3, `${slide.assignmentId} needs concrete common mistakes`);
    assert.equal(slide.studentQuestionsDe.length, 5, `${slide.assignmentId} needs five speaking prompts`);
    assert.equal(slide.speakingModels.length, 5, `${slide.assignmentId} needs five speaking models`);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    ["intro","warmup","phrases","grammar","examples","practice","workbook","mistakes","questions","wrapup","grammar-check"]
      .forEach((stageId) => assert.ok(stageIds.includes(stageId), `${slide.assignmentId} missing ${stageId}`));

    const grammar = stages.find((stage) => stage.id === "grammar");
    assert.deepEqual(grammar.items, slide.grammarTeachDe, `${slide.assignmentId} must teach its own grammar notes, not a generic fallback`);

    const examples = stages.find((stage) => stage.id === "examples");
    assert.equal(examples.items.length, 3, `${slide.assignmentId} should expose three topic models`);

    const practice = stages.find((stage) => stage.id === "practice");
    assert.equal(practice.items.length, 5, `${slide.assignmentId} needs five C2 practice phases`);
    assert.ok(practice.items.every((item) => Number(item.minutes || 0) > 0), `${slide.assignmentId} practice needs timing`);

    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.equal(workbook.items.length, 5, `${slide.assignmentId} workbook bridge should cover Learn/Grammar, collocations, speaking, writing and exam transfer`);
    assert.match(workbook.items.map((item) => item.label).join(" "), /Learn \/ Grammar/);
    assert.match(workbook.items.map((item) => item.label).join(" "), /Kollokationen/);
    assert.match(workbook.items.map((item) => item.label).join(" "), /Write/);

    const mistakes = stages.find((stage) => stage.id === "mistakes");
    assert.deepEqual(mistakes.items, slide.commonMistakesDe, `${slide.assignmentId} should use lesson-specific mistakes`);

    const questions = stages.find((stage) => stage.id === "questions");
    assert.equal(questions.type, "question-reveal");
    assert.equal(questions.requiresQuestionModel, true);
    questions.items.forEach((question) => {
      assert.ok(getSpeakingQuestionModel(questions, question)?.modelAnswerDe, `${slide.assignmentId} missing speaking model`);
    });

    const grammarCheck = stages.find((stage) => stage.id === "grammar-check");
    assert.equal(grammarCheck.items.length, 3);
    assert.equal(grammarCheck.questionModels.length, 3);
    assert.equal(grammarCheck.requiresQuestionModel, true);
  }
});

test("C2 first and last lessons now match the updated Falowen course rather than the old environmental sequence", () => {
  const slides = getSlidesByCourse("C2");
  assert.match(slides[0].title, /Sprache, Identität und Gesellschaft/);
  assert.match(slides[0].topic, /Zugehörigkeit, Distanz und Identität/);
  assert.match(slides[0].keyPhrasesDe.join(" "), /Zugehörigkeit vermitteln/);
  assert.match(slides[0].grammarTeachDe.join(" "), /Registerwechsel|register/i);

  assert.match(slides[27].title, /C2 Synthese/);
  assert.match(slides[27].grammarTeachDe.join(" "), /Register|Evidenz|Kohäsion/i);
  assert.match(slides[27].wrapUpTaskDe, /220 Wörter|Evidenz|Einwand/i);
});
