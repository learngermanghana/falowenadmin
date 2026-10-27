import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { stripMarkingEmojis } from "../src/utils/markingFeedbackText.js";
import { dedupeRepeatedFeedback, limitFeedbackWords } from "../src/utils/feedbackPolicy.js";
const backend = createRequire(import.meta.url)("../functions/markingFeedbackText.js");

for (const [name, strip] of [["browser", stripMarkingEmojis], ["backend", backend.stripMarkingEmojis]]) {
  test(`${name} removes emoji sequences while preserving tutor text and scores`, () => {
    assert.equal(strip("✅ Strong work! 👩🏽‍🏫 Review Frage 3. 🇩🇪 Score: 80/100."), "Strong work! Review Frage 3. Score: 80/100.");
    assert.equal(strip("✍️ Schreiben: Grüße, schön und außerdem.\n💡 Use weil — then put the verb last."), "Schreiben: Grüße, schön und außerdem.\nUse weil — then put the verb last.");
    assert.equal(strip("1️⃣ Review question 1. 2 + 3 = 5; 40%."), "Review question 1. 2 + 3 = 5; 40%.");
    assert.equal(strip(null), "");
  });
}

test("feedback policies remove emojis from generated and legacy comments", () => {
  assert.equal(dedupeRepeatedFeedback("✅ Your word order is correct."), "Your word order is correct.");
  assert.equal(limitFeedbackWords("💡 **Review** weil clauses."), "Review weil clauses.");
});
