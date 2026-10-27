import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const salaSubmission = `Teil 1.                              Teil 2
1)heiBt.                          Hello!Guten morgen,Ich heiBe Sala, Ich komme aus Ghana und
2)heiBt.                          Ich wohne in Accra.
3)kommen
4)kommen
5)kommt.                       Teil 3
6)kommt.                      1)A.     2)C.     3)D.    4)B.   5)A
7)wohne
8)wohnst
9)wohnt`;

function wrongQuestions(result) {
  return Object.entries(result.details)
    .filter(([, detail]) => detail.correct === false)
    .map(([question]) => Number(question));
}

test("A1-1.2 keeps side-by-side Teil columns separate when copied from a worksheet", () => {
  const result = computeObjectiveScore("A1-1.2", salaSubmission);

  assert.equal(result.totalCount, 14);
  assert.equal(result.correctCount, 11);
  assert.deepEqual(wrongQuestions(result), [1, 3, 9]);

  assert.equal(result.details[1].student, "heiBt.");
  assert.equal(result.details[1].correct, false);
  assert.equal(result.details[2].student, "heiBt.");
  assert.equal(result.details[2].correct, true);
  assert.equal(result.details[3].student, "kommen");
  assert.equal(result.details[4].student, "kommen");
  assert.equal(result.details[5].student, "kommt.");
  assert.equal(result.details[6].student, "kommt.");
  assert.equal(result.details[7].student, "wohne");
  assert.equal(result.details[8].student, "wohnst");
  assert.equal(result.details[9].student, "wohnt");

  assert.equal(result.details[10].student, "A.");
  assert.equal(result.details[11].student, "C.");
  assert.equal(result.details[12].student, "D.");
  assert.equal(result.details[13].student, "B.");
  assert.equal(result.details[14].student, "A");
});
