import test from "node:test";
import assert from "node:assert/strict";

import { a2Day4WritingDeltaThreshold, compareExaminerResults } from "../src/utils/markingIntelligence.js";

const complete = (score, writingScore, confidence = 0.98) => ({
  finalScore: score,
  writingScore,
  confidence,
  status: "marked",
  taskPointEvidence: [
    { label: "Invite and suggest activity", status: "met" },
    { label: "Ask when and where", status: "met" },
    { label: "Ask to bring something", status: "met" },
  ],
  missingTaskPoints: [],
  taskCompletion: { completed: 3, total: 3, missing: [] },
  reviewReasons: [],
});

test("A2 Day 4 avoids unnecessary review for fully evidenced 12-point writing delta", () => {
  const primary = complete(83, 76);
  const secondary = complete(87, 88);
  const writingDeltaThreshold = a2Day4WritingDeltaThreshold(primary, secondary, "A2-2.4");
  assert.equal(writingDeltaThreshold, 18);
  const result = compareExaminerResults(primary, secondary, { writingDeltaThreshold });
  assert.equal(result.scoreDelta, 4);
  assert.equal(result.writingScoreDelta, 12);
  assert.equal(result.requiresTutorReview, false);
});

test("A2 Day 4 still reviews missing task points and large score differences", () => {
  const primary = complete(83, 76);
  const missing = { ...complete(87, 88), taskPointEvidence: [
    { status: "met" }, { status: "missing" }, { status: "met" },
  ], missingTaskPoints: ["Suggest a weekend activity"] };
  assert.equal(a2Day4WritingDeltaThreshold(primary, missing, "A2-2.4"), 10);
  assert.equal(compareExaminerResults(primary, missing).requiresTutorReview, true);
  assert.equal(a2Day4WritingDeltaThreshold(primary, complete(90, 88), "A2-2.4"), 10);
  assert.equal(a2Day4WritingDeltaThreshold(primary, complete(87, 88, 0.7), "A2-2.4"), 10);
  assert.equal(a2Day4WritingDeltaThreshold(primary, complete(87, 88), "A2-3.7"), 10);
  assert.equal(a2Day4WritingDeltaThreshold(primary, { ...complete(87, 88), reviewReasons: [{ code: "task_completion_conflict" }] }, "A2-2.4"), 10);
});

test("A2 Day 4 accepts 17-point writing variance only when both strong marks have complete evidence", () => {
  const primary = complete(81, 76);
  const secondary = complete(88, 93);
  const threshold = a2Day4WritingDeltaThreshold(primary, secondary, "A2-2.4");
  assert.equal(threshold, 18);
  const result = compareExaminerResults(primary, secondary, { writingDeltaThreshold: threshold });
  assert.equal(result.scoreDelta, 7);
  assert.equal(result.writingScoreDelta, 17);
  assert.equal(result.requiresTutorReview, false);

  const lowWriting = complete(88, 70);
  assert.equal(a2Day4WritingDeltaThreshold(primary, lowWriting, "A2-2.4"), 10);
  const explicitReview = { ...secondary, status: "needs_review" };
  assert.equal(a2Day4WritingDeltaThreshold(primary, explicitReview, "A2-2.4"), 10);
  const widerGap = complete(89, 93);
  assert.equal(a2Day4WritingDeltaThreshold(primary, widerGap, "A2-2.4"), 10);
  const missingEvidence = { ...secondary, missingTaskPoints: ["Meeting place"] };
  assert.equal(a2Day4WritingDeltaThreshold(primary, missingEvidence, "A2-2.4"), 10);
});
