import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const vickySubmission = `
Teil 1
Frage 1 Anzeige B
Frage 2 Anzeige B
Frage 3 Anzeige A
Frage 4 Anzeige A
Frage 5 Anzeige

Teil 2

Leiber Felix

Wie geht's dir? Ich schreibe, weil ich nicht an der Geburtstagsfeier teilnehmen kann. Ich bin krank. Ich habe kopfschmerzen Könnten wir einen anderen Termin vereinbaren?

Ich freue mich auf deine Antwort

Liebe Grüße
Vicky

Teil 3
Head - die köpfe
Arm- der Arm
Leg die Beine
Eye -die Augen
Nose -die Nase
Ear -das Ohr
Mouth -der Mund
Hand - die Hände
Foot - der Fuß
Stomach - der Baunch
`;

test("A1-14.1 preserves explicit choice positions and semantic body-part labels", () => {
  const result = computeObjectiveScore("A1-14.1", vickySubmission);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 7);

  assert.equal(result.details[1].student, "Anzeige B");
  assert.equal(result.details[1].correct, false);
  assert.equal(result.details[2].student, "Anzeige B");
  assert.equal(result.details[2].correct, true);
  assert.equal(result.details[3].student, "Anzeige A");
  assert.equal(result.details[3].correct, false);
  assert.equal(result.details[4].student, "Anzeige A");
  assert.equal(result.details[4].correct, true);
  assert.equal(result.details[5].student, "");

  assert.equal(result.details[6].student, "die kopfe");
  assert.equal(result.details[7].student, "der arm");
  assert.equal(result.details[7].correct, true);
  assert.equal(result.details[8].student, "die beine");
  assert.equal(result.details[9].student, "die augen");
  assert.equal(result.details[10].student, "die nase");
  assert.equal(result.details[10].correct, true);
  assert.equal(result.details[11].student, "das ohr");
  assert.equal(result.details[11].correct, true);
  assert.equal(result.details[12].student, "der mund");
  assert.equal(result.details[12].correct, true);
  assert.equal(result.details[13].student, "die hande");
  assert.equal(result.details[13].correct, false);
  assert.equal(result.details[14].student, "der fuss");
  assert.equal(result.details[14].correct, true);
  assert.equal(result.details[15].student, "der baunch");
  assert.equal(result.details[15].correct, false);
});
