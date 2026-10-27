import test from "node:test";
import assert from "node:assert/strict";

import { buildManualScoreCorrection } from "../src/utils/manualScoreCorrection.js";

test("manual score correction clears a stale pass when changed below 60", () => {
  const patch = buildManualScoreCorrection(40, "2026-08-19T08:52:21.000Z");

  assert.equal(patch.score, 40);
  assert.equal(patch.finalScore, 40);
  assert.equal(patch.status, "failed");
  assert.equal(patch.result, "failed");
  assert.equal(patch.passed, false);
  assert.equal(patch.failed, true);
  assert.equal(patch.scoreOverrideAuthoritative, true);
});

test("manual score correction records a pass at 60 or above", () => {
  const patch = buildManualScoreCorrection(60, "2026-08-19T08:52:21.000Z");

  assert.equal(patch.status, "passed");
  assert.equal(patch.passed, true);
  assert.equal(patch.failed, false);
});
