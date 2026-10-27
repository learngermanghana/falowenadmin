import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const submission = `Tiel 1.
Q1. Sechzehn(16)
Q2. Achtundnuenzig(98)
Q3. Fünfhundertfünfundfünfzig(555)
Q4. Einhundertzwanzig(1020)
Q5. Achttausendfünfhundertdreiundfünfzig(8553)

Tiel 2.
Q1. A
Q2. B
Q3. B
Q4. B
Q5. B
Q6. C
Q7. B
Q8. A
Q9. A
Q10. A`;

test("restarted legacy A1-2 paste cannot resurrect a retired 15-item answer key", () => {
  const result = computeObjectiveScore("A1-2", submission);
  // The learner's current A1-2 workbook has five form entries and five
  // number-word entries, not the former 15-question legacy worksheet.
  assert.equal(result.totalCount, 10);
  assert.equal(Object.keys(result.details).length, 10);
  assert.ok(result.correctCount >= 0 && result.correctCount <= 10);
});
