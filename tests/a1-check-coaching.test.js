import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { buildA1CheckCoaching } from "../src/data/a1CheckCoaching.js";

test("A1 check guidance covers every existing class and exit prompt without inventing answers", () => {
  const slides = getSlidesByCourse("A1").filter((slide) =>
    !["A1-TUTORIAL", "A1-5.9"].includes(String(slide.assignmentId || "").toUpperCase()));
  assert.ok(slides.length >= 20, "A1 teaching lessons should remain available");
  let covered = 0;
  for (const slide of slides) {
    const support = buildTeacherSlideSupport(slide);
    const checks = getA1PresenterUnderstandingChecks(
      slide.assignmentId,
      getA1GrammarChecks(slide.assignmentId, slide),
      { slide, support },
    );
    assert.ok(checks.length >= 11, slide.assignmentId + ": required class checks and exit missing");
    for (const check of checks) {
      const coaching = buildA1CheckCoaching(check, slide);
      assert.ok(coaching, slide.assignmentId + ": missing check coaching");
      assert.equal(coaching.questionDe, check.questionDe, slide.assignmentId + ": wrong question attached");
      assert.ok(coaching.hintDe.length > 20, slide.assignmentId + ": no usable learner scaffold");
      assert.ok(coaching.checkDe.length > 20, slide.assignmentId + ": no teacher evaluation criterion");
      assert.ok(coaching.retryDe.length > 20, slide.assignmentId + ": no targeted second attempt");
      assert.ok(coaching.feedbackQuestionDe.includes(check.questionDe),
        slide.assignmentId + ": feedback not tied to exact question");
      if (coaching.lessonGrammarEn) {
        assert.ok(slide.teacherSupport?.grammarFocusEn?.includes(coaching.lessonGrammarEn),
          slide.assignmentId + ": grammar must be authored in this lesson");
      }
      if (coaching.lessonPitfallEn) {
        assert.ok(slide.teacherSupport?.commonMistakesEn?.includes(coaching.lessonPitfallEn),
          slide.assignmentId + ": feedback must not import another lesson's errors");
      }
      assert.equal(coaching.sourceNoteEn, String(check.noteEn || "").trim());
      covered++;
    }
  }
  assert.ok(covered >= slides.length * 11, "not all classroom question slots were coached");
});

test("A1 teaching scaffolds distinguish spelling, correction, register and factual answers", () => {
  const slide = { course: "A1", assignmentId: "A1-0.2" };
  assert.match(buildA1CheckCoaching({ questionDe: "Buchstabiere Wasser.", answerDe: "W-A-S-S-E-R." }, slide).hintDe, /Buchstaben/);
  assert.match(buildA1CheckCoaching({ questionDe: "Korrigiere: Wir lernt Deutsch.", answerDe: "Wir lernen Deutsch." }, slide).checkDe, /korrigiert/);
  assert.match(buildA1CheckCoaching({ questionDe: "Wie viele Buchstaben?", answerDe: "26." }, slide).hintDe, /Zahl/);
  assert.match(buildA1CheckCoaching({ questionDe: "Woher kommst du?", answerDe: "Ich komme aus Ghana." }, slide).hintDe, /Ich komme aus/);
  assert.equal(buildA1CheckCoaching({ questionDe: "Was sagst du?", answerDe: "Accept a short correct A1 response." }, slide).flexibleAnswer, true);
  assert.equal(buildA1CheckCoaching({ questionDe: "Wie heißt du?", answerDe: "Ich heiße Ana." }, slide).flexibleAnswer, false);
  assert.equal(buildA1CheckCoaching({ questionDe: "" }, slide), null);
  assert.equal(buildA1CheckCoaching(null, slide), null);
  assert.equal(buildA1CheckCoaching(undefined, slide), null);
  assert.equal(buildA1CheckCoaching(null, null), null);
  assert.equal(buildA1CheckCoaching({ questionDe: "Warum?" }, { course: "B1" }), null);
});

test("A1 exam-readiness and scored class checks stay independent from optional hints", () => {
  const presenter = fs.readFileSync("src/components/A1GrammarPresenter.jsx", "utf8");
  assert.match(presenter, /A1_GRAMMAR_CHECK_FLOW_VERSION = 3/);
  assert.match(presenter, /buildA1CheckCoaching\(activeCheck, slide\)/);
  assert.match(presenter, /stage\?\.examReadiness \? null/);
  assert.match(presenter, /!participationCheckMode && !stage\?\.exitCheck/);
  assert.match(presenter, /showHint && canShowHint && !showAnswer/);
  assert.match(presenter, /showAnswer \? \(/);
  assert.match(presenter, /Lehrerfeedback · nach der Antwort/);
  assert.match(presenter, /Keine automatische Bewertung/);
  assert.match(presenter, /onQuestionChange=\{\(question\) => \{/);
  assert.match(presenter, /setParticipationQuestion\(question\);\s*setShowAnswer\(false\);\s*setShowHint\(false\)/);
  assert.match(presenter, /<PresenterStudentPicker/);
  assert.match(presenter, /id: "grammar-check"/);
  assert.match(presenter, /id: "exit-check"/);
});

test("A1 check feedback does not cross topics when the selected student changes", () => {
  const greeting = { course: "A1", teacherSupport: {
    grammarFocusEn: ["Choose Guten Morgen by time of day."],
    commonMistakesEn: ["Gute Nacht is not an evening greeting."],
  } };
  const pronouns = { course: "A1", teacherSupport: {
    grammarFocusEn: ["Use -st with du."],
    commonMistakesEn: ["Wir lernt must be wir lernen."],
  } };
  const greetingGuide = buildA1CheckCoaching({ questionDe: "Was sagst du am Morgen?", answerDe: "Guten Morgen!" }, greeting);
  const pronounGuide = buildA1CheckCoaching({ questionDe: "Korrigiere: Wir lernt Deutsch.", answerDe: "Wir lernen Deutsch." }, pronouns);
  assert.match(greetingGuide.lessonGrammarEn, /Guten Morgen/);
  assert.doesNotMatch(greetingGuide.lessonGrammarEn + greetingGuide.lessonPitfallEn, /wir lernen|^-st/);
  assert.match(pronounGuide.lessonPitfallEn, /Wir lernt/);
  assert.doesNotMatch(pronounGuide.lessonGrammarEn + pronounGuide.lessonPitfallEn, /Guten Morgen/);
});
