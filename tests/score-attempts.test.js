import test from "node:test";
import assert from "node:assert/strict";
import { buildScoreAttemptMetadata, shouldSkipExistingScore } from "../src/utils/scoreAttempts.js";

const now = "2026-06-12T10:00:00.000Z";

test("allows a failed result to be saved as a resubmission attempt", () => {
  const existing = { score: 45, status: "failed", attempt: 1, sheetSaved: true };

  assert.equal(shouldSkipExistingScore(existing), false);
  assert.deepEqual(buildScoreAttemptMetadata(existing, 72, now), {
    attempt: 2,
    status: "passed",
    is_resubmission: true,
    previous_score: 45,
    previous_result: "failed",
    resubmitted_at: now,
  });
});

test("skips a duplicate when the existing result passed", () => {
  const existing = { score: 60, status: "passed", attempt: 1, sheetSaved: true };

  assert.equal(shouldSkipExistingScore(existing), true);
  assert.equal(buildScoreAttemptMetadata(existing, 80, now).is_resubmission, false);
});

test("recognizes percentage-formatted failed scores", () => {
  const existing = { score: "59%", sheetSaved: true };

  assert.equal(shouldSkipExistingScore(existing), false);
  assert.equal(buildScoreAttemptMetadata(existing, 50, now).previous_score, 59);
});

test("does not skip when the previous sheet status is unknown", () => {
  assert.equal(shouldSkipExistingScore(null), false);
  assert.equal(shouldSkipExistingScore({ score: 80, sheetSaved: false }), false);
});
