import test from "node:test";
import assert from "node:assert/strict";
import { autoMarkSubmission } from "../src/utils/autoMarking.js";

test("objective auto-mark accepts option letter only", () => {
  const result = autoMarkSubmission({
    referenceEntry: {
      format: "objective",
      answers: {
        Answer1: "B) Um sieben Uhr",
        Answer2: "C) In Berlin",
      },
    },
    submissionText: "Answer1: B\nAnswer2: C",
  });

  assert.equal(result.score, 100);
});

test("objective auto-mark accepts answer text without option letter", () => {
  const result = autoMarkSubmission({
    referenceEntry: {
      format: "objective",
      answers: {
        Answer1: "B) Um sieben Uhr",
        Answer2: "C) In Berlin",
      },
    },
    submissionText: "Answer1: um sieben uhr\nAnswer2: In Berlin",
  });

  assert.equal(result.score, 100);
});

test("objective auto-mark catches partial correctness", () => {
  const result = autoMarkSubmission({
    referenceEntry: {
      format: "objective",
      answers: {
        Answer1: "B) Um sieben Uhr",
        Answer2: "C) In Berlin",
      },
    },
    submissionText: "Answer1: B\nAnswer2: A",
  });

  assert.equal(result.score, 50);
  assert.match(result.feedback, /1\/2/);
});

test("smart router splits A2 submission and routes Schreiben to writing, Lesen/Hören to objective keys", () => {
  const result = autoMarkSubmission({
    referenceEntry: {
      assignmentKey: "A2-Mock-1",
      level: "A2",
      answers: {
        teil3: { Answer1: "B", Answer2: "richtig" },
        teil4: { Answer1: "A", Answer2: "falsch" },
      },
    },
    submission: { assignmentKey: "A2-Mock-1", level: "A2" },
    submissionText: `Teil 2 Schreiben
Hallo Anna,
ich komme heute später, weil ich arbeiten muss. Kannst du bitte warten? Viele Gruesse

Teil 3 Lesen
1: b
2: R

Teil 4 Hören
1: A
2: false`,
  });

  assert.equal(result.level, "A2");
  assert.equal(result.objectiveCorrect, 4);
  assert.equal(result.objectiveTotal, 4);
  assert.equal(result.detectedParts.find((part) => part.partId === "teil2").partType, "writing");
  assert.equal(result.status, "marked");
});

test("A1 letter-like submission uses A1 writing rubric", () => {
  const result = autoMarkSubmission({
    referenceEntry: { assignmentKey: "A1-letter", level: "A1" },
    submission: { level: "A1", assignmentKey: "A1-letter" },
    submissionText: "Hallo Maria,\nich bin krank. Ich komme heute nicht. Wir sehen uns morgen. Viele Gruesse\nAma",
  });

  assert.equal(result.parts[0].partType, "writing");
  assert.equal(result.parts[0].result.level, "A1");
});

import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { normalizeAnswerDictionary, normalizeSingleAnswer } from "../src/utils/answerKeyNormalizer.js";

test("normalizes option-letter answer metadata for registry import", () => {
  const normalized = normalizeSingleAnswer("Answer1", "B) Tanzen", 0);

  assert.deepEqual(normalized.acceptedAnswers.slice(0, 3), ["B", "Tanzen", "B Tanzen"]);
  assert.equal(normalized.questionNumber, "1");
  assert.equal(normalized.correctLetter, "B");
  assert.equal(normalized.correctText, "Tanzen");
});

test("objective matching accepts stem and close spelling but flags conflicting option plus text", () => {
  const referenceEntry = {
    format: "objective",
    answers: { Answer1: "B) Tanzen", Answer2: "B) Tanzen", Answer3: "B) Tanzen" },
  };

  const result = autoMarkSubmission({
    referenceEntry,
    submissionText: "1: Tanz\n2: tansen\n3: A Tanzen",
  });

  assert.equal(result.objectiveCorrect, 2);
  assert.equal(result.status, "needs_review");
  assert.match(result.parts[0].result.needsReview[0].reason, /Conflicting option letter/);
});

test("objective matching treats correct option letter as primary over wrong text", () => {
  const result = autoMarkSubmission({
    referenceEntry: { assignmentKey: "A1-3", level: "A1", format: "objective", answers: { Answer1: "B) Tanzen" } },
    submission: { assignmentKey: "A1-3", level: "A1" },
    submissionText: "1: B Schwimmen",
  });

  assert.equal(result.objectiveCorrect, 1);
  assert.equal(result.status, "marked");
});

test("normalizes uploaded A2/B1 dictionary entries with Teil 3 and Teil 4 parts", () => {
  const registry = normalizeAnswerDictionary(answersDictionary);
  const a2 = registry.find((entry) => entry.assignmentKey === "A2-1.1");
  const b1 = registry.find((entry) => entry.assignmentKey === "B1-1.1");

  assert.ok(a2.parts.teil3.answerCount > 0);
  assert.ok(a2.parts.teil4.answerCount > 0);
  assert.ok(b1.parts.teil3.answerCount > 0);
  assert.ok(b1.parts.teil4.answerCount > 0);
});
