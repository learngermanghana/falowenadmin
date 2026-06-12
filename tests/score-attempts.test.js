import test from "node:test";
import assert from "node:assert/strict";
import { buildScoreAttemptMetadata, shouldSkipExistingScore } from "../src/utils/scoreAttempts.js";

const now = "2026-06-12T10:00:00.000Z";

test("allows a failed result to be followed by a saved resubmission attempt", () => {
  const existing = { score: 45, status: "failed", attempt: 1, sheetSaved: true };

  assert.equal(shouldSkipExistingScore(existing, 72), false);
  assert.deepEqual(buildScoreAttemptMetadata(existing, 72, now), {
    attempt: 2,
    status: "passed",
    is_resubmission: true,
    previous_score: 45,
    previous_result: "failed",
    resubmitted_at: now,
  });
});

test("saves a newly entered failed attempt even when an older passing score exists", () => {
  const existing = { score: 75, status: "passed", attempt: 1, sheetSaved: true };

  assert.equal(shouldSkipExistingScore(existing, 40), false);
  assert.deepEqual(buildScoreAttemptMetadata(existing, 40, now), {
    attempt: 2,
    status: "failed",
    is_resubmission: true,
    previous_score: 75,
    previous_result: "passed",
    resubmitted_at: now,
  });
});

test("skips a duplicate when both the existing and new results passed", () => {
  const existing = { score: 60, status: "passed", attempt: 1, sheetSaved: true };

  assert.equal(shouldSkipExistingScore(existing, 80), true);
});

test("recognizes percentage-formatted failed scores", () => {
  const existing = { score: "59%", sheetSaved: true };

  assert.equal(shouldSkipExistingScore(existing, "50%"), false);
  assert.equal(buildScoreAttemptMetadata(existing, 50, now).previous_score, 59);
});

test("does not skip when the previous sheet status is unknown", () => {
  assert.equal(shouldSkipExistingScore(null, 80), false);
  assert.equal(shouldSkipExistingScore({ score: 80, sheetSaved: false }, 80), false);
});

test("retries a score that was not successfully saved without labeling it as a resubmission", () => {
  const existing = { score: 45, attempt: 1, sheetSaved: false };

  assert.deepEqual(buildScoreAttemptMetadata(existing, 45, now), {
    attempt: 1,
    status: "failed",
    is_resubmission: false,
    previous_score: "",
    previous_result: "",
    resubmitted_at: "",
  });
});

test("allowDuplicate overrides duplicate suppression", () => {
  const existing = { score: 80, sheetSaved: true };

  assert.equal(shouldSkipExistingScore(existing, 90, true), false);
});
