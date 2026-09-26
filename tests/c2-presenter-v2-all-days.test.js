import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getC2TopicFoundation } from "../src/data/c2TopicFoundations.js";
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

const SPINE = [
  "intro",
  "warmup",
  "foundation",
  "phrases",
  "grammar",
  "examples",
  "analysis",
  "questions",
  "writing",
  "workbook",
  "lesson-summary",
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
    assert.equal(slide.runtimePerspectivesDe.length, 3);
    assert.ok(["opinion","reformulation"].includes(slide.writeType));
  });
});

test("C2 keeps the current odd/even Write standard", () => {
  for (const slide of getSlidesByCourse("C2")) {
    const expected = slide.dayNumber % 2 ? "opinion" : "reformulation";
    assert.equal(slide.writeType, expected, slide.assignmentId + " wrong Write mode");

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const writing = stages.find((stage) => stage.id === "writing");
    assert.equal(writing.type, "flow");
    assert.equal(writing.items.length, 1);

    if (expected === "opinion") {
      assert.match(writing.title, /Stellungnahme/i);
      assert.match(JSON.stringify(writing), /These \+ zwei Bewertungskriterien/);
      assert.match(JSON.stringify(writing), /Stärkstes Gegenargument/);
    } else {
      assert.match(writing.title, /Umformung/i);
      assert.match(JSON.stringify(writing), /Bedeutung muss unverändert bleiben/i);
      assert.match(JSON.stringify(writing), /Register- oder Bedeutungsverschiebung/i);
    }
  }
});

test("all 28 C2 lessons use the analytical teaching spine without duplicate challenge pages", () => {
  for (const slide of getSlidesByCourse("C2")) {
    assert.equal(isC2PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const ids = stages.map((stage) => stage.id);
    assert.deepEqual(ids, SPINE, slide.assignmentId + " should use the C2 analytical spine");

    const grammar = stages.find((stage) => stage.id === "grammar");
    assert.deepEqual(grammar.items, slide.grammarTeachDe, slide.assignmentId + " must preserve runtime grammar");

    const examples = stages.find((stage) => stage.id === "examples");
    assert.equal(examples.items.length, 2, slide.assignmentId + " should preserve the two grammar models");

    const analysis = stages.find((stage) => stage.id === "analysis");
    assert.equal(analysis.type, "flow");
    assert.equal(analysis.items.length, 1, slide.assignmentId + " should use one analytical focus task");
    assert.ok(analysis.items[0].prompts.length >= 4);
    assert.equal(analysis.items[0].minutes, 12);

    const vocabulary = stages.find((stage) => stage.id === "phrases");
    assert.equal(vocabulary.type, "vocabulary");
    assert.equal(vocabulary.kicker, "Kollokationen & Register");
    assert.ok(vocabulary.items.length >= 6);
    assert.match(vocabulary.instruction, /nicht dekorativ/i);

    const questions = stages.find((stage) => stage.id === "questions");
    assert.equal(questions.requiresQuestionModel, true);
    assert.equal(questions.items.length, 5);
    questions.items.forEach((question) => {
      assert.ok(getSpeakingQuestionModel(questions, question)?.modelAnswerDe, slide.assignmentId + " missing speaking model");
    });

    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.equal(workbook.items.length, 5);

    for (const removed of ["practice", "mistakes", "grammar-check", "weekly-challenge", "wrapup"]) {
      assert.equal(ids.includes(removed), false, slide.assignmentId + " still exposes duplicate stage " + removed);
    }
  }
});

test("C2 rotates seven analytical mechanics across the 28 lessons", () => {
  const expectedTitles = [
    "Kriterienmatrix",
    "Evidenz-Audit",
    "Präzisions- und Registerlabor",
    "Quellen- und Distanzcheck",
    "Stärkste Gegenposition",
    "Kausalitäts- und Folgenkarte",
    "Synthese ohne Gleichmacherei",
  ];

  const slides = getSlidesByCourse("C2");
  const firstCycle = slides.slice(0, 7).map((slide) =>
    buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "analysis")?.title
  );
  assert.deepEqual(firstCycle, expectedTitles);

  for (const slide of slides) {
    const expected = expectedTitles[(slide.dayNumber - 1) % 7];
    const analysis = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "analysis");
    assert.equal(analysis.title, expected, slide.assignmentId);
  }
});

