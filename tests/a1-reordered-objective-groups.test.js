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

test("matches restarted A1-2 answer groups to the correct reference ranges", () => {
  const result = computeObjectiveScore("A1-2", submission);
  const wrong = Object.entries(result.details)
    .filter(([, detail]) => detail.correct === false)
    .map(([question]) => Number(question));

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 14);
  assert.deepEqual(wrong, [14]);
  assert.match(result.details[11].student, /Sechzehn/i);
  assert.match(result.details[12].student, /Achtundnuenzig/i);
  assert.match(result.details[14].student, /Einhundertzwanzig/i);
  assert.equal(result.details[1].student, "A");
  assert.equal(result.details[10].student, "A");
});
