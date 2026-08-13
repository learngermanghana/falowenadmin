import test from "node:test";
import assert from "node:assert/strict";

import { normalizeAnswerKeyEntry } from "../src/utils/answerKeyNormalizer.js";
import { assignmentHasScoredWriting } from "../src/utils/naturalMarkingFeedback.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const REFERENCE = {
  assignmentKey: "A1-11",
  level: "A1",
  expectedParts: ["teil1"],
  referenceAnswerParts: ["teil1"],
  parts: {
    teil1: {
      answers: {
        Answer1: "B) Wie komme ich zur nächsten Apotheke?",
        Answer2: "C) Rechts abbiegen",
        Answer3: "B) Auf der linken Seite, direkt neben der Bäckerei",
      },
    },
  },
};

test("question-form multiple-choice answers are not treated as copied prompts", () => {
  const result = computeObjectiveScore(REFERENCE, `Teil 1
1. B) Wie komme ich zur nächsten Apotheke?
2. C) Rechts abbiegen
3. B) Auf der linken Seite, direkt neben der Bäckerei`);

  assert.equal(result.correctCount, 3);
  assert.equal(result.totalCount, 3);
  assert.match(result.details["teil1.1"].student, /^B\)/i);
  assert.equal(result.details["teil1.1"].correct, true);
  assert.equal(result.details["teil1.2"].correct, true);
  assert.equal(result.details["teil1.3"].correct, true);
});

test("A1 placeholder-only reference is classified as AI writing", () => {
  const rawReference = {
    assignment_id: "A1-12.3",
    answers: { Answer1: "Read comment for answers" },
    expectedParts: ["main"],
  };
  const normalized = normalizeAnswerKeyEntry("Introduction to Letter Writing 12.3", rawReference);

  assert.equal(normalized.format, "writing");
  assert.deepEqual(normalized.writingParts, ["main"]);
  assert.deepEqual(normalized.aiGradedParts, ["main"]);
  assert.deepEqual(normalized.referenceAnswerParts, []);
  assert.equal(normalized.partGrading.main.hasReferenceAnswers, false);
  assert.equal(normalized.partGrading.main.gradingMode, "ai_written_response");
  assert.equal(assignmentHasScoredWriting(rawReference), true);
  assert.equal(assignmentHasScoredWriting(normalized), true);
});

test("A1-12.3 letter submission does not receive a fake 0/1 objective score", () => {
  const reference = {
    assignmentKey: "A1-12.3",
    level: "A1",
    answers: { Answer1: "Read comment for answers" },
  };
  const submission = `Part 1
Liebe Anna, alles Gute zum Geburtstag. Ich schreibe dir, weil ich dir herzlich gratulieren möchte. Feierst du dieses Jahr eine große Party? Ich würde gerne wissen, ob ich mit meiner ganzen Familie kommen kann. Schreib mir bald zurück. Viele Grüße, dein Freund.

Part 2
Sehr geehrte Damen und Herren, ich möchte einen Deutschkurs besuchen und bitte Sie um Informationen zu den Kursen. Können Sie mir bitte die genauen Termine, Preise und Zahlungsoptionen mitteilen?

Mit freundlichen Grüßen
Max Mustermann`;

  const result = computeObjectiveScore(reference, submission);
  assert.equal(result.correctCount, 0);
  assert.equal(result.totalCount, 0);
  assert.deepEqual(result.details, {});
});
