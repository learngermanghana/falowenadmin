import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { buildA1PresenterQuestionPool } from "../src/utils/a1PresenterQuestionPool.js";

test("normal A1 Presenter is a grammar diagnostic, while A1-5.9 keeps exam readiness", () => {
  const source = fs.readFileSync("src/components/A1GrammarPresenter.jsx", "utf8");

  assert.match(source, /A1_GRAMMAR_CHECK_FLOW_VERSION = 3/);
  assert.match(source, /A1 · Grammar check/);
  assert.match(source, /id: "quick-check"/);
  assert.match(source, /id: "grammar-check"/);
  assert.match(source, /id: "mistake-fix"/);
  assert.match(source, /id: "sentence-build"/);
  assert.match(source, /id: "exit-check"/);
  assert.doesNotMatch(source, /id: "speak-first"/);
  assert.doesNotMatch(source, /id: "mini-dialogue"/);
  assert.doesNotMatch(source, /id: "one-minute-knowledge"/);

  assert.match(source, /A1-5\.9/);
  assert.match(source, /A1 speaking readiness method/);
  assert.match(source, /Die drei Teile der A1-Sprechprüfung/);
  assert.match(source, /Is the student ready for the exam\?/);
  assert.match(source, /Task completion: answers or forms exactly what the task asks for/);
  assert.match(source, /Question formation: forms a clear W-question or yes\/no question/);
  assert.match(source, /Answer relevance: answers the actual question/);
  assert.match(source, /Fluency: responds without a long pause/);
  assert.match(source, /Clarity: pronunciation and sentence structure are clear enough for A1/);
  assert.match(source, /Interaction: listens, makes polite requests, and responds appropriately/);
  assert.doesNotMatch(source, /Ist der Student prüfungsbereit\?/);
});

test("A1 class-check pools use clear learner-understanding questions and stay large enough for a class", () => {
  const slides = getSlidesByCourse("A1");
  assert.ok(slides.length > 0, "A1 slides missing");

  for (const slide of slides) {
    if (String(slide.assignmentId || "").toUpperCase() === "A1-5.9") continue;

    const support = buildTeacherSlideSupport(slide);
    const checks = getA1PresenterUnderstandingChecks(
      slide.assignmentId,
      getA1GrammarChecks(slide.assignmentId, slide),
      { slide, support },
    );

    assert.ok(checks.length >= 11, `${slide.assignmentId} needs 10 class checks plus one exit check`);
    assert.ok(
      checks.every((item) => !/Give one correct German example that avoids this mistake/i.test(item.questionDe)),
      `${slide.assignmentId} must not expose teacher mistake notes as learner questions`,
    );
    assert.ok(
      checks.every((item) => !/Show this lesson point with one short German example/i.test(item.questionDe)),
      `${slide.assignmentId} must use direct learner questions instead of abstract lesson-point reflections`,
    );
  }
});

test("all A1 class questions avoid generic meta-prompts", () => {
  const forbidden = /Give one correct German example that avoids this mistake|Show this lesson point with one short German example|Explain this in your own words|Teach this rule to a classmate|Give the rule first|How would you explain this idea to a beginner|What is the main grammar or language concept|What is one important rule or common mistake|Can you give one simple example that shows you understand the rule|Change one clear detail in this model/i;

  for (const slide of getSlidesByCourse("A1")) {
    if (String(slide.assignmentId || "").toUpperCase() === "A1-5.9") continue;
    const support = buildTeacherSlideSupport(slide);
    const checks = getA1PresenterUnderstandingChecks(
      slide.assignmentId,
      getA1GrammarChecks(slide.assignmentId, slide),
      { slide, support },
    );
    assert.ok(
      checks.every((item) => !forbidden.test(String(item.questionDe || ""))),
      `${slide.assignmentId} contains a generic learner prompt`,
    );
  }
});

test("A1 Day 8 uses direct knowledge checks instead of abstract mistake-reflection prompts", () => {
  const slide = getSlidesByCourse("A1").find((item) => item.assignmentId === "A1-4");
  const support = buildTeacherSlideSupport(slide);
  const checks = getA1PresenterUnderstandingChecks(
    "A1-4",
    getA1GrammarChecks("A1-4", slide),
    { slide, support },
  );

  assert.equal(checks.length, 11);
  assert.ok(checks.some((item) => item.questionDe === "Complete the sentence: ‘Ich fahre ___ Schweiz.’"));
  assert.ok(checks.some((item) => item.questionDe === "Correct the sentence: ‘Er sprechen Deutsch.’"));
  assert.ok(checks.some((item) => item.answerDe === "Sie spricht Französisch."));
  assert.ok(checks.some((item) => /origin from destination/i.test(item.noteEn || "")));
  assert.ok(checks.every((item) => !/Give one correct German example that avoids this mistake/i.test(item.questionDe)));
});

