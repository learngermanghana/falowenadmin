import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const submission = `wasser
kaffee
blume
sthule
testh

1 C) 26
2 A) Ä, Ö, Ü, ß
3 A) Eszett
4 A) K
5 A) A-Umlaut
6 A) Ä, Ö, Ü, ß
7 B) 4`;

test("A1-0.2 recovers a short unnumbered text-answer block around numbered choices", () => {
  const result = computeObjectiveScore("A1-0.2", submission);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 11);
  assert.equal(result.details[8].student.toLowerCase(), "wasser");
  assert.equal(result.details[9].student.toLowerCase(), "kaffee");
  assert.equal(result.details[10].student.toLowerCase(), "blume");
  assert.equal(result.details[11].student.toLowerCase(), "sthule");
  assert.equal(result.details[12].student.toLowerCase(), "testh");
  assert.equal(result.details[11].correct, true);
  assert.equal(result.details[12].correct, false);
});

// Keep this real submission in the permanent parser stress suite.
