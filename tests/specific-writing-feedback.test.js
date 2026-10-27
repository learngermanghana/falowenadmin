import test from "node:test";
import assert from "node:assert/strict";

import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";
import { reconcileFinalDeterministicFeedback } from "../src/utils/finalDeterministicFeedback.js";

const JEFFREY_SUBMISSION = `Teil 2
Sehr geehrte Frau Abigail,

ich hoffe, es geht Ihnen gut. Ich schreibe Ihnen, weil ich mich für das berufliche Seminar interessiere.

Vielen Dank für Ihren Vorschlag. Ich freue mich über das Seminar, deshalb möchte ich mehr wissen.

Können Sie mir bitte Informationen über den Inhalt, die Termine und die Kosten schicken?

Ich freue mich im Voraus auf Ihre Antwort und hoffe auf eine positive Rückmeldung

Mit freundlichen Grüßen

Jeffrey Danso

Teil 3
1. B
2. C
3. C
4. C
5. C
6. C
7. B
8. D
9. C
10. C
11. C
12. C`;

function baseResult(overrides = {}) {
  return {
    studentName: "Jeffrey Danso",
    level: "A2",
    assignmentKey: "A2-5.14",
    objectiveScore: 100,
    objectiveCorrect: 12,
    objectiveTotal: 12,
    writingScore: 82,
    finalScore: 91,
    hasRegisteredWriting: true,
    objectiveDetails: {
      "teil3.1": { partId: "teil3", correct: true },
      "teil3.2": { partId: "teil3", correct: true },
      "teil3.3": { partId: "teil3", correct: true },
      "teil3.4": { partId: "teil3", correct: true },
      "teil3.5": { partId: "teil3", correct: true },
      "teil3.6": { partId: "teil3", correct: true },
      "teil3.7": { partId: "teil3", correct: true },
      "teil4.1": { partId: "teil4", correct: true },
      "teil4.2": { partId: "teil4", correct: true },
      "teil4.3": { partId: "teil4", correct: true },
      "teil4.4": { partId: "teil4", correct: true },
      "teil4.5": { partId: "teil4", correct: true },
    },
    ...overrides,
  };
}

test("Jeffrey evidence survives deterministic objective merging after AI marking", () => {
  const result = reconcileFinalDeterministicFeedback(baseResult({
    objectiveScore: 25,
    objectiveCorrect: 3,
    feedback: "The email asks about Inhalt, Termine and Kosten. Add a full stop after “positive Rückmeldung” before the closing.",
  }), {
    totalCount: 12,
    correctCount: 12,
    details: Object.fromEntries(Array.from({ length: 12 }, (_, index) => [
      `teil4.${index + 1}`,
      { partId: "teil4", questionNumber: index + 1, correct: true },
    ])),
  }, JEFFREY_SUBMISSION);

  assert.equal(result.objectiveScore, 100);
  assert.equal(result.objectiveCorrect, 12);
  assert.equal(result.objectiveTotal, 12);
  assert.match(result.feedback, /Teil 4.*all answers correct/i);
  assert.match(result.feedback, /Inhalt.*Termine.*Kosten/i);
  assert.match(result.feedback, /positive Rückmeldung/i);
  assert.equal(result.aiOriginalFeedback, "The email asks about Inhalt, Termine and Kosten. Add a full stop after “positive Rückmeldung” before the closing.");
  assert.equal(result.aiDetailedFeedback, result.aiOriginalFeedback);
  assert.ok(result.feedback.split(/\s+/).length <= 60);
});

test("Jeffrey feedback uses the original specific OpenAI writing evidence", () => {
  const rawAiFeedback = "Your formal email clearly asks about the seminar content, dates and costs. Avoid repeating ‘Ich freue mich’ and vary one occurrence with a different expression. All objective answers are correct.";
  const feedback = buildNaturalStudentFeedback(baseResult({
    feedback: rawAiFeedback,
    aiDetailedFeedback: rawAiFeedback,
  }), JEFFREY_SUBMISSION);

  assert.match(feedback, /seminar content, dates and costs|Inhalt.*Termine.*Kosten/i);
  assert.match(feedback, /Avoid repeating/i);
  assert.doesNotMatch(feedback, /The main purpose of your message is understandable/i);
  assert.doesNotMatch(feedback, /Check verb position, articles and every task point/i);
  assert.ok(feedback.split(/\s+/).length <= 60);
});

test("Jeffrey feedback remains specific when OpenAI returns only generic writing text", () => {
  const genericAiFeedback = "The main purpose of your message is understandable. Check verb position, articles and every task point before submitting.";
  const feedback = buildNaturalStudentFeedback(baseResult({
    feedback: genericAiFeedback,
    aiDetailedFeedback: genericAiFeedback,
  }), JEFFREY_SUBMISSION);

  assert.match(feedback, /Inhalt.*Termine.*Kosten/i);
  assert.match(feedback, /full stop.*positive Rückmeldung/i);
  assert.doesNotMatch(feedback, /The main purpose of your message is understandable/i);
  assert.doesNotMatch(feedback, /Check verb position, articles and every task point/i);
  assert.ok(feedback.split(/\s+/).length <= 60);
});

