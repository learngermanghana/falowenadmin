import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const legacySubmission = `Teil 1
1. B
2. B
3. B
4. B
5. C

Teil 2
1. C
2. C
3. B
4. A
5. C

Teil 3
1. Fragen nach dem Weg: 'Entschuldigung, wie komme ich zum Bahnhof'
2. Die Straße überqueren: 'Überqueren Sie die Straße'
3. Geradeaus gehen: 'Gehen Sie geradeaus'
4. Links abbiegen: 'Biegen Sie links ab'
5. Rechts abbiegen: 'Biegen Sie rechts ab'`;

test("A1-11 preserves the former 15-answer grading contract", () => {
  const result = computeObjectiveScore("A1-11", legacySubmission);
  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 15);
});

const currentSubmission = `Teil 1
1. B
2. A
3. C
4. B
5. A

Teil 2
1. A
2. B
3. A
4. B
5. A`;

test("A1-11 current Day 17 submissions use the new 5+5 key", () => {
  const result = computeObjectiveScore("A1-11", currentSubmission);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
});
