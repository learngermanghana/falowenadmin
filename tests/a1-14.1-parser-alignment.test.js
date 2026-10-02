import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const submission = `
Teil 1
1. A
2. B
3. B
4. A
5. A

Teil 2
Lieber Felix,
ich kann leider nicht zu deinem Geburtstag kommen, weil ich krank bin und Kopfschmerzen habe.
Können wir uns nächste Woche treffen?
Liebe Grüße
Vicky

Teil 3
1. A
2. B
3. A
4. A
5. B
6. A
`;

test("A1-14.1 scores reading and new doctor-practice listening while excluding Schreiben", () => {
  const result = computeObjectiveScore("A1-14.1", submission);

  assert.equal(result.totalCount, 11);
  assert.equal(result.correctCount, 11);
  assert.equal(result.details["teil1.1"].student, "A");
  assert.equal(result.details["teil1.5"].correct, true);
  assert.equal(result.details["teil3.1"].student, "A");
  assert.equal(result.details["teil3.6"].student, "A");
  assert.equal(Object.values(result.details).some((detail) => detail.partId === "teil2"), false);
});
