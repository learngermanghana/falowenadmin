import test from "node:test";
import assert from "node:assert/strict";
import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { validateAnswerDictionary, validateAnswerEntry } from "../src/utils/answerKeyIntegrity.js";

test("committed answer dictionary has no blocking integrity errors", () => {
  const result = validateAnswerDictionary(answersDictionary);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
});

test("validator catches missing and duplicate objective answer numbers", () => {
  const result = validateAnswerEntry("Synthetic", {
    assignment_id: "TEST-1",
    expectedParts: ["teil1"],
    referenceAnswerParts: ["teil1"],
    answerLayout: "multipart",
    answers: {
      teil1: {
        Answer1: "A",
        Answer3: "B",
        "Alt Answer3": "C",
      },
    },
  });
  assert.ok(result.warnings.some((item) => item.code === "missing-answer-number"));
  assert.ok(result.errors.some((item) => item.code === "duplicate-answer-number"));
});

test("validator catches part registration drift", () => {
  const result = validateAnswerEntry("Synthetic", {
    assignment_id: "TEST-2",
    expectedParts: ["teil2", "teil3"],
    referenceAnswerParts: ["teil3"],
    writingParts: ["teil2", "teil4"],
    aiGradedParts: ["teil2"],
    answers: { teil3: { Answer1: "A" } },
  });
  assert.ok(result.errors.some((item) => item.code === "part-outside-expected" && item.part === "teil4"));
});

test("validator rejects unknown answer matching modes", () => {
  const result = validateAnswerEntry("Synthetic", {
    assignment_id: "TEST-3",
    expectedParts: ["main"],
    referenceAnswerParts: ["main"],
    answerMatchingMode: "very_loose",
    answers: { Answer1: "Ich heiße Anna" },
  });
  assert.ok(result.errors.some((item) => item.code === "unknown-matching-mode"));
});
