import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAnswerKeyEntry } from "../src/utils/answerKeyNormalizer.js";
import { validateAnswerEntry } from "../src/utils/answerKeyIntegrity.js";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

const reference = {
  assignment_id: "A1-0.2_1.1",
  format: "mixed",
  answerLayout: "multipart",
  answers: {
    "Teil 1": { Answer1: "B) 26" },
    "Teil 2": { Answer1: "Wasser" },
    "Teil 3": { Answer1: "A) Ich" },
    "Teil 4": { Answer1: "lerne" },
  },
  expectedParts: ["teil1", "teil2", "teil3", "teil4", "teil5"],
  referenceAnswerParts: ["teil1", "teil2", "teil3", "teil4"],
  writingParts: ["teil5"],
  aiGradedParts: ["teil5"],
  partGrading: {
    teil5: { label: "Erste Sätze", hasReferenceAnswers: false, gradingMode: "ai_written_response" },
  },
};

test("Day 2 five-section reference preserves Teil 5 as writing, not objective", () => {
  const normalized = normalizeAnswerKeyEntry("A1 Day 2 combined", reference);
  assert.deepEqual(normalized.expectedParts, ["teil1", "teil2", "teil3", "teil4", "teil5"]);
  assert.deepEqual(normalized.writingParts, ["teil5"]);
  assert.deepEqual(normalized.referenceAnswerParts, ["teil1", "teil2", "teil3", "teil4"]);
  assert.equal(normalized.parts.teil4.answerCount, 1);
  assert.equal(normalized.partGrading.teil5.gradingMode, "ai_written_response");
  assert.equal(validateAnswerEntry("A1 Day 2 combined", reference).errors.length, 0);
});

test("five numbered answer sections do not swallow the Teil 5 writing text", () => {
  const text = ["Teil 1", "1. B", "Teil 2", "1. Wasser", "Teil 3", "1. A", "Teil 4", "1. lerne",
    "Teil 5 · Erste Sätze", "Hallo! Ich heiße Ama. A - M - A. Ich wohne in Accra. Ich lerne Deutsch."].join("\n");
  const marked = checkDeterministicObjectiveAnswers({
    referenceEntry: normalizeAnswerKeyEntry("A1 Day 2 combined", reference),
    submissionText: text,
  });
  assert.equal(marked.objectiveTotal, 4);
  assert.equal(marked.objectiveCorrect, 4);
  assert.ok(marked.detectedParts.every(item => item.partId !== "teil5"));
});
