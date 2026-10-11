import test from "node:test";
import assert from "node:assert/strict";

import {
  groundedA1WritingCorrections,
  objectiveLanguageCorrections,
} from "../src/utils/groundedLanguageCorrections.js";
import { reconcileMarkingQuality } from "../src/utils/markingQuality.js";

const text = `TEIL 1
1. Es
TEIL 2
Meine Familie ist Klein. Mein Mutter heißt Ama. Ich habe zwei Bruder.
Mein erster Bruder ist zwanzig Jahr alt und er spiele gern Musik.
TEIL 3
3. Ja, ich Liese gern.
4. Ja, ich mag gern.
6. Ja, ich Koche gern.`;

const objective = {
  totalCount: 3,
  correctCount: 2,
  details: {
    "teil3.3": { partId: "teil3", correct: true, student: "Ja, ich Liese gern.", expected: "Ich mag Lesen. / Ich mag nicht Lesen." },
    "teil3.4": { partId: "teil3", correct: false, student: "Ja, ich mag gern.", expected: "Ich mag Malen. / Ich mag nicht Malen." },
    "teil3.6": { partId: "teil3", correct: true, student: "Ja, ich Koche gern.", expected: "Ich mag Kochen. / Ich mag nicht Kochen." },
  },
};

test("meaning-credit answers still receive precise language notes without being marked wrong", () => {
  const notes = objectiveLanguageCorrections(objective, { level: "A1" });
  assert.deepEqual(notes.map(({ question, from, to }) => ({ question, from, to })), [
    { question: "teil3.3", from: "Liese", to: "lese" },
    { question: "teil3.6", from: "Koche", to: "koche" },
  ]);
  assert.equal(objective.correctCount, 2);
  assert.equal(objectiveLanguageCorrections(objective, { level: "B1" }).length, 0);
});

test("A1 writing corrections are grounded in the declared writing section only", () => {
  const corrections = groundedA1WritingCorrections(text, { level: "A1" });
  assert.deepEqual(corrections.map(({ from, to }) => ({ from, to })), [
    { from: "Mein Mutter", to: "Meine Mutter" },
    { from: "zwei Bruder", to: "zwei Brüder" },
    { from: "zwanzig Jahr alt", to: "zwanzig Jahre alt" },
    { from: "er spiele", to: "er spielt" },
  ]);
  assert.equal(groundedA1WritingCorrections("TEIL 3\nMein Mutter", { level: "A1" }).length, 0);
});

test("mixed A1 result preserves scores and review while surfacing exact grammar and spelling", () => {
  const original = {
    level: "A1", assignmentKey: "A1-3", finalScore: 71, score: 71,
    writingScore: 50, writingScorePercent: 50, status: "needs_review",
    feedback: "Review exact wording: This sentence is long.",
    corrections: [],
  };
  const result = reconcileMarkingQuality(original, objective, { text, level: "A1", assignmentId: "A1-3" }, { writingExpected: true });
  assert.equal(result.finalScore, 71);
  assert.equal(result.writingScore, 50);
  assert.equal(result.objectiveCorrect, 2);
  assert.equal(result.status, "needs_review");
  assert.match(result.feedback, /Teil 3 question 3, write “lese” instead of “Liese”/);
  assert.match(result.feedback, /Teil 3 question 6, write “koche” instead of “Koche”/);
  assert.match(result.feedback, /“Meine Mutter” instead of “Mein Mutter”/);
  assert.match(result.feedback, /“zwei Brüder” instead of “zwei Bruder”/);
  assert.doesNotMatch(result.feedback, /question 4, write/);
  assert.equal(result.corrections.some((row) => row.from === "Mein Mutter"), true);
});

test("objective-only results cannot inherit writing corrections", () => {
  const result = reconcileMarkingQuality(
    { level: "A1", assignmentKey: "A1-3", finalScore: 67, writingScore: 50, corrections: [] },
    objective,
    { text, level: "A1", assignmentId: "A1-3" },
    { writingExpected: false },
  );
  assert.equal(result.writingScore, null);
  assert.deepEqual(result.corrections, []);
  assert.match(result.feedback, /Liese/);
  assert.doesNotMatch(result.feedback, /Meine Mutter/);
});
