import test from "node:test";
import assert from "node:assert/strict";

import {
  compareAnswers,
  computeObjectiveScore,
  extractChoiceAnswers,
  extractNumberedVocabularyAnswers,
  extractVocabularyAnswers,
  normalizeAnswer,
} from "../src/utils/objectiveMarking.js";

test("normalizes case, accents, German sharp-s, and punctuation", () => {
  assert.equal(normalizeAnswer(" Füße! "), "fusse");
  assert.equal(normalizeAnswer("Ärztin-Kopf"), "arztin kopf");
});

test("extracts choice answers with Anzeige/Option wording and loose dots", () => {
  const answers = extractChoiceAnswers(`
    1. A Anzeige A
    Frage 2 B Anzeige B
    9 . B Option B
  `);

  assert.equal(answers[1], "A");
  assert.equal(answers[2], "B");
  assert.equal(answers[9], "B");
});

test("extracts vocabulary answer pairs", () => {
  const answers = extractVocabularyAnswers(`
    Head – Kopf
    Arm: Arm
    Foot - Fuß
  `);

  assert.equal(answers.head, "kopf");
  assert.equal(answers.arm, "arm");
  assert.equal(answers.foot, "fuss");
});

test("extracts numbered German-only vocabulary answers from Teil 3", () => {
  const answers = extractNumberedVocabularyAnswers(`
Teil 1:
1. A Anzeige A
2. B Anzeige B

Teil 2:
Liebe Bina,
ich bin krank. Viele Grüße

Teil 3:
1. Kopf
2. Arm
3. Bein
4. Auge
5. Nase
6. Ohr
7. Mund
8 Hand
9. Fuss
10. Bauch
  `);

  assert.deepEqual(answers, ["kopf", "arm", "bein", "auge", "nase", "ohr", "mund", "hand", "fuss", "bauch"]);
});

test("compares nine provided reference answers as 9/9 correct", () => {
  const ref = {
    1: "A",
    2: "B",
    3: "B",
    4: "A",
    5: "A",
    6: "kopf",
    7: "arm",
    8: "bein",
    9: "auge",
  };
  const student = {
    1: "A",
    2: "B",
    3: "B",
    4: "A",
    5: "A",
    6: "Kopf",
    7: "Arm",
    8: "Bein",
    9: "Auge",
  };

  const result = compareAnswers(ref, student);
  assert.equal(result.correctCount, 9);
  assert.equal(result.totalCount, 9);
  assert.ok(Object.values(result.details).every((detail) => detail.correct));
});

test("computes A1-14.1 objective score from choices and vocabulary pairs", () => {
  const result = computeObjectiveScore("A1-14.1", `
    1. A Anzeige A
    2. B Anzeige B
    3. B
    4. A
    5. A
    Head – Kopf
    Arm – Arm
    Leg – Bein
    Eye – Auge
    Nose – Nase
    Ear – Ohr
    Mouth – Mund
    Hand – Hand
    Foot – Fuß
    Belly – Bauch
  `);

  assert.equal(result.correctCount, 15);
  assert.equal(result.totalCount, 15);
});

test("computes A1-14.1 objective score from the Reuben numbered German-only sample", () => {
  const result = computeObjectiveScore("A1-14.1", `
Teil 1:
1. A  Anzeige A
2. B  Anzeige B
3. B  Anzeige B
4. A  Anzeige A
5. A  Anzeige A

Teil 2:
Lieber Felix,
ich hoffe, es geht dir gut. Ich schreibe dir wegen deiner Einladung zu deinem Geburtstag. Vielen Dank für die Einladung, aber leider kann ich nicht kommen. Ich bin krank und habe Halsschmerzen. Es tut mir leid, dass ich nicht kommen kann. Können wir uns ein anderes Mal treffen und zusammen feiern? Ich freue mich auf deine Antwort.
Viele Grüße
Reuben

Teil 3:
1. Kopf
2. Arm
3. Bein
4. Auge
5. Nase
6. Ohr
7. Mund
8 Hand
9. Fuss
10. Bauch
  `);

  assert.equal(result.correctCount, 15);
  assert.equal(result.totalCount, 15);
  assert.equal(Object.values(result.details).filter((detail) => !detail.correct).length, 0);
});

test("computes partial A1-14.1 objective score for real typo/wrong-answer variants", () => {
  const result = computeObjectiveScore("A1-14.1", `
Teil 1:
1.Anzeige A
2.Anzeige B
Frage 3.
2.Anzeige B
Frage 4.
Anzeige A
Frage 5.
2.Anzeige B

Teil 3:
Head-kopf
Arm -Arm.
Leg - Beine.
Eye-Auge.
Nose-Nase.
Ear- Ohr.
Mouth-Mund.
Hand-Hand.
Foot-Fuß.
Stomach /Belly -Magen
  `);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 12);
  assert.equal(result.details[5].correct, false);
  assert.equal(result.details[8].correct, false);
  assert.equal(result.details[15].correct, false);
});

test("loads dynamic multipart answer keys from answers_dictionary by assignment id", () => {
  const result = computeObjectiveScore("A2-1.1", `
Teil 2:
Hallo Anna,
ich komme heute später, weil ich arbeiten muss. Viele Grüße

Teil 3:
1. C
2. B
3. A
4. B
5. B
6. B
7. C

Teil 4:
1. B
2. A
3. A
4. B
5. C
  `);

  assert.equal(result.correctCount, 12);
  assert.equal(result.totalCount, 12);
  assert.equal(Object.values(result.details).filter((detail) => detail.partId === "teil2").length, 0);
});

test("dynamic multipart answer keys catch wrong answers in the right part", () => {
  const result = computeObjectiveScore("A2-1.1", `
Teil 3:
1. C
2. B
3. A
4. B
5. B
6. B
7. C

Teil 4:
1. A
2. A
3. A
4. B
5. C
  `);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 11);
  assert.equal(result.details["teil4.1"].student, "A");
  assert.equal(result.details["teil4.1"].expected, "B");
  assert.equal(result.details["teil4.1"].correct, false);
});