test("quoted correction prose is rejected when none of its quotes appear in the submission", () => {
  const hallucinatedAiFeedback = "Add punctuation after “a phrase I never wrote” before the closing.";
  const feedback = buildNaturalStudentFeedback(baseResult({
    feedback: hallucinatedAiFeedback,
    aiOriginalFeedback: hallucinatedAiFeedback,
    aiDetailedFeedback: hallucinatedAiFeedback,
  }), JEFFREY_SUBMISSION);

  assert.doesNotMatch(feedback, /a phrase I never wrote/i);
  assert.match(feedback, /full stop/i);
  assert.match(feedback, /positive Rückmeldung/i);
  assert.ok(feedback.split(/\s+/).length <= 60);
});

test("typographic single-quoted hallucinated corrections are also rejected", () => {
  const hallucinatedAiFeedback = "Replace ‘a phrase I never wrote’ with ‘eine erfundene Korrektur’.";
  const feedback = buildNaturalStudentFeedback(baseResult({
    feedback: hallucinatedAiFeedback,
    aiOriginalFeedback: hallucinatedAiFeedback,
    aiDetailedFeedback: hallucinatedAiFeedback,
  }), JEFFREY_SUBMISSION);

  assert.doesNotMatch(feedback, /a phrase I never wrote|eine erfundene Korrektur/i);
  assert.match(feedback, /positive Rückmeldung/i);
  assert.ok(feedback.split(/\s+/).length <= 60);
});

test("missing punctuation feedback quotes the student's actual Rückmeldung sentence", () => {
  const submission = JEFFREY_SUBMISSION.replace(
    "Ich freue mich im Voraus auf Ihre Antwort und hoffe auf eine positive Rückmeldung",
    "Ich warte auf Ihre Rückmeldung",
  );
  const genericAiFeedback = "The main purpose of your message is understandable. Check verb position, articles and every task point before submitting.";
  const feedback = buildNaturalStudentFeedback(baseResult({
    feedback: genericAiFeedback,
    aiOriginalFeedback: genericAiFeedback,
  }), submission);

  assert.match(feedback, /Ich warte auf Ihre Rückmeldung/);
  assert.doesNotMatch(feedback, /positive Rückmeldung/);
  assert.ok(feedback.split(/\s+/).length <= 60);
});

test("missing punctuation is detected after an earlier sentence on the same line", () => {
  const submission = JEFFREY_SUBMISSION.replace(
    "Ich freue mich im Voraus auf Ihre Antwort und hoffe auf eine positive Rückmeldung",
    "Vielen Dank. Ich warte auf Ihre Rückmeldung",
  );
  const genericAiFeedback = "The main purpose of your message is understandable. Check verb position, articles and every task point before submitting.";
  const feedback = buildNaturalStudentFeedback(baseResult({
    feedback: genericAiFeedback,
    aiOriginalFeedback: genericAiFeedback,
  }), submission);

  assert.match(feedback, /full stop.*Ich warte auf Ihre Rückmeldung/i);
  assert.doesNotMatch(feedback, /positive Rückmeldung/);
  assert.ok(feedback.split(/\s+/).length <= 60);
});

for (const [shape, overrides, required] of [
  ["full structured fields", {
    writingStrengths: ["The email asks about Inhalt, Termine and Kosten"],
    taskCompletion: { completed: 3, total: 3, missing: [] },
    corrections: [{ from: "positive Rückmeldung", to: "positive Rückmeldung.", partId: "teil2" }],
    nextStep: "Avoid repeating “Ich freue mich”",
    writingScorePercent: 82,
  }, /positive Rückmeldung/],
  ["specific prose without structured fields", {
    aiOriginalFeedback: "The formal email asks about Inhalt, Termine and Kosten. Add punctuation after “positive Rückmeldung” before the closing.",
  }, /positive Rückmeldung/],
  ["empty structured fields", { writingStrengths: [], taskCompletion: {}, corrections: [], nextStep: "" }, /positive Rückmeldung/],
  ["generic prose", { aiOriginalFeedback: "The main purpose of your message is understandable. Check verb position, articles and every task point before submitting." }, /positive Rückmeldung/],
  ["malformed or incomplete normalized response", { feedback: "", improvementSummary: "", corrections: [{ from: "invented text", to: "invented correction" }] }, /positive Rückmeldung/],
]) {
  test(`Jeffrey production feedback handles ${shape}`, () => {
    const feedback = buildNaturalStudentFeedback(baseResult(overrides), JEFFREY_SUBMISSION);
    assert.match(feedback, /Inhalt.*Termine.*Kosten/i);
    assert.match(feedback, required);
    assert.doesNotMatch(feedback, /invented text|invented correction/i);
    assert.doesNotMatch(feedback, /The main purpose of your message is understandable|Check verb position, articles and every task point before submitting/i);
    assert.ok(feedback.split(/\s+/).length <= 60);
  });
}
