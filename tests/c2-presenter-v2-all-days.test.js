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
  ["1.1","Kreislaufwirtschaft und Wegwerfgesellschaft","Nuancierte Bewertung und Registersteuerung"],
  ["1.2","Schulpflicht und Bildungsgerechtigkeit","Informationsstruktur: Thema, Rhema und Vorfeld"],
  ["1.3","Wissenschaft, Forschung und Hochschulen","Nominalstil und Verbalstil gezielt wählen"],
  ["1.4","Journalismus, Nachrichten und Quellenkritik","Indirekte Rede und Konjunktiv I/II"],
  ["1.5","Politik, Verantwortung und öffentliches Vertrauen","Subjektive Modalität und Evidenz"],
  ["1.6","Soziale Ungleichheit und Chancengerechtigkeit","Kausale Beziehungen differenziert ausdrücken"],
  ["1.7","Arbeitswelt, Leistungsdruck und Work-Life-Balance","Funktionsverbgefüge sinnvoll einsetzen"],
  ["2.1","Künstliche Intelligenz und Automatisierung","Partizipialattribute und verdichtete Strukturen"],
  ["2.2","Datenschutz und digitale Selbstbestimmung","Passiv-Ersatzformen und Verantwortungsfokus"],
  ["2.3","Medizin, Gesundheit und Forschungsethik","Evidenz, subjektive Modalverben und vorsichtige Schlussfolgerungen"],
  ["2.4","Klimaschutz, Nachhaltigkeit und Mobilität","Konzessive und adversative Verknüpfungen"],
  ["2.5","Migration, Integration und gesellschaftliche Teilhabe","Rektion und präpositionale Ergänzungen"],
  ["2.6","Sprache, Mehrsprachigkeit und kulturelle Identität","Wortbildung und Bedeutungspräzision"],
  ["2.7","Kultur, Literatur und gesellschaftliches Gedächtnis","Semantik, Metapher und übertragene Bedeutung"],
  ["3.1","Wohnen, Mieten und Lebensqualität","Vergleiche, Steigerung und Gradpartikeln"],
  ["3.2","Konsum, Werbung und Kaufverhalten","Informationskompression und Nominalisierung"],
  ["3.3","Kindergarten, Kinderbetreuung und Familienpolitik","Konditionale Strukturen und Voraussetzungen"],
  ["3.4","Studium, Weiterbildung und lebenslanges Lernen","Konjunktiv II Vergangenheit und irreale Alternativen"],
  ["3.5","Globalisierung, Handel und wirtschaftliche Abhängigkeiten","Komplexe Konnektoren und logische Beziehungen"],
  ["4.1","Soziale Medien, Debattenkultur und Meinungsbildung","Abtönung, Diskurspartikeln und pragmatische Wirkung"],
  ["4.2","Verwaltung, Bürgerservice und gesellschaftliche Institutionen","Verb-Nomen-Kollokationen und institutioneller Stil"],
  ["4.3","Reisen, Tourismus und kulturelle Begegnung","Temporale Verknüpfungen und zeitliche Logik"],
  ["4.4","Internationale Zusammenarbeit und Diplomatie","Hedging, vorsichtige Kritik und diplomatische Formulierungen"],
  ["4.5","Gesellschaftliche Kontroversen und öffentliche Debatten","Argumentationslogik: These, Begründung, Beleg, Einwand und Reaktion"],
  ["5.1","Daten, Statistik und wissenschaftliche Evidenz","Evidentialität und vorsichtige Schlussfolgerungen"],
  ["5.2","Philosophie, Ethik und technischer Fortschritt","Satzperioden, Einbettung und hierarchische Satzstruktur"],
  ["5.3","Akademisches Schreiben und formelle Korrespondenz","Redundanz, Präzision, Register und Kohäsion"],
  ["5.4","C2 Prüfungssimulation: Stellungnahme, Umformung und Synthese","Register, Nuance, Evidenz, Kohäsion und Reformulierung"],
];

test("C2 Admin slides match the current Falowen runtime curriculum day 1–28", () => {
  const slides = getSlidesByCourse("C2");
  assert.equal(slides.length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));
  assert.deepEqual(slides.map((slide) => slide.chapter), EXPECTED.map(([chapter]) => chapter));
  assert.deepEqual(slides.map((slide) => slide.assignmentId), EXPECTED.map(([chapter]) => "C2-" + chapter));
  assert.deepEqual(slides.map((slide) => String(slide.title).replace(/^C2 Day \d+ · /, "")), EXPECTED.map(([, title]) => title));

  slides.forEach((slide, index) => {
    assert.equal(slide.grammarTeachDe[0], "Zielstruktur: " + EXPECTED[index][2] + ".");
    assert.equal(slide.runtimePerspectivesDe.length, 3, slide.assignmentId + " must carry the three current Falowen debate statements");
    assert.ok(["opinion","reformulation"].includes(slide.writeType), slide.assignmentId + " must carry current Write mode");
  });
});

