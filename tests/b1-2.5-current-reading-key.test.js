import test from "node:test";
import assert from "node:assert/strict";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

test("B1-2.5 marks Laura's current reading and listening submission as 12/12", () => {
  const result = computeObjectiveScore("B1-2.5", "TEIL 3\n1. B\n2. B\n3. B\n4. C\n5. B\n6. A\n7. B\n\nTEIL 4\n1. A\n2. B\n3. B\n4. C\n5. B");
  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  assert.match(result.details["teil3.4"].expectedDisplay, /800 Euro/);
  assert.match(result.details["teil3.7"].expectedDisplay, /Bis Freitag/);
});
