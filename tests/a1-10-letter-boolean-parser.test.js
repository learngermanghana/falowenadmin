import test from "node:test";
import assert from "node:assert/strict";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

const referenceEntry = {
  assignmentKey: "A1-10",
  level: "A1",
  format: "objective",
  answers: {
    Answer1: "Falsch",
    Answer2: "Wahr",
    Answer3: "Falsch",
    Answer4: "Wahr",
    Answer5: "Wahr",
    Answer6: "Falsch",
    Answer7: "Wahr",
    Answer8: "Falsch",
    Answer9: "Falsch",
    Answer10: "Falsch",
    Answer11: "B) Einmal pro Woche",
    Answer12: "C) Apfel und Bananen",
    Answer13: "A) Ein halbes Kilo",
    Answer14: "B) 10 Euro",
    Answer15: "B) Einen schönen Tag",
  },
};

const submissionText = `TEIL 1
1. B              6. B
2. A              7. A
3. B              8. B
4. B              9. A
5. A             10. B

TEIL 2
1. B
2. C
3. B
4. B
5. B`;

test("A1-10 maps A=Wahr and B=Falsch when the reference is boolean", () => {
  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText });

  assert.equal(result.objectiveCorrect, 12);
  assert.equal(result.objectiveTotal, 15);
  assert.equal(result.objectiveScore, 80);
  assert.deepEqual(result.wrongAnswers.map(({ question }) => question), [4, 9, 13]);
});
