import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { teachingSlides } from "../src/data/teachingSlides.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { buildA1PresenterQuestionPool } from "../src/utils/a1PresenterQuestionPool.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function slideFor(assignmentId) {
  return teachingSlides.find((slide) => String(slide.assignmentId || "").toUpperCase() === assignmentId.toUpperCase());
}

test("A1-13 weather gives ten genuinely different class questions plus an exit check", () => {
  const checks = getA1PresenterUnderstandingChecks("A1-13", getA1GrammarChecks("A1-13"));
  const classChecks = checks.slice(0, -1);
  const exitChecks = checks.slice(-1);

  assert.equal(classChecks.length, 10);
  assert.equal(exitChecks.length, 1);
  assert.equal(new Set(classChecks.map((item) => item.questionDe)).size, 10);
  assert.ok(classChecks.every((item) => String(item.answerDe || "").trim()));

  const pool = buildA1PresenterQuestionPool(classChecks, 10, "A1-13-grammar-check");
  assert.equal(pool.length, 10);
  assert.equal(new Set(pool.map((item) => item.sourceQuestion)).size, 10);
});

test("other A1 lessons also build ten distinct class questions from their own lesson material", () => {
  const slide = slideFor("A1-12.3");
  assert.ok(slide, "A1-12.3 slide missing");
  const support = buildTeacherSlideSupport(slide);
  const resolved = getA1PresenterUnderstandingChecks(
    "A1-12.3",
    getA1GrammarChecks("A1-12.3", slide),
    { slide, support },
  );
  const classChecks = resolved.slice(0, -1);

  assert.equal(classChecks.length, 10);
  assert.equal(resolved.length, 11);
  assert.equal(new Set(classChecks.map((item) => item.questionDe)).size, 10);
  assert.ok(classChecks.some((item) => /Sehr geehrte|formal|message|letter|Schreiben/i.test(`${item.questionDe} ${item.answerDe}`)));
});

test("A1 presenter makes the full-class question flow explicit", () => {
  const presenter = read("src/components/A1GrammarPresenter.jsx");

  assert.match(presenter, /getA1PresenterUnderstandingChecks/);
  assert.match(presenter, /one question per student/);
  assert.match(presenter, /10 distinct lesson questions/);
  assert.match(presenter, /Next student →/);
  assert.match(presenter, /Continue lesson →/);
  assert.match(presenter, /if \(participationCheckMode\) return;/);
});
