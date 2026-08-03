import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const referenceEntry = {
  assignmentKey: "A1-5",
  format: "objective",
  answers: {
    Answer1: "Der Tisch – the table",
    Answer2: "Die Lampe – the lamp",
    Answer3: "Das Buch – the book",
    Answer4: "Der Stuhl – the chair",
    Answer5: "Die Katze – the cat",
    Answer6: "Das Auto – the car",
    Answer7: "Der Hund – the dog",
    Answer8: "Die Blume – the flower",
    Answer9: "Das Fenster – the window",
    Answer10: "Der Computer – the computer",
    Answer11: "Der Tisch ist groß",
    Answer12: "Die Lampe ist neu",
    Answer13: "Das Buch ist interessant",
    Answer14: "Der Stuhl ist bequem",
    Answer15: "Die Katze ist süß",
    Answer16: "Das Auto ist schnell",
    Answer17: "Der Hund ist freundlich",
    Answer18: "Die Blume ist schön",
    Answer19: "Das Fenster ist offen",
    Answer20: "Der Computer ist teuer",
    Answer21: "Ich sehe den Tisch",
    Answer22: "Sie kauft die Lampe",
    Answer23: "Er liest das Buch",
    Answer24: "Wir brauchen den Stuhl",
    Answer25: "Du fütterst die Katze",
    Answer26: "Ich fahre das Auto",
    Answer27: "Sie streichelt den Hund",
    Answer28: "Er pflückt die Blume",
    Answer29: "Wir putzen das Fenster",
    Answer30: "Sie benutzen den Computer",
  },
};

const submission = `Q1.der Tisch -the table
2.die Lampe-the lamp
3.das Buch-the book
4.der Stuhl-the chair
5.die Katze-the cat
6.das Auto-the car
7.der Hund-the dog
8.die Blume-the flower
9.das Fenster-the window
10.der Computer-tye computer
Q2.

1. Der Tisch ist groß.
2. Die Lampe ist neu.
3. Das Buch ist interessant.
4. Der Stuhl ist bequem.
5. Die Katze ist süß.
6. Das Auto ist schnell.
7. Der Hund ist freundlich.
8. Die Blume ist schön.
9. Das Fenster ist offen.
10. Der Computer ist teuer.
Q3. 1. Ich sehe den Tisch.
2. Sie kauft die Lampe.
3. Er liest das Buch.
4. Wir brauchen den Stuhl.
5. Du fütterst die Katze.
6. Ich fahre das Auto.
7. Sie streichelt den Hund.
8. Er pflückt die Blume.
9. Wir putzen das Fenster.
10. Sie benutzen den Computer.`;

test("flat A1 objective answers preserve restarted numbering under Q1/Q2/Q3 headings", () => {
  const result = computeObjectiveScore(referenceEntry, submission);
  const wrongQuestions = Object.entries(result.details)
    .filter(([, detail]) => !detail.correct)
    .map(([question]) => question);

  assert.equal(result.totalCount, 30);
  assert.equal(result.correctCount, 29);
  assert.deepEqual(wrongQuestions, ["10"]);
  assert.equal(result.details["11"].student, "Der Tisch ist groß.");
  assert.equal(result.details["21"].student, "Ich sehe den Tisch.");
  assert.equal(result.details["30"].student, "Sie benutzen den Computer.");
});
