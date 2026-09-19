import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import {
  getPresenterTopicFoundation,
  PRESENTER_FOUNDATION_LEVELS,
} from "../src/data/presenterTopicFoundations.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const C1_TOPIC_SIGNALS = [
  ["Wissenschaft und Forschung", /wissenschaft|Studie|Forschung/i],
  ["Kunst und Kultur", /Kunst|Kultur|Theater/i],
  ["Künstliche Intelligenz und Arbeitswelt", /KI|künstliche Intelligenz|Automatisierung/i],
  ["Digitalisierung und Datenschutz", /Daten|Datenschutz|digitale Dienste/i],
  ["Personalisierte Werbung", /Werbung|Werbeprofile|Produktsuchen/i],
  ["Online- und Offline-Identität", /Identität|online|offline/i],
  ["Gesellschaftlicher Zusammenhalt", /Zusammenhalt|Vertrauen|Teilhabe/i],
  ["Mehrsprachigkeit", /Mehrsprachigkeit|Sprachen|Bildungssprache/i],
  ["Migration und Integration", /Migration|Integration|Zugewandert/i],
  ["Ehrenamt und gesellschaftlicher Pflichtdienst", /Ehrenamt|Pflichtdienst|Freiwilligkeit/i],
  ["Demokratie und soziale Medien", /soziale Medien|politisch|Algorithmen/i],
  ["Bildung und Prüfungsformate", /Prüfung|Prüfungsformate|Bewertung/i],
  ["Lebenslanges Lernen", /Weiterbildung|lebenslang|Lernen/i],
  ["Homeoffice und moderne Arbeitsformen", /Homeoffice|hybride Arbeit|Erreichbarkeit/i],
  ["Fachkräftemangel und berufliche Mobilität", /Fachkräfte|Qualifikationen|Personal/i],
  ["Bedingungsloses Grundeinkommen", /Grundeinkommen|Sozialleistungen|Finanzierung/i],
  ["Nachhaltigkeit in der Wirtschaft", /nachhaltig|Wirtschaft|Produktion/i],
  ["Klimawandel und Verkehr", /Verkehr|Emissionen|Mobilität/i],
  ["Nachhaltiger Konsum", /Konsum|Produkte|Reparierbarkeit/i],
  ["Reisen und Nachhaltigkeit", /Reisen|Tourismus|Gäste/i],
  ["Gesundheit und Impfpflicht", /Impfpflicht|Gesundheit|Impf/i],
  ["Ernährung und moderner Lebensstil", /Ernährung|Lebensstil|gesund/i],
  ["Wohnen, Mieten und soziale Gerechtigkeit", /Mieten|Wohnraum|Wohnung/i],
  ["Zukunftstechnologien und Innovation", /Technologie|Innovation|Pilot/i],
  ["Globalisierung und internationale Zusammenarbeit", /Globalisierung|international|Lieferketten/i],
  ["Wissenschaftliches Arbeiten und Quellen", /Quelle|wissenschaftlich|Statistik/i],
  ["Stellungnahme und formelle Korrespondenz", /Stellungnahme|formell|Korrespondenz|E-Mail/i],
  ["Prüfungsvorbereitung und spontane Argumentation", /Prüfung|Argumentation|Zeitdruck/i],
];

const LEVEL_EXPECTATIONS = {
  A2: {
    kicker: "A2 · Situation verstehen",
    hasExample: true,
    hasQuestion: false,
    hasTension: false,
    hasSimpleEnglish: false,
  },
  B1: {
    kicker: "B1 · Thema kurz verstehen",
    hasExample: true,
    hasQuestion: true,
    hasTension: false,
    hasSimpleEnglish: false,
  },
  B2: {
    kicker: "B2 · Thema verstehen",
    hasExample: true,
    hasQuestion: true,
    hasTension: true,
    hasSimpleEnglish: false,
  },
  C1: {
    kicker: "C1 · Thema verstehen",
    hasExample: true,
    hasQuestion: true,
    hasTension: true,
    hasSimpleEnglish: false,
  },
  C2: {
    kicker: "C2 · Kernfrage verstehen",
    hasExample: true,
    hasQuestion: true,
    hasTension: true,
    hasSimpleEnglish: true,
  },
};

