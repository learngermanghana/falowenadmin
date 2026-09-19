import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { C1_CANONICAL_TITLES, getC1CanonicalLesson } from "../src/data/c1CanonicalCurriculum.js";
import {
  getPresenterTopicFoundation,
  PRESENTER_FOUNDATION_LEVELS,
} from "../src/data/presenterTopicFoundations.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";


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

test("C1 foundations use the same canonical learner topic and thinking profile for all 28 days", () => {
  const slides = getSlidesByCourse("C1");
  assert.equal(slides.length, 28);
  assert.deepEqual(
    slides.map((slide) => String(slide.title).replace(/^C1 Day \d+ · /, "")),
    C1_CANONICAL_TITLES,
  );

  slides.forEach((slide) => {
    const canonical = getC1CanonicalLesson(slide.dayNumber);
    const foundation = getPresenterTopicFoundation(slide);

    assert.equal(foundation.title, canonical.title, slide.assignmentId + " topic drift");
    assert.equal(foundation.intro, canonical.foundation.intro, slide.assignmentId + " intro drift");
    assert.equal(foundation.example, canonical.foundation.example, slide.assignmentId + " example drift");
    assert.equal(foundation.tension, canonical.foundation.tension, slide.assignmentId + " tension drift");
    assert.equal(foundation.question, canonical.profile.question, slide.assignmentId + " core question drift");
  });

  const day1 = getPresenterTopicFoundation(slides[0]);
  const day2 = getPresenterTopicFoundation(slides[1]);
  assert.equal(day1.title, "Ziele und Lernweg");
  assert.match(day1.intro, /Lernziele|Lernplan|Etappen/i);
  assert.equal(day2.title, "Kultur und Identität");
  assert.match(day2.intro, /Identität|Sprache|Herkunft/i);
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
