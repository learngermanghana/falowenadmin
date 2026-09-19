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
  "Use the pattern in",
  "Use this language in a new sentence",
];

const TOPIC_SIGNALS = {
  "A1-0.1": ["guten morgen", "ihnen", "tschüss"],
  "A1-0.2": ["buchstab", "eszett", "umlaut"],
  "A1-1.1": ["heiße", "wohn", "komm"],
  "A1-1.1-PRACTICE": ["w-frag", "wer", "woher"],
  "A1-1.2": ["verb", "-st", "-t"],
  "A1-2": ["telefon", "adresse", "nummer"],
  "A1-1.3": ["artikel", "der", "die", "das"],
  "A1-2.3": ["famil", "gern", "hobby"],
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
  "A1-11": ["imperativ", "geradeaus", "abbiegen"],
  "A1-12.1": ["wohin", "dativ", "akkusativ"],
  "A1-12.2": ["beruf", "als", "bei"],
  "A1-5.9": ["sprechen", "frage", "bitte"],
  "A1-12.3": ["sehr geehrte", "liebe", "gruß"],
  "A1-13": ["wetter", "regnet", "grad"],
  "A1-14.1": ["kopfschmerz", "weh", "körper"],
  "A1-14.2": ["dativ", "akkusativ", "helfen"],
  "A1-5.10": ["aber", "oder", "denn"],
};

const text = (value) => String(value || "").replace(/\s+/g, " ").trim();
const lower = (value) => text(value).toLocaleLowerCase("de-DE");
const list = (value) => Array.isArray(value) ? value : [];

const a1Slides = teachingSlides.filter((slide) =>
  String(slide.course || "").toUpperCase() === "A1"
  && String(slide.assignmentId || "").toUpperCase() !== "A1-TUTORIAL"
);

test("all 28 A1 lessons are topic-specific and class challenges do not reuse recall", () => {
  const problems = [];
  assert.equal(a1Slides.length, 28, `expected 28 A1 lessons, found ${a1Slides.length}`);

  for (const slide of a1Slides) {
    const id = String(slide.assignmentId || "").toUpperCase();
    const support = buildTeacherSlideSupport(slide);
    const coreChecks = getA1GrammarChecks(id, slide);
    const presenterChecks = getA1PresenterUnderstandingChecks(id, coreChecks, { slide, support });
    const classChecks = presenterChecks.slice(0, 10);
    const exitCheck = presenterChecks.at(-1);

    if (classChecks.length !== 10) problems.push(`${id}: needs exactly 10 class-challenge questions before the exit check`);
    if (new Set(classChecks.map((item) => lower(item?.questionDe))).size !== classChecks.length) {
      problems.push(`${id}: class-challenge questions contain duplicates`);
    }
    if (!text(exitCheck?.questionDe) || classChecks.some((item) => lower(item?.questionDe) === lower(exitCheck?.questionDe))) {
      problems.push(`${id}: exit check is missing or duplicates a class-challenge question`);
    }

    const challengeText = classChecks
      .flatMap((item) => [item?.questionDe, item?.answerDe, item?.noteEn])
      .map(lower)
      .join("\n");
    if (/retrieval from an earlier|recall only|previous lesson/i.test(challengeText)) {
      problems.push(`${id}: previous-lesson recall leaked into the later class challenge`);
    }

    const searchable = [
      slide.title,
      slide.topic,
      slide.objective,
      ...list(slide.keyPhrasesDe),
      ...list(slide.teacherNotesEn),
      ...list(support.grammarFocusEn),
      ...list(support.modelExamplesDe),
      ...list(support.commonMistakesEn),
      ...classChecks.flatMap((item) => [item?.questionDe, item?.answerDe]),
    ].map(lower).join("\n");

    for (const phrase of GENERIC_PHRASES) {
      if (searchable.includes(lower(phrase))) problems.push(`${id}: generic/unclear presenter language remains: ${phrase}`);
    }

    const signals = TOPIC_SIGNALS[id] || [];
    if (!signals.length) {
      problems.push(`${id}: no topic signals registered for the audit`);
    } else {
      const challengeHasTopicSignal = signals.some((signal) => challengeText.includes(lower(signal)));
      const lessonHasTopicSignal = signals.some((signal) => searchable.includes(lower(signal)));
      if (!lessonHasTopicSignal) problems.push(`${id}: lesson content does not visibly match its assigned topic`);
      if (!challengeHasTopicSignal) problems.push(`${id}: later class challenge does not visibly test the current lesson topic`);
    }
  }

  assert.deepEqual(problems, [], `A1 presenter topic-integrity problems:\n${problems.join("\n")}`);
});

test("A1 presenter keeps recall before the current-topic class challenge", () => {
  const presenter = fs.readFileSync(new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url), "utf8");
  const recallIndex = presenter.indexOf('id: "recall"');
  const challengeIndex = presenter.indexOf('id: "grammar-check"');
  assert.ok(recallIndex >= 0, "A1 recall stage is missing");
  assert.ok(challengeIndex > recallIndex, "A1 class challenge must come after recall");
  assert.match(presenter, /items:\s*retrievalChecks/);
  assert.match(presenter, /items:\s*classChecks/);
  assert.match(presenter, /kicker:\s*"Grammatik-Check"/);
  assert.match(presenter, /title:\s*"Class challenge/);
});