test("A2 through C2 expose 28 level-appropriate topic foundations", () => {
  assert.deepEqual(PRESENTER_FOUNDATION_LEVELS, ["A2", "B1", "B2", "C1", "C2"]);

  for (const [level, expectation] of Object.entries(LEVEL_EXPECTATIONS)) {
    const slides = getSlidesByCourse(level);
    assert.equal(slides.length, 28, level + " should expose 28 teaching slides");

    for (const slide of slides) {
      const foundation = getPresenterTopicFoundation(slide);
      assert.ok(foundation, slide.assignmentId + " missing topic foundation");
      assert.equal(foundation.kicker, expectation.kicker, slide.assignmentId);
      assert.ok(String(foundation.title || "").length > 2, slide.assignmentId + " title missing");
      assert.ok(String(foundation.intro || "").length > 45, slide.assignmentId + " explanation too thin");
      assert.equal(Boolean(foundation.example), expectation.hasExample, slide.assignmentId + " example contract");
      assert.equal(Boolean(foundation.question), expectation.hasQuestion, slide.assignmentId + " question contract");
      assert.equal(Boolean(foundation.tension), expectation.hasTension, slide.assignmentId + " tension contract");
      assert.equal(Boolean(foundation.simpleEnglish), expectation.hasSimpleEnglish, slide.assignmentId + " English bridge contract");

      if (expectation.hasTension) assert.match(foundation.tension, /↔/, slide.assignmentId + " tension should show the trade-off");
      if (["B2", "C1", "C2"].includes(level)) assert.match(foundation.teacherNote, /Do not debate yet/i, slide.assignmentId + " teacher cue missing");
    }
  }
});

test("C1 foundations are keyed to the actual 28 Admin lesson topics", () => {
  const slides = getSlidesByCourse("C1");
  assert.equal(slides.length, 28);
  assert.deepEqual(
    slides.map((slide) => String(slide.title).replace(/^C1 Day \d+ · /, "")),
    C1_TOPIC_SIGNALS.map(([topic]) => topic),
  );

  slides.forEach((slide, index) => {
    const expectedTopic = C1_TOPIC_SIGNALS[index][0];
    const signal = C1_TOPIC_SIGNALS[index][1];
    const foundation = getPresenterTopicFoundation(slide);
    const combined = [foundation.intro, foundation.example, foundation.tension, foundation.question].join(" ");

    assert.equal(foundation.title, expectedTopic, slide.assignmentId + " foundation title must match the actual C1 lesson");
    assert.match(combined, signal, slide.assignmentId + " foundation content does not match " + expectedTopic);
  });

  const day1 = getPresenterTopicFoundation(slides[0]);
  const day2 = getPresenterTopicFoundation(slides[1]);
  assert.match(day1.intro, /Wissenschaftliche Erkenntnisse|Methoden|Daten/);
  assert.doesNotMatch(day1.intro, /C1-Lernziel|Lernplan/);
  assert.match(day2.intro, /Kunst und Kultur/);
  assert.doesNotMatch(day2.intro, /Mehrfachidentität|zwei Sprachen/);
});

test("Presenter 2.0 orders warm-up before foundation and foundation before language work", () => {
  for (const level of PRESENTER_FOUNDATION_LEVELS) {
    for (const slide of getSlidesByCourse(level)) {
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      const ids = stages.map((stage) => stage.id);
      const warmup = ids.indexOf("warmup");
      const foundation = ids.indexOf("foundation");
      const phrases = ids.indexOf("phrases");
      const grammar = ids.indexOf("grammar");

      assert.ok(warmup > -1, slide.assignmentId + " warm-up missing");
      assert.ok(foundation > warmup, slide.assignmentId + " foundation should follow warm-up");
      assert.ok(phrases > foundation, slide.assignmentId + " Redemittel should follow foundation");
      assert.ok(grammar > foundation, slide.assignmentId + " grammar should follow foundation");
    }
  }
});

test("the level progression gets deliberately deeper from A2 to C2", () => {
  const sample = Object.fromEntries(
    PRESENTER_FOUNDATION_LEVELS.map((level) => [level, getPresenterTopicFoundation(getSlidesByCourse(level)[0])]),
  );

  assert.equal(Boolean(sample.A2.question), false);
  assert.equal(Boolean(sample.A2.tension), false);

  assert.equal(Boolean(sample.B1.question), true);
  assert.equal(Boolean(sample.B1.tension), false);

  assert.equal(Boolean(sample.B2.question), true);
  assert.equal(Boolean(sample.B2.tension), true);

  assert.equal(Boolean(sample.C1.question), true);
  assert.equal(Boolean(sample.C1.tension), true);

  assert.equal(Boolean(sample.C2.simpleEnglish), true);
  assert.equal(Boolean(sample.C2.question), true);
  assert.equal(Boolean(sample.C2.tension), true);
});

test("A1 remains outside the new topic-foundation progression", () => {
  const slides = getSlidesByCourse("A1");
  assert.ok(slides.length > 0);
  for (const slide of slides) {
    assert.equal(getPresenterTopicFoundation(slide), null);
    const stages = buildTeachingPresenterStages(slide, slide.topic);
    assert.equal(stages.some((stage) => stage.id === "foundation"), false);
  }
});