test("all 28 C2 lessons keep the Kernfrage foundation after warm-up and before language work", () => {
  for (const slide of getSlidesByCourse("C2")) {
    const foundation = getC2TopicFoundation(slide.dayNumber);
    assert.ok(foundation, slide.assignmentId + " missing topic foundation");
    assert.equal(foundation.chapter, slide.chapter);
    assert.ok(foundation.core.length > 40);
    assert.ok(foundation.en.length > 60);
    assert.ok(foundation.de.length > 60);
    assert.ok(foundation.example.length > 35);
    assert.match(foundation.tension, /↔/);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const ids = stages.map((stage) => stage.id);
    const topicStage = stages.find((stage) => stage.id === "foundation");

    assert.equal(topicStage.kicker, "C2 · Kernfrage verstehen");
    assert.equal(topicStage.simpleEnglish, foundation.en);
    assert.equal(topicStage.intro, foundation.de);
    assert.equal(topicStage.example, foundation.example);
    assert.equal(topicStage.tension, foundation.tension);
    assert.equal(topicStage.question, foundation.core);
    assert.ok(ids.indexOf("warmup") < ids.indexOf("foundation"));
    assert.ok(ids.indexOf("foundation") < ids.indexOf("phrases"));
    assert.ok(ids.indexOf("foundation") < ids.indexOf("grammar"));
  }
});

test("C2 Day 1 preserves the circular-economy teaching logic without another end challenge", () => {
  const slide = getSlidesByCourse("C2")[0];
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const foundation = stages.find((stage) => stage.id === "foundation");
  const analysis = stages.find((stage) => stage.id === "analysis");
  const writing = stages.find((stage) => stage.id === "writing");

  assert.match(foundation.simpleEnglish, /products and materials in use for as long as possible/i);
  assert.match(foundation.intro, /Wegwerfgesellschaft: Rohstoffe → Produktion → Kaufen → kurz nutzen → Wegwerfen/);
  assert.match(foundation.example, /Smartphone-Beispiel/);
  assert.match(foundation.tension, /niedriger Preis und Bequemlichkeit/);
  assert.match(foundation.tension, /Langlebigkeit und Ressourcenschonung/);

  assert.equal(analysis.title, "Kriterienmatrix");
  assert.match(JSON.stringify(analysis), /Verbraucher tragen die größte Verantwortung/);
  assert.match(JSON.stringify(analysis), /verbindlichen Regeln/);
  assert.match(writing.title, /Stellungnahme planen/);
  assert.match(JSON.stringify(writing), /alle drei Perspektiven/i);
  assert.equal(stages.some((stage) => stage.id === "weekly-challenge"), false);
});

test("C2 presenter declaration stays idempotent with the build patch hook", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const presenterSource = fs.readFileSync(path.join(process.cwd(), "src/utils/teachingPresenter.js"), "utf8");
  const patchSource = fs.readFileSync(path.join(process.cwd(), "scripts/patchC2CourseStyle.mjs"), "utf8");

  const declarations = presenterSource.match(/^const C2_PRESENTER_V2_ASSIGNMENTS = .*;$/gm) || [];
  assert.equal(declarations.length, 1);
  assert.match(declarations[0], /Array\.from\(\{ length: 28 \}/);
  assert.match(patchSource, /const c2DeclarationPattern = \/\^const C2_PRESENTER_V2_ASSIGNMENTS/);
  assert.match(patchSource, /next = next\.replace\(c2DeclarationPattern, ""\)/);
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
