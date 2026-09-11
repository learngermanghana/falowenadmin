import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { teachingSlides } from "../src/data/teachingSlides.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";

const GENERIC_PHRASES = [
  "Ich denke, dass ...",
  "Ich kann sagen: „Ich ...“",
  "Für mich ist ... wichtig.",
  "Ich brauche ein Beispiel.",
  "Model one full exchange before pair speaking.",
  "Use short correction slots after each speaking phase.",
  "Students can communicate about",
];

const TOPIC_SIGNALS = {
  "A1-0.1": ["guten morgen", "ihnen", "tschüss"],
  "A1-0.2": ["buchstab", "eszett", "umlaut"],
  "A1-1.1": ["heiße", "wohn", "komm"],
  "A1-1.1-PRACTICE": ["w-frag", "wer", "woher"],
  "A1-1.2": ["verb", "-st", "-t"],
  "A1-2": ["telefon", "adresse", "nummer"],
  "A1-1.3": ["artikel", "ein", "eine"],
  "A1-2.3": ["famil", "gern", "sprache"],
  "A1-3": ["kostet", "kosten", "euro"],
  "A1-4": ["land", "sprache", "aus"],
  "A1-5": ["nominativ", "akkusativ", "den"],
  "A1-6": ["possess", "mein", "farbe"],
  "A1-7": ["halb", "vor", "nach"],
  "A1-8": ["uhr", "datum", "am"],
  "A1-3.5": ["zahl", "uhr", "euro"],
  "A1-3.6": ["können", "müssen", "möchten"],
  "A1-4.7": ["goethe", "sprechen", "teil"],
  "A1-9": ["kein", "nicht", "essen"],
  "A1-10": ["alltag", "frühstück", "gern"],
  "A1-11": ["imperativ", "bitte", "sie"],
  "A1-12.1": ["wohin", "dativ", "akkusativ"],
  "A1-12.2": ["beruf", "als", "bei"],
  "A1-5.9": ["sprechen", "frage", "bitte"],
  "A1-12.3": ["sehr geehrte", "liebe", "gruß"],
  "A1-13": ["wetter", "regnet", "grad"],
  "A1-14.1": ["kopfschmerz", "weh", "körper"],
  "A1-14.2": ["dativ", "akkusativ", "helfen"],
  "A1-5.10": ["aber", "oder", "denn"],
};

function text(value) {
  return String(value || "").trim();
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function normalized(value) {
  return text(value).toLocaleLowerCase("de-DE");
}

function signature(values) {
  return list(values).map(normalized).join(" || ");
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
    const presenterChecks = getA1PresenterUnderstandingChecks(id, checks, { slide, support });

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
      [list(checks).length >= 4, "needs at least 4 core understanding checks"],
      [list(presenterChecks).length >= 11, "needs 10 class understanding questions plus a separate exit check"],
    ];

    for (const [ok, reason] of requirements) {
      if (!ok) problems.push(`${id}: ${reason}`);
    }

    const searchable = [
      slide.title,
      slide.topic,
      slide.objective,
      ...list(slide.warmupQuestionsDe),
      ...list(slide.keyPhrasesDe),
      ...list(slide.studentQuestionsDe),
      ...list(slide.teacherNotesEn),
      ...list(support.grammarFocusEn),
      ...list(support.modelExamplesDe),
      ...list(support.commonMistakesEn),
      ...list(checks).flatMap((item) => [item?.questionDe, item?.answerDe]),
      ...list(presenterChecks).flatMap((item) => [item?.questionDe, item?.answerDe]),
    ].map(normalized).join("\n");

    for (const phrase of GENERIC_PHRASES) {
      if (searchable.includes(normalized(phrase))) problems.push(`${id}: still contains generic template phrase: ${phrase}`);
    }

    const signals = TOPIC_SIGNALS[id.toUpperCase()] || [];
    if (!signals.length) {
      problems.push(`${id}: no semantic audit signals registered`);
    } else if (!signals.some((signal) => searchable.includes(normalized(signal)))) {
      problems.push(`${id}: content does not show a clear signal for its assigned topic (${signals.join(", ")})`);
    }

    const coreQuestionTexts = list(checks).map((item) => text(item?.questionDe)).filter(Boolean);
    if (new Set(coreQuestionTexts).size !== coreQuestionTexts.length) {
      problems.push(`${id}: core understanding checks contain duplicate questions`);
    }

    const classQuestionTexts = list(presenterChecks).slice(0, 10).map((item) => text(item?.questionDe)).filter(Boolean);
    if (classQuestionTexts.length !== 10 || new Set(classQuestionTexts).size !== 10) {
      problems.push(`${id}: the first 10 presenter questions must be ten distinct class checks`);
    }

    const exitQuestion = text(list(presenterChecks).at(-1)?.questionDe);
    if (!exitQuestion || classQuestionTexts.includes(exitQuestion)) {
      problems.push(`${id}: exit check must be separate from the ten class questions`);
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

test("different A1 lessons do not reuse the same examples, mistakes, or core understanding checks", () => {
  const seen = {
    examples: new Map(),
    mistakes: new Map(),
    checks: new Map(),
  };
  const duplicates = [];

  for (const slide of a1Slides) {
    const id = text(slide.assignmentId);
    const support = buildTeacherSlideSupport(slide);
    const checks = getA1GrammarChecks(id, slide);
    const values = {
      examples: signature(support.modelExamplesDe),
      mistakes: signature(support.commonMistakesEn),
      checks: signature(checks.map((item) => item?.questionDe)),
    };

    for (const [kind, value] of Object.entries(values)) {
      if (!value) continue;
      const previous = seen[kind].get(value);
      if (previous) duplicates.push(`${id} and ${previous} share identical ${kind}`);
      else seen[kind].set(value, id);
    }
  }

  assert.deepEqual(duplicates, [], duplicates.join("\n"));
});

test("A1 presenter uses inclusive language-focus labels and always provides a transfer stage", () => {
  const presenter = fs.readFileSync(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "utf8");
  assert.match(presenter, /Sprachfokus/);
  assert.match(presenter, /Verständnis-Check/);
  assert.match(presenter, /A1 · Language-first/);
  assert.match(presenter, /practicePrompts\.slice\(0, 4\)/);
  assert.match(presenter, /hasWorkbookPlan \? "Jetzt ins Workbook übertragen" : "Jetzt anwenden"/);
  assert.doesNotMatch(presenter, /A1 · Grammar-first/);
  assert.doesNotMatch(presenter, /kicker: "Grammatik"/);
});