test("A1 prebuild guards cannot regenerate the retired language-first flow", () => {
  const languagePatch = fs.readFileSync("scripts/patchA1LanguageFirstFlow.mjs", "utf8");
  const day5Patch = fs.readFileSync("scripts/patchA1Day5ScopeAndFlow.mjs", "utf8");
  const lesson9Patch = fs.readFileSync("scripts/patchA1Lesson9Clarity.mjs", "utf8");

  assert.match(languagePatch, /A1_GRAMMAR_CHECK_FLOW_VERSION = 3/);
  assert.doesNotMatch(languagePatch, /A1_LANGUAGE_FIRST_FLOW_VERSION/);
  assert.match(languagePatch, /source\.includes\('id: "speak-first"'\)/);
  assert.doesNotMatch(languagePatch, /\{\s*id: "speak-first",\s*type:/);
  assert.match(day5Patch, /A1_GRAMMAR_CHECK_FLOW_VERSION = 3/);
  assert.doesNotMatch(day5Patch, /A1_COMPACT_DEDUPED_PRESENTER/);
  assert.doesNotMatch(lesson9Patch, /function buildRetrievalChecks\(slide = \{\}\)/);
  assert.match(lesson9Patch, /A1_GRAMMAR_CHECK_FLOW_VERSION = 3/);
});


test("A1 Presenter exposes teacher-purpose guidance and a full-canvas presentation view", () => {
  const source = fs.readFileSync("src/components/A1GrammarPresenter.jsx", "utf8");
  const css = fs.readFileSync("src/components/TeachingSlidePresenter.css", "utf8");

  assert.match(source, /function a1TeacherPurpose/);
  assert.match(source, /aria-label="Teacher purpose"/);
  assert.match(source, /!focusMode && teacherPurpose/);
  assert.match(source, />Present full screen</);
  assert.match(source, /presenter-focus-dock/);
  assert.match(source, /aria-label="Restore presenter controls"/);
  assert.match(source, /presenter-stage \$\{focusMode \? "is-focus-mode" : ""\}/);
  assert.match(css, /\.presenter-stage\.is-focus-mode > \.presenter-participation-dock/);
});


test("A1-5.9 propagates exam-readiness context and distinguishes performance from knowledge checks", () => {
  const source = fs.readFileSync("src/components/A1GrammarPresenter.jsx", "utf8");
  const slide = getSlidesByCourse("A1").find((item) => item.assignmentId === "A1-5.9");
  const checks = getA1GrammarChecks("A1-5.9", slide);
  const modes = new Set(checks.map((item) => item.responseMode));
  const pool = buildA1PresenterQuestionPool(checks.slice(0, -1), 15, "a1-5.9-test");

  assert.equal(slide.estimatedDuration, "60 minutes");
  const phaseMinutes = slide.interactionFlow.map((item) => Number(String(item.detailEn).match(/(\d+)\s*min/i)?.[1] || 0));
  assert.deepEqual(phaseMinutes, [5, 5, 10, 10, 10, 15, 5]);
  assert.equal(phaseMinutes.reduce((sum, value) => sum + value, 0), 60, "A1-5.9 phase plan must fit the 60-minute class");
  assert.deepEqual([...modes].sort(), ["knowledge", "performance"]);
  assert.ok(pool.some((item) => item.responseMode === "knowledge"));
  assert.ok(pool.some((item) => item.responseMode === "performance"));
  assert.ok(
    pool.filter((item) => item.responseMode === "performance").every((item) => !/Teach this rule|give one simple German example/i.test(item.questionDe)),
    "generated performance prompts must remain speaking tasks",
  );

  const largePool = buildA1PresenterQuestionPool(checks.slice(0, -1), 22, "a1-5.9-large-class");
  const knowledgeItems = largePool.filter((item) => item.responseMode === "knowledge");
  assert.ok(knowledgeItems.length >= 3, "large classes should include generated knowledge checks");
  assert.ok(
    knowledgeItems.every((item) => !/give one simple German example|teach this rule|explain why/i.test(item.questionDe)),
    "knowledge variants must not request content that the factual Teacher Guide does not validate",
  );
  assert.ok(
    knowledgeItems.every((item) => checks.some((check) => check.questionDe === item.sourceQuestion && check.answerDe === item.answerDe)),
    "generated knowledge checks must retain the original factual guide",
  );
  assert.match(source, /\.map\(\(stage\) => \(\{ \.\.\.stage, examReadiness: true \}\)\)/);
  assert.match(source, /Readiness-Check selbstständig bearbeiten/);
  assert.match(source, /Performance-Prompts/);
  assert.match(source, /Wissensfragen/);
  assert.match(source, /Exam-readiness live check · one mixed check per student/);
  assert.match(source, /Performance check/);
  assert.match(source, /Knowledge check/);
  assert.match(source, /Do not mark an unrelated answer Correct/);
  assert.match(source, /This leaves the exam-readiness live check/);
  assert.match(source, /stage\.examReadiness \? "A1 · Exam-readiness" : "A1 · Grammar check"/);
});


test("A1 alphabet presenter asks concrete understanding questions", () => {
  const slide = getSlidesByCourse("A1").find((item) => item.assignmentId === "A1-0.2");
  const support = buildTeacherSlideSupport(slide);
  const checks = getA1PresenterUnderstandingChecks(
    "A1-0.2",
    getA1GrammarChecks("A1-0.2", slide),
    { slide, support },
  );

  assert.equal(checks.length, 11);
  assert.ok(checks.some((item) => item.questionDe === "Wie viele Buchstaben hat das deutsche Standardalphabet?"));
  assert.ok(checks.some((item) => item.questionDe === "Welche vier zusätzlichen Zeichen benutzt man im Deutschen?"));
  assert.ok(checks.some((item) => item.questionDe === "Wie buchstabierst du deinen Nachnamen?"));
  assert.ok(checks.some((item) => item.questionDe === "Buchstabiere „Wasser“."));
  assert.ok(checks.every((item) => !/30 standard alphabet letters/i.test(item.questionDe)));
});
