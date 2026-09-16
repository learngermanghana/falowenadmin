import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import {
  buildTeachingPresenterStages,
  getSpeakingQuestionModel,
  isC2PresenterV2Slide,
  isTeachingPresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const EXPECTED_TOPICS = [
  "Kreislaufwirtschaft und Wegwerfgesellschaft",
  "Klimapolitik, Verantwortung und soziale Gerechtigkeit",
  "Energie- und Mobilitätswende",
  "Nachhaltigkeit zwischen Innovation und Verzicht",
  "Schulpflicht, Bildungsauftrag und individuelle Freiheit",
  "Kindergarten und frühkindliche Bildung",
  "Chancengleichheit, Leistung und Selektion im Bildungssystem",
  "Wissenschaftskommunikation, Vertrauen und Evidenz",
  "Künstliche Intelligenz und menschliche Autonomie",
  "Algorithmische Öffentlichkeit und soziale Medien",
  "Datenschutz, Personalisierung und digitale Bequemlichkeit",
  "Automatisierung, Arbeit und lebenslanges Lernen",
  "Wohnungskrise, Stadtplanung und soziale Mischung",
  "Demografischer Wandel, Generationen und Pflege",
  "Migration, Integration und gesellschaftliche Zugehörigkeit",
  "Gesellschaftlicher Zusammenhalt und Polarisierung",
  "Wirtschaftswachstum, Wohlstand und Gemeinwohl",
  "Globalisierung, Lieferketten und wirtschaftliche Resilienz",
  "Fachkräftemangel und qualifizierte Zuwanderung",
  "Konsum, Werbung und Verhaltenssteuerung",
  "Reisen, Tourismus und kulturelle Authentizität",
  "Kulturförderung, Kanon und gesellschaftliche Teilhabe",
  "Mehrsprachigkeit, Sprachstandards und Sprachwandel",
  "Journalismus, Desinformation und epistemische Verantwortung",
  "Quellenanalyse, Evidenz und Argumentationskritik",
  "Essay schreiben: Synthese, Differenzierung und Stil",
  "Formelle Korrespondenz, Beschwerde und institutionelle Stellungnahme",
  "Prüfungssimulation: spontane Debatte und schriftliche Synthese",
];

test("C2 exposes 28 exam-domain lessons in the intended order", () => {
  const slides = getSlidesByCourse("C2");
  assert.equal(slides.length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));
  assert.deepEqual(slides.map((slide) => slide.assignmentId), Array.from({ length: 28 }, (_, index) => `C2 ${index + 1}`));
  assert.deepEqual(slides.map((slide) => String(slide.title).replace(/^C2 Day \d+ · /, "")), EXPECTED_TOPICS);
});

test("every C2 lesson uses Presenter 2.0 with C2-depth production", () => {
  const slides = getSlidesByCourse("C2");
  for (const slide of slides) {
    assert.equal(isC2PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    ["intro", "warmup", "phrases", "grammar", "examples", "practice", "workbook", "mistakes", "questions", "wrapup", "grammar-check"]
      .forEach((stageId) => assert.ok(stageIds.includes(stageId), `${slide.assignmentId} missing ${stageId}`));

    const grammar = stages.find((stage) => stage.id === "grammar");
    assert.ok(grammar.items.length >= 2, `${slide.assignmentId} needs multiple grammar targets`);

    const examples = stages.find((stage) => stage.id === "examples");
    assert.equal(examples.items.length, 3, `${slide.assignmentId} should expose three model sentences`);

    const practice = stages.find((stage) => stage.id === "practice");
    assert.ok(practice.items.length >= 5, `${slide.assignmentId} needs C2 problem/evidence/counterargument/synthesis practice`);
    assert.ok(practice.items.every((item) => Number(item.minutes || 0) > 0), `${slide.assignmentId} practice needs timing`);

    const workbook = stages.find((stage) => stage.id === "workbook");
    assert.equal(workbook.items.length, 5, `${slide.assignmentId} workbook bridge should cover five skills`);
    assert.equal(workbook.grammarUrl, "");
    assert.equal(workbook.workbookUrl, "");

    const questions = stages.find((stage) => stage.id === "questions");
    assert.equal(questions.type, "question-reveal");
    assert.equal(questions.items.length, 5);
    assert.equal(questions.requiresQuestionModel, true);
    assert.equal(questions.questionModels.length, 5);
    questions.items.forEach((question) => {
      const model = getSpeakingQuestionModel(questions, question);
      assert.ok(model?.modelAnswerDe, `${slide.assignmentId} missing speaking model for ${question}`);
    });

    const grammarCheck = stages.find((stage) => stage.id === "grammar-check");
    assert.equal(grammarCheck.type, "question-reveal");
    assert.equal(grammarCheck.items.length, 3);
    assert.equal(grammarCheck.questionModels.length, 3);
    assert.equal(grammarCheck.requiresQuestionModel, true);
  }
});

test("C2 Day 1 begins with circular economy and calibrated environmental argumentation", () => {
  const slide = getSlidesByCourse("C2")[0];
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const grammarText = stages.find((stage) => stage.id === "grammar")?.items.join(" ") || "";
  const practiceText = stages.find((stage) => stage.id === "practice")?.items.map((item) => `${item.title} ${item.instruction}`).join(" ") || "";

  assert.match(slide.title, /Kreislaufwirtschaft und Wegwerfgesellschaft/);
  assert.match(grammarText, /Nominalisierung/i);
  assert.match(grammarText, /Aussagen abstufen|dürfte|ließe sich/i);
  assert.match(practiceText, /Prämisse und Evidenz/i);
  assert.match(practiceText, /C2-Synthese/i);
});
