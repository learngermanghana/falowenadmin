import test from "node:test";
import assert from "node:assert/strict";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

test("A1-14.1 accepts equals-sign vocabulary answers with German articles without shifting sections", () => {
  const referenceEntry = {
    assignmentKey: "A1-14.1",
    level: "A1",
    format: "objective",
    answers: `Answer1: Frage 1: Anzeige A
Answer2: Frage 2: Anzeige B
Answer3: Frage 3: Anzeige B
Answer4: Frage 4: Anzeige A
Answer5: Frage 5: Anzeige A
Answer6: a. Head – Kopf
Answer7: b. Arm – Arm
Answer8: c. Leg – Bein
Answer9: d. Eye – Auge
Answer10: e. Nose – Nase
Answer11: f. Ear – Ohr
Answer12: g. Mouth – Mund
Answer13: h. Hand – Hand
Answer14: i. Foot – Fuß
Answer15: j. Stomach / Belly – Bauch`,
  };

  const submissionText = `Teil 1. Lesen: Anzeigen und Termine

1. Anzeige A
2. Anzeige B
3. Anzeige B
4. Anzeige A
5. Anzeige A

Teil 2. Schreiben: E-Mail an Felix
Absage zum Geburtstag

Liebe Felix,
vielen Dank für deine Einladung zum Geburtstag. Ich schreibe dir, weil ich leider nicht kommen kann. Ich habe Kopfschmerzen und Bauchschmerzen. Können wir uns an einem anderen Tag treffen?

Liebe Grüße
Deborah

Teil 3. Wortschatz: Translate into German
a. Head = der Kopf
b. Arm = der Arm
c. Leg = das Bein
d. Eye = das Auge
e. Nose = die Nase
f. Ear = das Ohr
g. Mouth = der Mund
h. Hand = die Hand
i. Foot = der Fuß
j. Stomach / Belly = der Bauch`;

  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText });

  assert.equal(result.objectiveTotal, 15);
  assert.equal(result.objectiveCorrect, 15);
  assert.equal(result.objectiveScore, 100);
  assert.deepEqual(result.wrongAnswers, []);
  assert.deepEqual(result.missingAnswers, []);
});