test("C2 uses the current Falowen odd/even Write standard", () => {
  const slides = getSlidesByCourse("C2");
  for (const slide of slides) {
    const expected = slide.dayNumber % 2 ? "opinion" : "reformulation";
    assert.equal(slide.writeType, expected, slide.assignmentId + " wrong Write mode");
    const writeBridge = slide.workbookConnection.parts.find((item) => item.label === "Write");
    assert.ok(writeBridge?.detailEn, slide.assignmentId + " missing Write bridge");
    if (expected === "opinion") {
      assert.match(writeBridge.detailEn, /Stellungnahme|350 Wörter/i);
      assert.equal(slide.wrapUpTaskDe.includes(slide.canonicalWritingPromptDe), true);
    } else {
      assert.match(writeBridge.detailEn, /Umformung|Vorgabewort/i);
      assert.match(slide.wrapUpTaskDe, /Umformungsaufgabe|Transformationsfamilien/i);
    }
  }
});

test("every C2 lesson keeps the text-first Presenter 2.0 teaching standard", () => {
  const slides = getSlidesByCourse("C2");
  for (const slide of slides) {
    assert.equal(isC2PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);
    assert.ok(slide.knowledgeTextDe.startsWith("1-Minuten-Wissen:"), slide.assignmentId + " missing one-minute knowledge text");
    assert.ok(slide.warmupQuestionsDe.length >= 4, slide.assignmentId + " needs four warm-up prompts");
    assert.ok(slide.keyPhrasesDe.length >= 6, slide.assignmentId + " needs topic language");
    assert.ok(slide.grammarTeachDe.length >= 4, slide.assignmentId + " needs grammar principle and current models");
    assert.ok(slide.commonMistakesDe.length >= 3, slide.assignmentId + " needs concrete common mistakes");
    assert.equal(slide.studentQuestionsDe.length, 5, slide.assignmentId + " needs five speaking prompts");
    assert.equal(slide.speakingModels.length, 5, slide.assignmentId + " needs five speaking models");

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    ["intro","warmup","knowledge","phrases","grammar","examples","practice","workbook","mistakes","questions","wrapup","grammar-check"]
      .forEach((stageId) => assert.ok(stageIds.includes(stageId), slide.assignmentId + " missing " + stageId));

    const grammar = stages.find((stage) => stage.id === "grammar");
    assert.deepEqual(grammar.items, slide.grammarTeachDe, slide.assignmentId + " must teach the runtime grammar rather than a generic fallback");

    const examples = stages.find((stage) => stage.id === "examples");
    assert.equal(examples.items.length, 2, slide.assignmentId + " should expose the two current Falowen grammar models");

    const practice = stages.find((stage) => stage.id === "practice");
    assert.equal(practice.items.length, 5, slide.assignmentId + " needs five C2 practice phases");
    assert.ok(practice.items.every((item) => Number(item.minutes || 0) > 0), slide.assignmentId + " practice needs timing");

    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.equal(workbook.items.length, 5, slide.assignmentId + " workbook bridge should cover current Learn, collocations, speaking and Write mode");

    const mistakes = stages.find((stage) => stage.id === "mistakes");
    assert.deepEqual(mistakes.items, slide.commonMistakesDe, slide.assignmentId + " should use lesson-specific mistakes");

    const questions = stages.find((stage) => stage.id === "questions");
    assert.equal(questions.requiresQuestionModel, true);
    questions.items.forEach((question) => {
      assert.ok(getSpeakingQuestionModel(questions, question)?.modelAnswerDe, slide.assignmentId + " missing speaking model");
    });

    const grammarCheck = stages.find((stage) => stage.id === "grammar-check");
    assert.equal(grammarCheck.items.length, 3);
    assert.equal(grammarCheck.questionModels.length, 3);
    assert.equal(grammarCheck.requiresQuestionModel, true);
  }
});

test("high-signal updated C2 domains stay locked to the current learner curriculum", () => {
  const slides = getSlidesByCourse("C2");
  assert.match(slides[0].title, /Kreislaufwirtschaft und Wegwerfgesellschaft/);
  assert.match(slides[14].title, /Wohnen, Mieten und Lebensqualität/);
  assert.match(slides[16].title, /Kindergarten, Kinderbetreuung und Familienpolitik/);
  assert.match(slides[21].title, /Reisen, Tourismus und kulturelle Begegnung/);
  assert.match(slides[22].title, /Internationale Zusammenarbeit und Diplomatie/);
  assert.match(slides[27].title, /C2 Prüfungssimulation: Stellungnahme, Umformung und Synthese/);
});
