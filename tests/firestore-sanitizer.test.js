import test from "node:test";
import assert from "node:assert/strict";

import { sanitizeFirestoreData } from "../src/utils/firestoreSanitizer.js";

test("sanitizeFirestoreData removes undefined object fields recursively", () => {
  const input = {
    result: {
      score: 78,
      ai: {
        suspiciousWritingZero: undefined,
        questionAwareWritingGuard: {
          recoveredWritingScore: undefined,
          registerMismatch: true,
        },
      },
    },
    optional: undefined,
  };

  const sanitized = sanitizeFirestoreData(input);
  assert.equal(sanitized.result.score, 78);
  assert.equal("optional" in sanitized, false);
  assert.equal("suspiciousWritingZero" in sanitized.result.ai, false);
  assert.equal("recoveredWritingScore" in sanitized.result.ai.questionAwareWritingGuard, false);
  assert.equal(sanitized.result.ai.questionAwareWritingGuard.registerMismatch, true);
});

test("sanitizeFirestoreData converts undefined array slots to null and preserves non-plain objects", () => {
  const date = new Date("2026-09-18T00:00:00Z");
  const sanitized = sanitizeFirestoreData({
    items: ["a", undefined, { ok: true, skip: undefined }],
    date,
  });

  assert.deepEqual(sanitized.items, ["a", null, { ok: true }]);
  assert.equal(sanitized.date, date);
});
