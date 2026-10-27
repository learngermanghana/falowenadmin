import test from "node:test";
import assert from "node:assert/strict";

import {
  C1_CANONICAL_TITLES,
  C1_CANONICAL_GRAMMAR_TITLES,
  getC1CanonicalLesson,
} from "../src/data/c1CanonicalCurriculum.js";
import { courseDictionary } from "../src/data/courseDictionary.js";
import { c1PresenterSlides } from "../src/data/c1PresenterSlides.js";
import { getPresenterTopicFoundation } from "../src/data/presenterTopicFoundations.js";
import {
  STRICT_PARITY_LEVELS,
  KNOWN_PARITY_EXCEPTION_LEVELS,
  getCurriculumParityReference,
} from "../src/data/studentCurriculumParity.js";

test("C1 learner, dictionary and Presenter share one 28-day curriculum identity", () => {
  assert.equal(C1_CANONICAL_TITLES.length, 28);
  assert.equal(C1_CANONICAL_GRAMMAR_TITLES.length, 28);
  assert.equal(c1PresenterSlides.length, 28);
  assert.equal(Object.keys(courseDictionary.C1 || {}).length, 28);

  for (let day = 1; day <= 28; day += 1) {
    const canonical = getC1CanonicalLesson(day);
    const slide = c1PresenterSlides[day - 1];
    const dictionary = courseDictionary.C1[`C1 ${day}`];
    const foundation = getPresenterTopicFoundation(slide);
    const parity = getCurriculumParityReference(slide);

    assert.ok(canonical, `C1 Day ${day} missing canonical learner lesson`);
    assert.equal(slide.dayNumber, day);
    assert.equal(slide.assignmentId, `C1 ${day}`);
    assert.equal(slide.canonicalLearnerLesson.title, canonical.title);
    assert.equal(slide.canonicalLearnerLesson.grammarTitle, canonical.grammarTitle);
    assert.ok(slide.title.includes(canonical.title), `C1 Day ${day} title drift`);

    assert.equal(dictionary.de, canonical.title);
    assert.equal(dictionary.en, canonical.title);
    assert.equal(dictionary.chapter, String(day));

    assert.equal(foundation.title, canonical.title);
    assert.equal(foundation.intro, canonical.foundation.intro);
    assert.equal(foundation.example, canonical.foundation.example);
    assert.equal(foundation.tension, canonical.foundation.tension);
    assert.equal(foundation.question, canonical.profile.question);

    assert.equal(slide.studentQuestionsDe.length, 5);
    assert.deepEqual(slide.studentQuestionsDe.slice(0, 4), canonical.profile.points.slice(0, 4));
    assert.equal(slide.studentQuestionsDe[4], canonical.profile.question);
    assert.ok(slide.teacherSupport.grammarFocusEn.some((item) => item.includes(canonical.grammarTitle)));

    assert.equal(parity.status, "aligned");
    assert.equal(parity.title, canonical.title);
    assert.equal(parity.canonicalId, `C1-DAY-${String(day).padStart(2, "0")}`);
  }
});

test("C1 no longer uses a curriculum exception", () => {
  assert.ok(STRICT_PARITY_LEVELS.includes("C1"));
  assert.deepEqual(KNOWN_PARITY_EXCEPTION_LEVELS, []);
});

test("C1 canonical endpoints match the learner sequence", () => {
  assert.equal(getC1CanonicalLesson(1).title, "Ziele und Lernweg");
  assert.equal(getC1CanonicalLesson(1).grammarTitle, "Relativsätze mit Präpositionen");
  assert.equal(getC1CanonicalLesson(28).title, "Demografischer Wandel");
  assert.equal(getC1CanonicalLesson(28).grammarTitle, "Ursache, Folge und Abwägung beim demografischen Wandel");
});
