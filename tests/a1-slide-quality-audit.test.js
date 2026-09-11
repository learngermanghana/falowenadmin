import test from "node:test";
import assert from "node:assert/strict";

import { teachingSlides } from "../src/data/teachingSlides.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";

const GENERIC_PHRASES = [
  "Ich denke, dass ...",
  "Ich kann sagen: „Ich ...“",
  "Für mich ist ... wichtig.",
  "Ich brauche ein Beispiel.",
  "Model one full exchange before pair speaking.",
  "Use short correction slots after each speaking phase.",
  "Students can communicate about",
];

function text(value) {
  return String(value || "").trim();
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

const a1Slides = teachingSlides.filter(
  (slide) => String(slide.course || "").toUpperCase() === "A1" && String(slide.assignmentId || "").toUpperCase() !== "A1-TUTORIAL",
);

test("A1 teaching catalog contains the complete 28-lesson curriculum exactly once", () => {
  assert.equal(a1Slides.length, 28, `expected 28 A1 lessons, found ${a1Slides.length}`);
  const ids = a1Slides.map((slide) => String(slide.assignmentId || "").toUpperCase());
  assert.equal(new Set(ids).size, 28, "A1 teaching slides contain duplicate assignment IDs");
});

test("every A1 slide meets the classroom-content standard", () => {
  const problems = [];

  for (const slide of a1Slides) {
    const id = text(slide.assignmentId) || text(slide.id) || "unknown";
    const support = buildTeacherSlideSupport(slide);
    const checks = getA1GrammarChecks(id, slide);

    const requirements = [
      [text(slide.title).length >= 8, "missing/weak title"],
      [text(slide.topic).length >= 3, "missing topic"],
      [text(slide.objective).length >= 40, "objective is too generic or too short"],
      [list(slide.warmupQuestionsDe).length >= 3, "needs at least 3 warm-up questions"],
      [list(slide.keyPhrasesDe).length >= 4, "needs at least 4 lesson-specific key phrases"],
      [list(slide.studentQuestionsDe).length >= 4, "needs at least 4 student practice questions"],
      [list(slide.teacherNotesEn).length >= 3, "needs at least 3 teacher notes"],
      [list(slide.interactionFlow).length >= 4, "needs at least 4 teaching/practice phases"],
      [text(slide.wrapUpTaskDe).length >= 25, "needs a concrete lesson-specific wrap-up"],
      [list(support.grammarFocusEn).length >= 2, "needs lesson-specific grammar/language focus"],
      [list(support.modelExamplesDe).length >= 3, "needs at least 3 model examples"],
      [list(support.commonMistakesEn).length >= 3, "needs at least 3 likely mistakes"],
      [list(checks).length >= 4, "needs at least 4 understanding checks"],
    ];

    for (const [ok, reason] of requirements) {
      if (!ok) problems.push(`${id}: ${reason}`);
    }

    const searchable = [
      slide.objective,
      ...list(slide.keyPhrasesDe),
      ...list(slide.teacherNotesEn),
      ...list(support.modelExamplesDe),
      ...list(support.commonMistakesEn),
    ].map(text).join("\n");

    for (const phrase of GENERIC_PHRASES) {
      if (searchable.includes(phrase)) problems.push(`${id}: still contains generic template phrase: ${phrase}`);
    }

    const questionTexts = list(checks).map((item) => text(item?.questionDe)).filter(Boolean);
    if (new Set(questionTexts).size !== questionTexts.length) {
      problems.push(`${id}: understanding checks contain duplicate questions`);
    }
  }

  assert.deepEqual(problems, [], `A1 slide quality problems:\n${problems.join("\n")}`);
});

test("A1 lesson support does not silently fall back to the generic A1 template", () => {
  const genericSupport = buildTeacherSlideSupport({ course: "A1", assignmentId: "UNKNOWN-A1", topic: "Fallback audit" });
  const fallbackExamples = new Set(genericSupport.modelExamplesDe || []);
  const fallbackMistakes = new Set(genericSupport.commonMistakesEn || []);
  const failures = [];

  for (const slide of a1Slides) {
    const support = buildTeacherSlideSupport(slide);
    const id = text(slide.assignmentId);
    const usesFallbackExamples = list(support.modelExamplesDe).some((entry) => fallbackExamples.has(entry));
    const usesFallbackMistakes = list(support.commonMistakesEn).some((entry) => fallbackMistakes.has(entry));
    if (usesFallbackExamples || usesFallbackMistakes) {
      failures.push(`${id}: generic teacher-support fallback detected`);
    }
  }

  assert.deepEqual(failures, [], failures.join("\n"));
});