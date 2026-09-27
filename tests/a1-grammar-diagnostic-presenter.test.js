import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";

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
});

test("A1 class-check pools stay grammar-focused and large enough for a class", () => {
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

    const prompts = checks.map((item) => String(item.questionDe || "").trim());
    for (const warmup of slide.warmupQuestionsDe || []) {
      assert.ok(!prompts.includes(String(warmup || "").trim()), `${slide.assignmentId} should not reuse warm-up speaking questions`);
    }
    for (const speaking of slide.studentQuestionsDe || []) {
      assert.ok(!prompts.includes(String(speaking || "").trim()), `${slide.assignmentId} should not reuse speaking prompts as grammar checks`);
    }
  }
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
