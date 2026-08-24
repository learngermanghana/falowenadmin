import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const submission = `1. b) Ärztin
2. a) Weil sie keine Zeit hat.
3. b) Um 8 Uhr
4. c) Viele verschiedene Fächer
5. c) Einen Sprachkurs besuchen
Q2. 1. b) Falsch
2. b) Falsch
3. b) Falsch
4. b) Falsch
5. b) Falsch
Q3.1 1. a) Richtig
2.b.Falsch
3.aRichtig
4.bFalsch
5.Richtig`;

test("A1-12.1 recognises Q2/Q3 aliases without shifting multipart answers", () => {
  const result = computeObjectiveScore("A1-12.1", submission);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 13);

  for (let question = 1; question <= 5; question += 1) {
    assert.equal(result.details[`teil1.${question}`].correct, true, `Teil 1 question ${question}`);
    assert.equal(result.details[`teil2.${question}`].correct, true, `Teil 2 question ${question}`);
  }

  assert.equal(result.details["teil3.1"].student, "a) Richtig");
  assert.equal(result.details["teil3.1"].correct, true);
  assert.equal(result.details["teil3.2"].student, "b.Falsch");
  assert.equal(result.details["teil3.2"].correct, false);
  assert.equal(result.details["teil3.3"].student, "aRichtig");
  assert.equal(result.details["teil3.3"].correct, true);
  assert.equal(result.details["teil3.4"].student, "bFalsch");
  assert.equal(result.details["teil3.4"].correct, false);
  assert.equal(result.details["teil3.5"].student, "Richtig");
  assert.equal(result.details["teil3.5"].correct, true);
});
