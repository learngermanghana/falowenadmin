import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const marySubmission = `1, B
2,B
3,B
4, C
5, C

1.  B
2. A
3. B
4. B

1) Falsch
2) Falsch
3) Falsch
4) Richtig
5) Falsch.`;

function wrongKeys(result) {
  return Object.entries(result.details)
    .filter(([, detail]) => detail.correct === false)
    .map(([key]) => key);
}

test("A1-12.1 does not borrow a missing answer from a later restarted block", () => {
  const result = computeObjectiveScore("A1-12.1", marySubmission);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 8);
  assert.equal(result.details["teil2.5"].student, "");
  assert.equal(result.details["teil2.5"].correct, false);
  assert.equal(result.details["teil3.5"].student, "Falsch.");
  assert.deepEqual(wrongKeys(result), [
    "teil1.2",
    "teil2.2",
    "teil2.5",
    "teil3.1",
    "teil3.2",
    "teil3.3",
    "teil3.5",
  ]);
});
