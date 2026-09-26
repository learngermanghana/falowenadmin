import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse, getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import {
  buildTeachingPresenterStages,
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
  "intro", "warmup", "phrases", "grammar", "examples",
  "practice", "workbook", "mistakes", "questions", "weekly-challenge", "lesson-summary",
];

function expectedAssignmentId(day) {
  return `B2-${Math.ceil(day / 4)}.${day}`;
}

test("B2 exposes the complete new 28-day exam-domain curriculum", () => {
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

test("B2 curriculum concentrates on recurring exam domains", () => {
  const joined = TOPICS.join(" ");
  for (const term of ["Umwelt", "Bildung", "Kindergarten", "Wissenschaft", "Wohn", "Soziale Medien", "Künstliche Intelligenz", "Kinderbetreuung", "Migration"]) {
    assert.match(joined, new RegExp(term, "i"), term);
  }
});

test("all B2 days use Presenter 2.0 with substantial classroom support", () => {
  for (const slide of getSlidesByCourse("B2")) {
    assert.equal(isB2PresenterV2Slide(slide), true, slide.assignmentId);
    assert.equal(isTeachingPresenterV2Slide(slide), true, slide.assignmentId);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    REQUIRED_STAGES.forEach((stageId) => assert.ok(stageIds.includes(stageId), `${slide.assignmentId} missing ${stageId}`));

    const grammar = stages.find((stage) => stage.id === "grammar");
    const questions = stages.find((stage) => stage.id === "questions");
    const practice = stages.find((stage) => stage.id === "practice");
    const workbook = stages.find((stage) => stage.id === "workbook");
    const warmup = stages.find((stage) => stage.id === "warmup");
    const vocabulary = stages.find((stage) => stage.id === "phrases");
    const weeklyChallenge = stages.find((stage) => stage.id === "weekly-challenge");

    assert.ok(grammar.items.length >= 3, `${slide.assignmentId} should have focused B2 grammar`);
    assert.equal(warmup.questionSupport.length, warmup.items.length, `${slide.assignmentId} should use enhanced warm-up cards`);
    assert.equal(vocabulary.type, "vocabulary");
    assert.ok(vocabulary.items.length >= 6, `${slide.assignmentId} should use vocabulary cards`);
    assert.ok(weeklyChallenge.items.length >= 3, `${slide.assignmentId} should have a weekly challenge`);
    assert.equal(stages.some((stage) => stage.id === "wrapup"), false, `${slide.assignmentId} should finish through challenge + summary rather than a duplicate wrap-up`);
    assert.equal(questions.type, "question-reveal");
    assert.ok(questions.items.length >= 5, `${slide.assignmentId} should have five speaking questions`);
    assert.ok(questions.supportItems.length >= 5, `${slide.assignmentId} should have matching model answers`);
    assert.equal(practice.type, "flow");
    assert.ok(practice.items.length >= 4, `${slide.assignmentId} should expose guided practice`);
    assert.equal(workbook.type, "workbook");
    assert.ok(workbook.items.length >= 5, `${slide.assignmentId} should expose exam transfer`);
  }
});

test("B2 Day 1 starts with practical environmental protection grammar", () => {
  const slide = getTeachingSlideByAssignmentId("B2-1.1");
  const support = buildTeacherSlideSupport(slide);
  const grammarText = buildTeachingPresenterStages(slide, slide.topic)
    .find((stage) => stage.id === "grammar")?.items.join(" ") || "";

  assert.match(slide.title, /Umweltschutz im Alltag/i);
  assert.match(grammarText, /indem/i);
  assert.match(grammarText, /dadurch/i);
  assert.match(grammarText, /um .* zu|damit/i);
  assert.match(grammarText, /wodurch|sodass/i);
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

test("B2 does not invent unverified direct workbook or grammar URLs", () => {
  for (const slide of getSlidesByCourse("B2")) {
    const workbook = buildTeachingPresenterStages(slide, slide.topic).find((stage) => stage.id === "workbook");
    assert.equal(workbook.grammarUrl, "", slide.assignmentId);
    assert.equal(workbook.workbookUrl, "", slide.assignmentId);
  }
});

test("B1 remains fully enabled after replacing the B2 curriculum", () => {
  const b1Slides = getSlidesByCourse("B1");
  assert.equal(b1Slides.length, 28);
  assert.ok(b1Slides.every((slide) => isTeachingPresenterV2Slide(slide)));
});
