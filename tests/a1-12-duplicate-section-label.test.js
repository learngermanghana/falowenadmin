import test from "node:test";
import assert from "node:assert/strict";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

const referenceEntry = {
  assignmentId: "A1-12.1",
  format: "objective",
  answers: {
    "Teil 1": { Answer1: "B) Ärztin", Answer2: "A) Weil sie keine Zeit hat", Answer3: "B) Um 8 Uhr", Answer4: "C) Viele verschiedene Fächer", Answer5: "C) Einen Sprachkurs besuchen" },
    "Teil 2": { Answer1: "B) Falsch", Answer2: "B) Falsch", Answer3: "B) Falsch", Answer4: "B) Falsch", Answer5: "B) Falsch" },
    "Teil 3": { Answer1: "A) Richtig", Answer2: "A) Richtig", Answer3: "A) Richtig", Answer4: "A) Richtig", Answer5: "A) Richtig" },
  },
};

const submissionText = `TEIL 1
1. Ärztin
2. weil sie kein zeit hat
3. um 8Uhr
4. viele verschiedene Fächer
5. Einen sprachkurs besuchen
TEIL 3
1. falsch
2. falsch
3. falsch
4. falsch
5. falsch
TEIL 3
1. Richtig
2. falsch
3. Richtig
4. Richtig
5. Richtig`;

test("A1 objective marking repairs one duplicated section heading", () => {
  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText });
  assert.equal(result.objectiveCorrect, 14);
  assert.equal(result.objectiveTotal, 15);
  assert.equal(result.objectiveScore, 93);
  assert.equal(result.detectedParts.find((part) => part.partId === "teil2")?.correct, 5);
  assert.equal(result.wrongAnswers.length, 1);
  assert.equal(result.wrongAnswers[0].partId, "teil3");
  assert.equal(result.wrongAnswers[0].question, 2);
});
