import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";
import { buildA1SlideReviewChecks } from "../src/data/a1SlideReview.js";
import {
  A1_DAYS1_TO5_ASSIGNMENTS,
  getA1Days1To5UnderstandingChecks,
  getA1Days1To5QuickChecks,
  getA1Days1To5ApplicationChecks,
} from "../src/data/a1Days1To5Understanding.js";

const normalized = (value) => String(value || "").trim().toLowerCase();

test("Days 1–5 contain exactly seven published blocks with complete lesson-authored feedback", () => {
  const slides = getSlidesByCourse("A1");
  assert.equal(A1_DAYS1_TO5_ASSIGNMENTS.length, 7);
  const expectedDays = {
    "A1-0.1": 1,
    "A1-0.2": 2,
    "A1-1.1": 2,
    "A1-1.1-PRACTICE": 3,
    "A1-1.2": 3,
    "A1-2": 4,
    "A1-1.3": 5,
  };
  for (const id of A1_DAYS1_TO5_ASSIGNMENTS) {
    const slide = slides.find((item) => normalized(item.assignmentId) === normalized(id));
    assert.ok(slide, id + ": missing workbook-aligned source");
    assert.equal(slide.dayNumber, expectedDays[id], id + ": wrong class day");
    const exact = getA1Days1To5UnderstandingChecks(id);
    const resolved = getA1PresenterUnderstandingChecks(
      id, getA1GrammarChecks(id, slide),
      { slide, support: buildTeacherSlideSupport(slide) },
    );
    assert.equal(exact.length, 11, id + ": need 10 checks + one exit");
    assert.deepEqual(resolved, exact, id + ": actual presenter must use the verified bank");
    assert.equal(new Set(exact.map((item) => normalized(item.questionDe))).size, 11,
      id + ": repeat questions in a class or exit check");
    assert.ok(exact.every((item) => item.questionDe && item.answerDe && item.noteEn?.length >= 25),
      id + ": each check needs a concrete answer and teacher explanation");
    assert.match(exact[10].questionDe, /^Exit-Check:/, id + ": fresh final check missing");
    assert.equal(getA1Days1To5QuickChecks(id).length, 2);
    assert.equal(getA1Days1To5ApplicationChecks(id).length, 2);
    const classQuestions = new Set(exact.map((item) => normalized(item.questionDe)));
    for (const early of getA1Days1To5QuickChecks(id)) {
      assert.ok(!classQuestions.has(normalized(early.questionDe)), id + ": quick check leaks graded class question");
      assert.ok(early.answerDe && early.noteEn, id + ": quick check needs a real answer");
    }
    for (const applied of getA1Days1To5ApplicationChecks(id)) {
      assert.ok(!classQuestions.has(normalized(applied.questionDe)), id + ": repeat of class check");
      assert.ok(applied.answerDe && applied.noteEn, id + ": application needs a real answer");
    }
    assert.ok(buildA1SlideReviewChecks(exact, 2).length === 2, id + ": two factual review answers unavailable");
    assert.ok(slide.workbookConnection?.workbookUrl, id + ": published learner route missing");
  }
});

test("Days 1–5 checks preserve the workbook scope and the tutor/self-practice distinction", () => {
  const slides = getSlidesByCourse("A1");
  const byId = (id) => slides.find((s) => normalized(s.assignmentId) === normalized(id));
  assert.equal(getA1LearningPath(byId("A1-0.1")).kind, "tutor-marked");
  assert.equal(getA1LearningPath(byId("A1-1.1-PRACTICE")).kind, "self-practice");
  assert.equal(getA1LearningPath(byId("A1-1.3")).kind, "self-practice");
  assert.equal(getA1LearningPath(byId("A1-2")).kind, "tutor-marked");

  const day1 = JSON.stringify(getA1Days1To5UnderstandingChecks("A1-0.1"));
  assert.match(day1, /Guten Morgen/);
  assert.match(day1, /Guten Abend/);
  assert.match(day1, /Ihnen/);
  assert.match(day1, /Tschüss/);
  const alphabet = JSON.stringify(getA1Days1To5UnderstandingChecks("A1-0.2"));
  assert.match(alphabet, /Eszett/);
  assert.match(alphabet, /W-A-S-S-E-R/);
  assert.doesNotMatch(alphabet, /Teil 2 ·/);
  const conjugation = JSON.stringify(getA1Days1To5UnderstandingChecks("A1-1.1"));
  assert.match(conjugation, /wir lernen/i);
  assert.match(conjugation, /ihr lernt/i);
  const articles = JSON.stringify(getA1Days1To5UnderstandingChecks("A1-1.1-PRACTICE"));
  assert.match(articles, /Woher kommst du/);
  assert.match(articles, /das Buch/);
  assert.doesNotMatch(articles, /ein\/eine|indefinite article/i);
  const day3 = JSON.stringify(getA1Days1To5UnderstandingChecks("A1-1.2"));
  assert.match(day3, /du arbeitest/);
  assert.match(day3, /du heißt/);
  const numbers = JSON.stringify(getA1Days1To5UnderstandingChecks("A1-2"));
  assert.match(numbers, /sechzehn/);
  assert.match(numbers, /zweihundertzweiundzwanzig/);
  assert.match(numbers, /zweitausendvierzig/);
  assert.doesNotMatch(numbers, /Telefonnummer|Adresse|Mache einen kurzen Dialog/i);
  const day5 = JSON.stringify(getA1Days1To5UnderstandingChecks("A1-1.3"));
  assert.match(day5, /die Lampe/);
  assert.match(day5, /Woher/);
  assert.doesNotMatch(day5, /indefinite article|ein\/eine|ein or eine|einen|einem/i);
});

test("A1 Presenter uses separate unscored recall and short application checks", () => {
  const source = fs.readFileSync("src/components/A1GrammarPresenter.jsx", "utf8");
  assert.match(source, /getA1Days1To5QuickChecks\(slide\.assignmentId\)/);
  assert.match(source, /getA1Days1To5ApplicationChecks\(slide\.assignmentId\)/);
  assert.match(source, /title: curatedApplicationChecks \? "Two short lesson applications"/);
  assert.match(source, /items: mainChecks/);
  assert.match(source, /exitCheck: true/);
  assert.match(source, /data-a1-learning-mode=\{stage.activityKind\}/);
  assert.doesNotMatch(source, /id: "mini-dialogue"|id: "speak-first"/);
});
