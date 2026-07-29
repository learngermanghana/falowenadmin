import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const REFERENCE = {
  assignmentKey: "A1-11",
  level: "A1",
  expectedParts: ["teil1"],
  referenceAnswerParts: ["teil1"],
  parts: {
    teil1: {
      answers: {
        Answer1: "B) Wie komme ich zur nächsten Apotheke?",
        Answer2: "C) Rechts abbiegen",
        Answer3: "B) Auf der linken Seite, direkt neben der Bäckerei",
      },
    },
  },
};

test("question-form multiple-choice answers are not treated as copied prompts", () => {
  const result = computeObjectiveScore(REFERENCE, `Teil 1
1. B) Wie komme ich zur nächsten Apotheke?
2. C) Rechts abbiegen
3. B) Auf der linken Seite, direkt neben der Bäckerei`);

  assert.equal(result.correctCount, 3);
  assert.equal(result.totalCount, 3);
  assert.match(result.details["teil1.1"].student, /^B\)/i);
  assert.equal(result.details["teil1.1"].correct, true);
  assert.equal(result.details["teil1.2"].correct, true);
  assert.equal(result.details["teil1.3"].correct, true);
});
