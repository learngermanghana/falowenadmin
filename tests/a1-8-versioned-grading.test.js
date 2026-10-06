import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const legacySubmission = `Teil 1
1. B
2. B
3. B
4. C
5. C

Teil 2
1. Falsch
2. Richtig
3. Richtig
4. Falsch
5. Richtig

Teil 3
1. B
2. B
3. C
4. B
5. D`;

test("A1-8 preserves the former 15-question grading contract", () => {
  const result = computeObjectiveScore("A1-8", legacySubmission);
  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 15);
});

const currentSubmission = `Teil 1
1. B
2. B
3. C
4. B
5. A

Teil 2
1. A
2. A
3. B
4. A
5. B`;

test("A1-8 current Day 12 submissions use the new 5+5 key", () => {
  const result = computeObjectiveScore("A1-8", currentSubmission);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
});
