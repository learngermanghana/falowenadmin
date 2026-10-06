import test from "node:test";
import assert from "node:assert/strict";
import { getMaxWritingScore, writingPercentFromResult, mergeObjectiveScore } from "../src/utils/markingReview.js";
import { calculateFinalScore } from "../src/utils/finalScore.js";
import { calculateWeightedMarkingOutcome } from "../src/utils/markingScorePolicy.js";

const noObjective = { totalCount: 0, correctCount: 0, details: {} };

test("explicit writing percentages take precedence over raw points", () => {
  assert.equal(writingPercentFromResult({ writingScore: 40, writingScorePercent: 40 }), 40);
  assert.equal(writingPercentFromResult({ writingScore: 20, maxWritingScore: 50, writingScorePercent: 40 }), 40);
  assert.equal(writingPercentFromResult({ writingScore: 20, maxWritingScore: 50 }), 40);
  assert.equal(getMaxWritingScore({ writingScore: 40 }), 100);
  assert.equal(writingPercentFromResult({ writingScore: 40 }), 40);
});

test("missing writing stays missing and zero stays a valid result", () => {
  assert.equal(writingPercentFromResult({}), null);
  assert.equal(writingPercentFromResult({ writingScore: "" }), null);
  assert.equal(writingPercentFromResult({ writingScore: 0 }), 0);
  const result = mergeObjectiveScore({ level: "A1", writingScore: 0, finalScore: 75 }, noObjective);
  assert.equal(result.finalScore, 0);
  assert.equal(result.passed, false);
});

test("writing-only submissions are not averaged with a missing objective score", () => {
  for (const level of ["A1", "A2", "B1"]) {
    assert.equal(calculateFinalScore(0, 80, { level, hasObjective: false }), 80);
    assert.equal(calculateWeightedMarkingOutcome({ level, writingPercent: 80, objectiveScore: null, hasWriting: true }).finalScore, 80);
    assert.equal(mergeObjectiveScore({ level, writingScore: 80 }, noObjective).finalScore, 80);
  }
});

test("percent-only writing results can be merged without a raw score", () => {
  assert.equal(mergeObjectiveScore({ level: "A1", writingScorePercent: 40 }, noObjective).finalScore, 40);
});

test("an explicit zero objective score still participates in mixed marking", () => {
  assert.equal(calculateFinalScore(0, 80, { level: "A1", hasObjective: true }), 40);
  assert.equal(calculateWeightedMarkingOutcome({ level: "A1", writingPercent: 80, objectiveScore: 0, hasWriting: true }).finalScore, 40);
});
