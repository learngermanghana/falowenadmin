import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getB2TopicCollocations, B2_TOPIC_COLLOCATION_DAYS } from "../src/data/b2PresenterLanguage.js";
import { getSlidesByCourse, getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import {
  buildTeachingPresenterStages,
  getSpeakingQuestionModel,
  isB2PresenterV2Slide,
  isTeachingPresenterV2Slide,
} from "../src/utils/teachingPresenter.js";

const TOPICS = [
  "Umweltschutz im Alltag – Müll vermeiden",
  "Mülltrennung, Recycling und Kreislaufwirtschaft",
  "Lebensmittelverschwendung und nachhaltiger Konsum",
  "Plastik, Verpackungen und bewusster Einkauf",
  "Nachhaltige Mobilität und öffentlicher Verkehr",
  "Energie sparen und erneuerbare Energien",
  "Klimafreundliches Wohnen und grüne Städte",
  "Bildungsgerechtigkeit und Zugang zu Bildung",
  "Schulpflicht, Leistung und Verantwortung der Schule",
  "Kindergarten und frühkindliche Bildung",
  "Digitale Bildung – Unterricht mit und ohne Technologie",
  "Studium, Studiengebühren und lebenslanges Lernen",
  "Wissenschaft und Forschung im Alltag",
  "Wissenschaft, Desinformation und verlässliche Quellen",
  "Wohnraummangel, hohe Mieten und soziale Gerechtigkeit",
  "Stadt oder Land – Lebensqualität und Infrastruktur",
  "Familie, Kinderbetreuung und Vereinbarkeit mit dem Beruf",
  "Arbeitswelt, Fachkräftemangel und Weiterbildung",
  "Homeoffice, ständige Erreichbarkeit und Work-Life-Balance",
  "Soziale Medien, Privatsphäre und öffentliche Identität",
  "Künstliche Intelligenz in Schule und Universität",
  "Künstliche Intelligenz, Automatisierung und Arbeitsplätze",
  "Datenschutz, Algorithmen und personalisierte Werbung",
  "Digitale Gesundheit, Telemedizin und medizinische Technologie",
  "Reisen, Massentourismus und nachhaltiger Tourismus",
  "Migration, Integration und Sprache",
  "Gleichstellung, Diskriminierung und gesellschaftlicher Zusammenhalt",
  "Gesellschaft im Wandel – B2 Prüfungstraining",
];

const REQUIRED_STAGES = [
  "intro", "warmup", "foundation", "phrases", "grammar", "examples",
  "focus", "questions", "workbook", "lesson-summary",
];

const FOCUS_TITLES = [
  "Kriterienvergleich",
  "Problem → Ursache → Lösung",
  "Zwei Positionen vergleichen",
  "Informationslücke",
  "Empfehlung mit Bedingungen",
  "Aussage reparieren",
  "Mini-Fallstudie",
  "Diskussionsreaktion",
];

function expectedAssignmentId(day) {
  return `B2-${Math.ceil(day / 4)}.${day}`;
}

test("B2 exposes the complete 28-day exam-domain curriculum with topic collocations", () => {
  const slides = getSlidesByCourse("B2");
  assert.equal(slides.length, 28);
  assert.deepEqual(slides.map((slide) => slide.dayNumber), Array.from({ length: 28 }, (_, index) => index + 1));
  assert.deepEqual(B2_TOPIC_COLLOCATION_DAYS, Array.from({ length: 28 }, (_, index) => index + 1));

  slides.forEach((slide, index) => {
    const day = index + 1;
    assert.equal(slide.assignmentId, expectedAssignmentId(day));
    assert.match(slide.title, new RegExp(TOPICS[index].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    assert.equal(getTeachingSlideByAssignmentId(slide.assignmentId)?.id, slide.id);

    const collocations = getB2TopicCollocations(day);
    assert.equal(collocations.length, 4, slide.assignmentId + " should have four topic collocations");
    collocations.forEach((item) => assert.ok(slide.keyPhrasesDe.includes(item), slide.assignmentId + " missing " + item));
  });
});

test("B2 curriculum still concentrates on recurring exam domains", () => {
  const joined = TOPICS.join(" ");
  for (const term of ["Umwelt", "Bildung", "Kindergarten", "Wissenschaft", "Wohn", "Soziale Medien", "Künstliche Intelligenz", "Kinderbetreuung", "Migration"]) {
    assert.match(joined, new RegExp(term, "i"), term);
  }
});

test("all B2 days use the stable teaching spine without the old drill stack or weekly challenge", () => {
  for (const slide of getSlidesByCourse("B2")) {
    assert.equal(isB2PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    assert.deepEqual(stageIds, REQUIRED_STAGES, slide.assignmentId + " should use the B2 teaching spine");

    const warmup = stages.find((stage) => stage.id === "warmup");
    const foundation = stages.find((stage) => stage.id === "foundation");
    const vocabulary = stages.find((stage) => stage.id === "phrases");
    const grammar = stages.find((stage) => stage.id === "grammar");
    const focus = stages.find((stage) => stage.id === "focus");
    const questions = stages.find((stage) => stage.id === "questions");
    const workbook = stages.find((stage) => stage.id === "workbook");

    assert.equal(warmup.questionSupport.length, warmup.items.length);
    assert.equal(foundation.kicker, "B2 · Thema verstehen");
    assert.ok(foundation.tension);
    assert.ok(foundation.question);

    assert.equal(vocabulary.type, "vocabulary");
    assert.equal(vocabulary.kicker, "Kollokationen & Redemittel");
    assert.equal(vocabulary.items.length, 10, slide.assignmentId + " should render all four collocations and all six argumentation phrases");
    assert.ok(vocabulary.items.some((item) => item.term === "Zusammenfassend bin ich der Auffassung, dass ..."), slide.assignmentId + " should preserve the final conclusion phrase");
    const lessonCollocations = getB2TopicCollocations(slide.dayNumber);
    assert.ok(
      lessonCollocations.some((term) => vocabulary.items.some((item) => item.term === term)),
      slide.assignmentId + " should expose topic-specific collocations",
    );

    assert.equal(grammar.type, "b2-grammar");
    assert.ok(grammar.items.length >= 3, slide.assignmentId + " should preserve B2 grammar");
    assert.ok(grammar.supportEn.length > 30, slide.assignmentId + " should have brief English grammar support");
    assert.ok(grammar.attentionEn.length > 20, slide.assignmentId + " should have a focused warning");

    assert.equal(focus.type, "flow");
    assert.equal(focus.items.length, 1, slide.assignmentId + " should use one focused task");
    assert.ok(focus.items[0].instruction);
    assert.ok(focus.items[0].prompts.length >= 4);
    assert.equal(focus.items[0].minutes, 9);

    assert.equal(questions.type, "question-reveal");
    assert.equal(questions.items.length, 5);
    assert.equal(questions.questionModels.length, 5);
    questions.items.forEach((question) => {
      assert.ok(getSpeakingQuestionModel(questions, question)?.modelAnswerDe, slide.assignmentId + " missing speaking model");
    });

    assert.equal(workbook.type, "workbook");
    assert.ok(workbook.items.length >= 5);
    assert.equal(workbook.grammarUrl, "");
    assert.equal(workbook.workbookUrl, "");

    for (const removed of ["practice", "mistakes", "grammar-check", "weekly-challenge", "wrapup"]) {
      assert.equal(stageIds.includes(removed), false, slide.assignmentId + " still exposes duplicate stage " + removed);
    }
  }
});

test("B2 rotates eight focus mechanics across the 28 lessons", () => {
  const slides = getSlidesByCourse("B2");
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

test("B2 focus tasks use the actual foundation trade-off and examples", () => {
  const day1 = getTeachingSlideByAssignmentId("B2-1.1");
  const day4 = getTeachingSlideByAssignmentId("B2-1.4");
  const day7 = getTeachingSlideByAssignmentId("B2-2.7");

  const focus1 = buildTeachingPresenterStages(day1, day1.topic).find((stage) => stage.id === "focus");
  const focus4 = buildTeachingPresenterStages(day4, day4.topic).find((stage) => stage.id === "focus");
  const focus7 = buildTeachingPresenterStages(day7, day7.topic).find((stage) => stage.id === "focus");

  assert.equal(focus1.title, "Kriterienvergleich");
  assert.match(JSON.stringify(focus1), /Bequemlichkeit|Abfall|Nutzung/i);

  assert.equal(focus4.title, "Informationslücke");
  assert.match(JSON.stringify(focus4), /Nachfüllstation|Verpackung|Beispiel/i);

  assert.equal(focus7.title, "Mini-Fallstudie");
  assert.match(JSON.stringify(focus7), /Stadt|Bäume|Gebäude|Rad/i);
});

test("B2 information-gap lessons keep Role A and Role B private until selectively revealed", () => {
  for (const assignmentId of ["B2-1.4", "B2-3.12", "B2-5.20", "B2-7.28"]) {
    const slide = getTeachingSlideByAssignmentId(assignmentId);
    const focus = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "focus");
    const item = focus.items[0];

    assert.equal(focus.title, "Informationslücke", assignmentId);
    assert.equal(item.roleCards.length, 2, assignmentId + " should have two private role cards");
    assert.deepEqual(item.roleCards.map((card) => card.id), ["A", "B"]);
    assert.match(item.roleCards[0].title, /nur für Person A/i);
    assert.match(item.roleCards[1].title, /nur für Person B/i);
    assert.ok(item.roleCards[0].content);
    assert.ok(item.roleCards[1].content);
    assert.ok(item.roleCards[0].task);
    assert.ok(item.roleCards[1].task);

    const sharedPrompts = item.prompts.join(" ");
    assert.doesNotMatch(sharedPrompts, /Rolle A kennt das Problem/i);
    assert.doesNotMatch(sharedPrompts, /Rolle B kennt ein konkretes Beispiel/i);
    assert.match(sharedPrompts, /fehlenden Informationen nur durch Fragen/i);
  }
});

test("Presenter selectively reveals only one B2 private role card at a time", () => {
  const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");

  assert.match(presenter, /const \[revealedFlowRole, setRevealedFlowRole\] = useState\("")/);
  assert.match(presenter, /Array\.isArray\(item\.roleCards\)/);
  assert.match(presenter, /revealedFlowRole === card\.id/);
  assert.match(presenter, /current === card\.id \? "" : card\.id/);
  assert.match(presenter, /Only show one card at a time\. The other partner should look away\./);
  assert.match(presenter, /setRevealedFlowRole\("");\s*setStageIndex/);
  assert.match(css, /\.presenter-role-gap-card/);
  assert.match(css, /\.presenter-role-gap-actions button\.is-active/);
});

test("B2 Day 1 keeps practical environmental grammar with concise English clarification", () => {
  const slide = getTeachingSlideByAssignmentId("B2-1.1");
  const support = buildTeacherSlideSupport(slide);
  const grammar = buildTeachingPresenterStages(slide, slide.topic)
    .find((stage) => stage.id === "grammar");

  assert.match(slide.title, /Umweltschutz im Alltag/i);
  assert.match(grammar.items.join(" "), /indem/i);
  assert.match(grammar.items.join(" "), /dadurch/i);
  assert.match(grammar.items.join(" "), /um .* zu|damit/i);
  assert.match(grammar.items.join(" "), /wodurch|sodass/i);
  assert.match(grammar.supportEn, /method|purpose|consequence/i);
  assert.match(support.grammarFocusEn.join(" "), /indem/i);
});

test("later B2 lessons cover kindergarten, housing, science, social media and AI directly", () => {
  assert.match(getTeachingSlideByAssignmentId("B2-3.10")?.title || "", /Kindergarten/i);
  assert.match(getTeachingSlideByAssignmentId("B2-4.13")?.title || "", /Wissenschaft/i);
  assert.match(getTeachingSlideByAssignmentId("B2-4.15")?.title || "", /Wohnraummangel/i);
  assert.match(getTeachingSlideByAssignmentId("B2-5.20")?.title || "", /Soziale Medien/i);
  assert.match(getTeachingSlideByAssignmentId("B2-6.21")?.title || "", /Künstliche Intelligenz/i);
  assert.match(getTeachingSlideByAssignmentId("B2-6.22")?.title || "", /Künstliche Intelligenz/i);
});

test("B2 self-check no longer asks for another duplicate production task", () => {
  for (const slide of getSlidesByCourse("B2")) {
    assert.match(slide.wrapUpTaskDe, /^Selbstcheck:/);
    assert.doesNotMatch(slide.wrapUpTaskDe, /Formuliere 5–6 Sätze/i);
    const summary = buildTeachingPresenterStages(slide, slide.topic).at(-1);
    assert.equal(summary.id, "lesson-summary");
    assert.ok(summary.items.some((item) => item.label === "Self-check"));
  }
});

test("B2 grammar renderer is projector-readable and keeps English secondary", () => {
  const presenter = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");

  assert.match(presenter, /stage\.type === "b2-grammar"/);
  assert.match(presenter, /German first/);
  assert.match(presenter, /Brief English support/);
  assert.match(css, /\.presenter-b2-grammar-rules/);
  assert.match(css, /\.presenter-b2-grammar-support/);
});

test("B1 remains fully enabled after the B2 redesign", () => {
  const b1Slides = getSlidesByCourse("B1");
  assert.equal(b1Slides.length, 28);
  assert.ok(b1Slides.every((slide) => isTeachingPresenterV2Slide(slide)));
});
