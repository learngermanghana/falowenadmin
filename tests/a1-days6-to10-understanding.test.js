import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { buildA1SlideReviewChecks } from "../src/data/a1SlideReview.js";
import { A1_DAYS6_TO10_ASSIGNMENTS, getA1Days6To10UnderstandingChecks,
  getA1Days6To10QuickChecks, getA1Days6To10ApplicationChecks } from "../src/data/a1Days6To10Understanding.js";

const lower = (x) => String(x || "").trim().toLocaleLowerCase("de-DE");
const expected = {
  "A1-2.3": [6, "self-practice", "/campus/course/a1-day-6-family-and-hobbies-workbook"],
  "A1-3": [7, "tutor-marked", "/campus/course/a1-chapter-3-asking-about-prices-workbook"],
  "A1-4": [8, "tutor-marked", "/campus/course/a1-day-8-countries-and-languages-workbook"],
  "A1-5": [9, "tutor-marked", "/campus/course/a1-chapter-5-german-cases-workbook"],
  "A1-6": [10, "tutor-marked", "/campus/course/a1-day-10-objects-colors-possessive-articles-workbook"],
};

test("all five A1 Days 6–10 modules provide 75 independent, grounded question/answer/explanation trios", () => {
  const slides = getSlidesByCourse("A1");
  assert.deepEqual([...A1_DAYS6_TO10_ASSIGNMENTS].sort(), Object.keys(expected).sort());
  let total = 0;
  for (const [id, [day, kind, route]] of Object.entries(expected)) {
    const slide = slides.find((s) => lower(s.assignmentId) === lower(id));
    assert.ok(slide, id);
    assert.equal(slide.dayNumber, day, id);
    const path = getA1LearningPath(slide);
    assert.equal(path.kind, kind, id);
    assert.equal(path.activityUrl, route, id);
    const checks = getA1Days6To10UnderstandingChecks(id);
    assert.equal(checks.length, 11, id);
    assert.deepEqual(getA1PresenterUnderstandingChecks(id, getA1GrammarChecks(id, slide),
      { slide, support: buildTeacherSlideSupport(slide) }), checks, id);
    assert.match(checks[10].questionDe, /^Exit-Check:/);
    const quick = getA1Days6To10QuickChecks(id);
    const applied = getA1Days6To10ApplicationChecks(id);
    assert.equal(quick.length, 2, id);
    assert.equal(applied.length, 2, id);
    const all = [...checks, ...quick, ...applied];
    assert.equal(new Set(all.map((c) => lower(c.questionDe))).size, all.length, id);
    assert.ok(all.every((c) => c.questionDe && c.answerDe && c.noteEn?.length >= 24), id);
    assert.equal(buildA1SlideReviewChecks(checks.slice(0, 10), 2).length, 2, id);
    total += all.length;
  }
  assert.equal(total, 75);
});

test("Day 6 remains family/hobby self-practice without graded dialogue", () => {
  const s = JSON.stringify(getA1Days6To10UnderstandingChecks("A1-2.3"));
  for (const term of ["meine Mutter", "ein bisschen Deutsch", "Sprichst du Deutsch", "gern"]) {
    assert.ok(s.includes(term), term);
  }
  assert.doesNotMatch(s, /role.play|Mache einen Dialog|tutor-marked submission/i);
});

test("Day 7 stays on kostet/kosten, er/sie/es, mögen, gern, lieber", () => {
  const s = JSON.stringify(getA1Days6To10UnderstandingChecks("A1-3"));
  for (const term of ["kostet", "kosten", "er", "sie", "es", "mag", "gern", "lieber"]) {
    assert.ok(s.includes(term), term);
  }
});

test("Day 8 preserves the exact key grammar examples used by lesson regression", () => {
  const rows = getA1Days6To10UnderstandingChecks("A1-4");
  assert.ok(rows.some((r) => r.questionDe === "Complete the sentence: ‘Ich fahre ___ Schweiz.’"));
  assert.ok(rows.some((r) => r.questionDe === "Correct the sentence: ‘Er sprechen Deutsch.’"));
  assert.ok(rows.some((r) => r.answerDe === "Sie spricht Französisch."));
  assert.ok(rows.some((r) => /origin from destination/i.test(r.noteEn)));
  assert.match(JSON.stringify(rows), /in die Schweiz|nach Deutschland|aus Ghana/);
});

test("Days 9 and 10 keep workbook case grammar and home comprehension separate", () => {
  const caseWork = JSON.stringify(getA1Days6To10UnderstandingChecks("A1-5"));
  assert.match(caseWork, /Nominativ/);
  assert.match(caseWork, /Akkusativ/);
  assert.match(caseWork, /den Hund/);
  assert.doesNotMatch(caseWork, /Hören/);
  const home = JSON.stringify(getA1Days6To10UnderstandingChecks("A1-6"));
  for (const phrase of ["mein Tisch", "meine Lampe", "meinen Tisch", "Wohnzimmer", "Küche", "Balkon", "Ihr Tisch"]) {
    assert.ok(home.includes(phrase), phrase);
  }
});

test("Days 6–10 use the existing answer-reveal slide and no progress modifications", () => {
  const presenter = fs.readFileSync("src/components/A1GrammarPresenter.jsx", "utf8");
  const slides = fs.readFileSync("src/data/a1WorkbookAlignedSlidesDays6To10.js", "utf8");
  const resolver = fs.readFileSync("src/data/a1PresenterUnderstandingChecks.js", "utf8");
  assert.match(resolver, /getA1Days6To10UnderstandingChecks\(key\)/);
  assert.match(presenter, /getA1Days6To10QuickChecks\(slide\.assignmentId\)/);
  assert.match(presenter, /getA1Days6To10ApplicationChecks\(slide\.assignmentId\)/);
  assert.match(presenter, /reviewChecks: buildA1SlideReviewChecks\(mainChecks, 2\)/);
  assert.match(slides, /Self-practice bridge/);
  assert.match(slides, /Reading\/Hören workbook bridge/);
  assert.doesNotMatch(slides, /phase: "Language mini-interview"|phase: "Apartment speaking"|phase: "Hobby round"/);
  assert.doesNotMatch(presenter, /Student Learning Progress|Self-practice completion tracking/);
});
