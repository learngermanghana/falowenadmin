import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

const dictionary = JSON.parse(fs.readFileSync(new URL("../src/data/answers_dictionary.json", import.meta.url), "utf8"));

function entryByAssignmentId(id) {
  return Object.values(dictionary).find((entry) => String(entry?.assignment_id || entry?.assignmentId || "").trim().toUpperCase() === id);
}

test("A1-6 accepts the correct German headword even when the English gloss has a typo", () => {
  const referenceEntry = entryByAssignmentId("A1-6");
  assert.ok(referenceEntry);

  const submissionText = `Teil 1
1.das Wohnzimmer- f. the livingroom
2.die Küche- a. the kitchen
3.das Schlafzimmer- b. the bedroom
4.das Badezimmer- d. the bathroom
5.der Balkon- c. the balcony
6.der Flur- e. the hallroom
7.das Bett- i. the bed
8.der Tisch- h. the table
9.der Stuhl- g. the chair
10.der Schrank- j. the wardrobe

teil 2
1.b) Vier
2.a) Ein Sofa und ein Fernseher
3.b) Einen Herd, einen Kühlschrank und einen Tisch mit vier Stühlen
4.c) Ein großes Bett
5.d) Eine Dusche, eine Badewanne und ein Waschbecken
6.b) Klein und schön
7.c) Blumen und einen kleinen Tisch mit zwei Stühlen

Teil 3
1.b) Vier
2.b) Ein Sofa und ein Fernseher
3.b) Einen Herd, einen Kühlschrank und einen Tisch mit vier Stühlen
4.c) Ein großes Bett
5.d) Eine Dusche, eine Badewanne und ein Waschbecken
6.b) Klein und schön
7.c) Blumen und einen kleinen Tisch mit zwei Stühlen`;

  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText });
  assert.equal(result.objectiveCorrect, 24);
  assert.equal(result.objectiveTotal, 24);
  assert.equal(result.wrongAnswers.length, 0);
});

test("A1-14.1 scores the new listening choices and ignores the health letter", () => {
  const referenceEntry = entryByAssignmentId("A1-14.1");
  assert.ok(referenceEntry);

  const submissionText = `Teil 1
1. A
2. B
3. B
4. A
5. A

Teil 2
Lieber Felix,
ich kann leider nicht kommen, weil ich krank bin. Können wir uns nächste Woche treffen?
Liebe Grüße,
Mary

Teil 3
1. A
2. B
3. A
4. A
5. B
6. A`;

  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText });
  assert.equal(result.objectiveCorrect, 11);
  assert.equal(result.objectiveTotal, 11);
  assert.equal(result.wrongAnswers.length, 0);
});
