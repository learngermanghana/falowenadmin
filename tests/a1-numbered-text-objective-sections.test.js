import test from "node:test";
import assert from "node:assert/strict";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

test("A1 text answers with Teil (n), repeated numbering, and 1.1 labels are parsed across all sections", () => {
  const referenceEntry = {
    assignmentKey: "A1-5",
    level: "A1",
    format: "objective",
    answers: `Answer1: Der Tisch – the table
Answer2: Die Lampe – the lamp
Answer3: Das Buch – the book
Answer4: Der Stuhl – the chair
Answer5: Die Katze – the cat
Answer6: Das Auto – the car
Answer7: Der Hund – the dog
Answer8: Die Blume – the flower
Answer9: Das Fenster – the window
Answer10: Der Computer – the computer
Answer11: Der Tisch ist groß
Answer12: Die Lampe ist neu
Answer13: Das Buch ist interessant
Answer14: Der Stuhl ist bequem
Answer15: Die Katze ist süß
Answer16: Das Auto ist schnell
Answer17: Der Hund ist freundlich
Answer18: Die Blume ist schön
Answer19: Das Fenster ist offen
Answer20: Der Computer ist teuer
Answer21: Ich sehe den Tisch
Answer22: Sie kauft die Lampe
Answer23: Er liest das Buch
Answer24: Wir brauchen den Stuhl
Answer25: Du fütterst die Katze
Answer26: Ich fahre das Auto
Answer27: Sie streichelt den Hund
Answer28: Er pflückt die Blume
Answer29: Wir putzen das Fenster
Answer30: Sie benutzen den Computer`,
  };

  const submissionText = `DAY( 9)
Teil (1)
1) der Tisch- (j)The table
2) die Lampe- (c) The Lamp
3) das Buch - (g) The book
4) der Stuhl - (e) The chair.
5) die katze - (f) The cat
6) das Auto - (b) The car
7) der Hund - the dog
8) die Blume- (b) The flower
9) das Frenster- The window
10) der computer- the computer

Teil 2
1) der Tisch ist groß.
2) die Lampe ist neu.
3) das Buch ist interessant.
4) der Stuhl ist bequem.
5) die katze ist süß.
6) das Auto ist Schnell
7) der Hund ist freundlich.
8) die Blume ist Schön.
9) das Fenater ist offen.
10) der computer ist teuer.

Teil 3
1.1) Ich sehe das Tisch.
2.2) Sie kauft die Lampe
3.3) Er liest das Buch
4.4) Wir brauchen die Stuhl.
5) Du fütterst die katze.
6) Ich fahre das Auto.
7) Sie streichelt die Hund.
8) Er pflückt die Blume.
9) Wir putzen das Fenster.
10) Sie benutzen der`;

  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText });

  assert.equal(result.objectiveTotal, 30);
  assert.equal(result.objectiveCorrect, 26);
  assert.equal(result.objectiveScore, 87);
  assert.deepEqual(result.wrongAnswers.map((answer) => answer.question), [21, 24, 27, 30]);
  assert.equal(result.missingAnswers.length, 0);
});
