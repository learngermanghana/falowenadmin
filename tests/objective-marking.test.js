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

test("A1-4 flat answer key supports restarted numbering across objective parts", () => {
  const result = computeObjectiveScore("A1-4", `
Teil 1
1.Ich komme aus Deutschland.Ich spreche Deutsch.
2.Sie kommt aus Frankreich.Sie spricht Französisch.
3.Ihr kommen aus Russland. Ihr sprechen Russisch.
4.Wir kommen aus Japan.Wir sprechen Japanisch.
5.Er kommt aus England. Er spricht Englisch.

Teil 2
1.c
2.b
3.d.
4.a
5.c
6.b
7.c

Teil 3
1.c
2.b
3.c
4.b
5.Madrid
  `);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 9);
  assert.equal(result.details[9].correct, false);
  assert.equal(result.details[10].correct, false);
  assert.equal(result.details[12].correct, false);
});

test("option-only student answers match full answer text in A2-5.14", () => {
  const referenceEntry = {
    assignmentKey: "A2-5.14",
    answers: {
      teil3: {
        Answer1: "B) Die Kollegen und die Arbeit",
        Answer2: "C) Mit „Sie“",
        Answer3: "C) Eine Arbeitnehmervertretung",
        Answer4: "C) Arbeitskleidung, Pausen und feste Arbeitszeiten",
        Answer5: "C) Man kann Arbeitsbeginn und -ende flexibel wählen",
        Answer6: "C) 38–40 Stunden",
        Answer7: "B) Den Urlaub eintragen und genehmigen lassen",
      },
      teil4: {
        Answer1: "D) Weiter das Gehalt oder den Lohn",
        Answer2: "C) Sofort den Arbeitgeber informieren und zum Arzt gehen",
        Answer3: "C) Auf der Baustelle oder am Flughafen",
        Answer4: "C) Die Kündigung schriftlich und mit Frist einreichen",
        Answer5: "C) In der Volkshochschule",
      },
    },
  };

  const result = computeObjectiveScore(referenceEntry, `
Lieber Felix,
ich hoffe, es geht dir gut.
Viele Grüße
Fred

Lesen
1. b
2. c
3. c
4. c
5. c
6. c
7. b
8. d
9. c
10. c
11. c
12. c
  `);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  assert.equal(Object.values(result.details).filter((detail) => !detail.correct).length, 0);
});

test("A1-4 blank-line separated objective blocks ignore first numbered writing block", () => {
  const result = computeObjectiveScore("A1-4", `
1) Ich komme aus Deutschland. Ich spreche Deutsch.
2) Sie kommt aus Frankreich. Sie spricht Französisch
3) Sie kommen aus Russland. Sie sprechen Russisch
4) Wir kommen aus Japan. Wir sprechen Japanisch.
5) Er kommt aus England.Er spricht Englisch.



1) C
2) B
3) D
4) A
5) C
6) D
7) C


1) C
2) C
3) B
4) B
5) Barcelona oder Madrid
  `);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 10);
  assert.equal(result.details[6].student, "D");
  assert.equal(result.details[6].correct, false);
  assert.equal(result.details[12].student, "Barcelona oder Madrid");
  assert.equal(result.details[12].correct, false);
});
test("A1-5 flat text answer key supports restarted numbering across Teil sections", () => {
  const result = computeObjectiveScore("A1-5", `
Teil 1
1.Der Tisch=the table
2.Die Lampe=the lamp
3.Das Buch=the book
4.Der Stuhl=the chair
5.Die Katze= the cat
6.Das Auto= the car
7.Der Hund=the dog
8.Die Blume=the flower
9.Das Fenster=the window
10.Der Computer =the Computer

Teil 2
1.Der Tisch ist groß.
2.Die Lampe ist neu.
3.Das Buch ist interessant.
4.Der Stuhl ist bequem.
5.Die Katze ist süß.
6.Das Auto ist schnell.
7.Der Hund ist freundlich.
8.Die Blume ist schön.
9.Das Fenster ist offen.
10.Der Computer ist teuer.

Teil 3
1.Ich sehe den Tisch.
2.Sie kauft die Lampe.
3.Er liest das Buch.
4.Wir brauchen den Stuhl.
5.Du fütterst die Katze.
6.Ich fahre das Auto.
7.Sie streichelt den Hund.
8.Er pflückt die Blume.
9.Wir putzen das Fenster.
10.Sie benutzen den Computer.
  `);

  assert.equal(result.totalCount, 30);
  assert.equal(result.correctCount, 30);
  assert.equal(Object.values(result.details).filter((detail) => !detail.correct).length, 0);
});

test("A1-5 flat text answer key accepts an unnumbered first answer in a restarted Teil section", () => {
  const result = computeObjectiveScore("A1-5", `
Teil 1
1.der Tisch = the table
2.die Lampe = the lamp
3.das Buch = the book
4.der Stuhl = the chair
5.die Katze = the cat
6.das Auto = the car
7.der Hund = the dog
8.die Blume = the flower
9.das Fenster = the window
10.der Computer = the computer

Teil 2
1.Der Tisch ist groß.
2.Die Lampe ist neu.
3.Das Buch ist interessant.
4.Der Stuhl ist bequem.
5.Die Katze ist süß.
6.Das Auto ist schnell.
7.Der Hund ist freundlich.
8.Die Blume ist schön.
9.Das Fenster ist offen.
10.Der Computer ist teuer.

Teil 3
${"\u00a0"}Ich sehe den Tisch.
2. Sie kauft die Lampe.
3. Er liest das Buch.
4. Wir brauchen den Stuhl.
5. Du fütterst die Katze.
6. Ich fahre das Auto.
7. Sie streichelt den Hund.
8. Er pflückt die Blume.
9. Wir putzen das Fenster.
10. Sie benutzen den Computer.
  `);

  assert.equal(result.totalCount, 30);
  assert.equal(result.correctCount, 30);
  assert.equal(result.details[21].student, "Ich sehe den Tisch.");
  assert.equal(Object.values(result.details).filter((detail) => !detail.correct).length, 0);
});

test("A2-4.11 choices keep explicit option letters before F-leading German answer text", () => {
  const result = computeObjectiveScore("A2-4.11", `
LESEN
1. B
2. B
3. A
4. B
5. B
6. A
7. B

HÖREN
1. B
2. B
3. B
4. C
5. B

SCHREIBEN
Sehr geehrte Damen und Herren,
ich möchte ein Auto mieten.
  `);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  assert.equal(result.details["teil3.4"].expected, "B");
  assert.equal(result.details["teil3.4"].correct, true);
  assert.equal(result.details["teil4.4"].expected, "C");
  assert.equal(result.details["teil4.4"].correct, true);
});
