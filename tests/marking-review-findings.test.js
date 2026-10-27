import test from "node:test";
import assert from "node:assert/strict";

import { buildEvidenceEssayFeedback } from "../src/utils/essayFeedbackEvidence.js";
import {
  assignmentHasScoredWriting,
  buildNaturalStudentFeedback,
} from "../src/utils/naturalMarkingFeedback.js";

test("missing objectiveCorrect falls back to authoritative wrong-answer rows", () => {
  for (const missingCount of [null, ""]) {
    const feedback = buildNaturalStudentFeedback({
      studentName: "Nabi",
      objectiveScore: null,
      objectiveCorrect: missingCount,
      objectiveTotal: 4,
      wrongAnswers: [{ question: 3, partId: "teil3" }],
    });

    assert.match(feedback, /3 of 4 objective questions correctly/);
    assert.match(feedback, /In Teil 3, review question 3 carefully/);
    assert.doesNotMatch(feedback, /0 of 4 objective questions correctly/);
  }
});

test("an explicit zero objectiveCorrect remains authoritative", () => {
  const feedback = buildNaturalStudentFeedback({
    objectiveScore: null,
    objectiveCorrect: 0,
    objectiveTotal: 4,
    wrongAnswers: [{ question: 3 }],
  });

  assert.match(feedback, /0 of 4 objective questions correctly/);
});

test("exact writing correction is preserved before lower-priority coaching", () => {
  const original = "weil ich möchte mit dir zusammen ein Urlaub planen";
  const corrected = "weil ich mit dir zusammen einen Urlaub planen möchte";
  const feedback = buildEvidenceEssayFeedback({
    result: {
      level: "A2",
      assignmentKey: "A2-7.18",
      studentName: "Nabi",
      writingScore: 70,
      corrections: [{ from: original, to: corrected, partId: "teil2" }],
      writingStrengths: [
        "Your formal message is clearly organised, uses a suitable greeting and closing, explains the purpose, gives practical details, asks relevant questions, and maintains an appropriately polite tone throughout the response",
      ],
      taskCompletion: { completed: 4, total: 4 },
      nextStep: "Check articles once more before submitting",
    },
    submissionText: `Sehr geehrte Damen und Herren. Ich schreibe Ihnen, ${original}. Können Sie mir bitte antworten? Vielen Dank für Ihre Hilfe.`,
    objectiveSentences: [
      "You answered 3 of 4 objective questions correctly",
      "Review question 3 carefully",
    ],
  });

  assert.match(feedback, new RegExp(corrected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(feedback, new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(feedback, /addressed all 4 task points/i);
  assert.doesNotMatch(feedback, /Check articles once more/i);
  assert.ok(feedback.split(/\s+/).length <= 60);
});

test("exact writing correction stays within the A2 cap when the wrong-question list is long", () => {
  const original = "ich möchte mit meiner Freundin zusammen einen schönen Urlaub im nächsten Sommer planen";
  const corrected = "ich möchte im nächsten Sommer zusammen mit meiner Freundin einen schönen Urlaub planen";
  const feedback = buildEvidenceEssayFeedback({
    result: {
      level: "A2",
      assignmentKey: "A2-7.18",
      studentName: "Nabi",
      writingScore: 70,
      corrections: [{ from: original, to: corrected, partId: "Teil 2" }],
    },
    submissionText: `Sehr geehrte Damen und Herren. ${original}. Können Sie mir bitte antworten? Vielen Dank für Ihre Hilfe.`,
    objectiveSentences: [
      "You answered 1 of 15 objective questions correctly",
      "Review questions 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, and 14 carefully",
    ],
  });

  assert.match(feedback, new RegExp(corrected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(feedback, new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.ok(feedback.split(/\s+/).length <= 60);
});

test("legacy imported A2 and B1 entries with expected Teil 2 keep second-examiner eligibility", () => {
  assert.equal(assignmentHasScoredWriting({
    assignmentKey: "A2-7.18",
    level: "A2",
    expectedParts: ["teil2", "teil3", "teil4"],
  }), true);

  assert.equal(assignmentHasScoredWriting({
    assignmentKey: "B1-3.7",
    expectedParts: ["Teil 2", "Teil 3", "Teil 4"],
  }), true);

  assert.equal(assignmentHasScoredWriting({
    assignmentKey: "legacy-writing-entry",
    partGrading: { writing: { gradingMode: "ai_written_response" } },
  }), true);

  assert.equal(assignmentHasScoredWriting({
    assignmentKey: "A1-7.18",
    level: "A1",
    expectedParts: ["teil2", "teil3", "teil4"],
  }), false);
});