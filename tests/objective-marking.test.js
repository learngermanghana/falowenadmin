import test from "node:test";
import assert from "node:assert/strict";

import {
  compareAnswers,
  computeObjectiveScore,
  extractChoiceAnswers,
  extractVocabularyAnswers,
  normalizeAnswer,
} from "../src/utils/objectiveMarking.js";

test("normalizes case, accents, German sharp-s, and punctuation", () => {
  assert.equal(normalizeAnswer(" Füße! "), "fusse");
  assert.equal(normalizeAnswer("Ärztin-Kopf"), "arztin kopf");
});

test("extracts choice answers with Anzeige/Option wording and loose dots", () => {
  const answers = extractChoiceAnswers(`
    1. A Anzeige A
    Frage 2 B Anzeige B
    9 . B Option B
  `);

  assert.equal(answers[1], "A");
  assert.equal(answers[2], "B");
  assert.equal(answers[9], "B");
});

test("extracts vocabulary answer pairs", () => {
  const answers = extractVocabularyAnswers(`
    Head – Kopf
    Arm: Arm
    Foot - Fuß
  `);

  assert.equal(answers.head, "kopf");
  assert.equal(answers.arm, "arm");
  assert.equal(answers.foot, "fuss");
});

test("compares nine provided reference answers as 9/9 correct", () => {
  const ref = {
    1: "A",
    2: "B",
    3: "B",
    4: "A",
    5: "A",
    6: "kopf",
    7: "arm",
    8: "bein",
    9: "auge",
  };
  const student = {
    1: "A",
    2: "B",
    3: "B",
    4: "A",
    5: "A",
    6: "Kopf",
    7: "Arm",
    8: "Bein",
    9: "Auge",
  };

  const result = compareAnswers(ref, student);
  assert.equal(result.correctCount, 9);
  assert.equal(result.totalCount, 9);
  assert.ok(Object.values(result.details).every((detail) => detail.correct));
});

test("computes A1-14.1 objective score from choices and vocabulary pairs", () => {
  const result = computeObjectiveScore("A1-14.1", `
    1. A Anzeige A
    2. B Anzeige B
    3. B
    4. A
    5. A
    Head – Kopf
    Arm – Arm
    Leg – Bein
    Eye – Auge
    Nose – Nase
    Ear – Ohr
    Mouth – Mund
    Hand – Hand
    Foot – Fuß
    Belly – Bauch
  `);

  assert.equal(result.correctCount, 15);
  assert.equal(result.totalCount, 15);
});
