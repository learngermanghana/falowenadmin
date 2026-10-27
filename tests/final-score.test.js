import test from "node:test";
import assert from "node:assert/strict";
import { calculateFinalScore } from "../src/utils/finalScore.js";

test("uses the objective percentage when Schreiben Mark is empty", () => {
  assert.equal(calculateFinalScore(83.3333333333, ""), 83.3333333333);
  assert.equal(calculateFinalScore(75, null), 75);
});

test("rounds composite scores upward and treats zero writing as a valid score", () => {
  assert.equal(calculateFinalScore(80, "70"), 75);
  assert.equal(calculateFinalScore(83.3333333333, 80), 82);
  assert.equal(calculateFinalScore(100, 0), 50);
  assert.equal(calculateFinalScore(92, 0), 46);
  assert.equal(calculateFinalScore(91.6666666667, 18), 55);
  assert.equal(calculateFinalScore(92.04, 0), 47);
});
