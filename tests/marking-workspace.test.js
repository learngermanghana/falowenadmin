import test from "node:test";
import assert from "node:assert/strict";
import { answerKeyComparison, feedbackWordCount } from "../src/utils/markingWorkspace.js";
import { normalizeAnswerKeyEntry } from "../src/utils/answerKeyNormalizer.js";
const local = { assignmentId: "A2-3.6", answers: { teil3: { Answer1: "A) Near the window" }, teil4: { Answer1: "B) Three rooms" } } };
test("flags the old listening key while matching normalized current keys", () => {
  const current = normalizeAnswerKeyEntry("Test", local);
  assert.equal(answerKeyComparison(local, current), "matched");
  const old = normalizeAnswerKeyEntry("Test", { ...local, answers: { ...local.answers, teil4: { Answer1: "A) Two rooms" } } });
  assert.equal(answerKeyComparison(local, old), "different");
  assert.equal(answerKeyComparison(local, null), "missing");
  assert.equal(answerKeyComparison(null, current), "unselected");
});
test("key metadata and object property order do not create a false mismatch", () => {
  const current = normalizeAnswerKeyEntry("Test", local);
  current.updatedAt = "2026-10-07";
  current.parts = Object.fromEntries(Object.entries(current.parts).reverse());
  assert.equal(answerKeyComparison(local, current), "matched");
});
test("counts feedback without changing the tutor's text", () => {
  assert.equal(feedbackWordCount("  Good work.\nCheck spelling.  "), 4);
  assert.equal(feedbackWordCount(""), 0);
});
