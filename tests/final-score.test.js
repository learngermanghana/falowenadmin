import test from "node:test";
import assert from "node:assert/strict";
import { calculateFinalScore } from "../src/utils/finalScore.js";

test("uses the objective percentage when Schreiben Mark is empty", () => {
  assert.equal(calculateFinalScore(83.3333333333, ""), 83.3333333333);
  assert.equal(calculateFinalScore(75, null), 75);
});

test("rounds the average of the objective percentage and Schreiben Mark", () => {
  assert.equal(calculateFinalScore(80, "70"), 75);
  assert.equal(calculateFinalScore(83.3333333333, 80), 82);
  assert.equal(calculateFinalScore(100, 0), 50);
});
