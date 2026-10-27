import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const A2_4_10_REFERENCE = {
  assignmentKey: "A2-4.10",
  level: "A2",
  expectedParts: ["teil2", "teil3", "teil4"],
  writingParts: ["teil2"],
  aiGradedParts: ["teil2"],
  referenceAnswerParts: ["teil3", "teil4"],
  parts: {
    teil3: {
      answers: {
        Answer1: "B) Die wichtigsten rechtlichen und politischen Regeln",
        Answer2: "C) Man muss Steuern zahlen",
        Answer3: "B) EU-Bürger dürfen bei Kommunalwahlen wählen",
        Answer4: "B) Er vertritt die Interessen von Migranten",
        Answer5: "A) Christlich-orthodox, jüdisch, islamisch, evangelisch, katholisch",
        Answer6: "B) Seit 1. Oktober 2017",
        Answer7: "C) Jeder darf seine Religion frei wählen und ausüben",
      },
    },
    teil4: {
      answers: {
        Answer1: "C) München",
        Answer2: "B) Zwei Wochen",
        Answer3: "B) Brezeln, Bratwurst und Schweinebraten",
        Answer4: "B) Lederhosen und Dirndl",
        Answer5: "B) Fahrgeschäfte und Spiele",
      },
    },
  },
};

const ABIGAIL_SUBMISSION = `Hallo Lilien.
Wie geht es dir? Ich hoffe es geht dir gut.
Ich schreibe dir, denn ich möchte erzählen über eine Fest. Es wird getrunken und getanzt. Es ist besonders weil viele Ausländer zusammen kommen.
Ich möchte dich zur einen Fest einladen.
Das Fest ist am 2. Mai und in Accra.
Könntest du bitte beer und ein weißes T-Shirt mitbringen?
Es wird viele Aktivitäten geben.
Ich freue mich im Voraus auf deine Antwort.
Vielen Grüße,
Abigail.

Hören.
1c,2b,3b,4b,5b.

Lesen.
1b,2c,3b, 4b, 5a,6b,7c.`;

test("A2-4.10 recognises Hören. and Lesen. and scores Abigail 12 of 12", () => {
  const result = computeObjectiveScore(A2_4_10_REFERENCE, ABIGAIL_SUBMISSION);

  assert.equal(result.correctCount, 12);
  assert.equal(result.totalCount, 12);
  assert.equal(Math.round((result.correctCount / result.totalCount) * 100), 100);
  assert.equal(result.details["teil3.1"].student.toLowerCase(), "b");
  assert.equal(result.details["teil3.7"].student.toLowerCase(), "c.");
  assert.equal(result.details["teil4.1"].student.toLowerCase(), "c");
  assert.equal(result.details["teil4.5"].student.toLowerCase(), "b.");

  const wrongKeys = Object.entries(result.details)
    .filter(([, detail]) => detail.correct === false)
    .map(([key]) => key);
  assert.deepEqual(wrongKeys, []);
});

test("numbered Teil headings with full stops remain valid section markers", () => {
  const result = computeObjectiveScore({
    expectedParts: ["teil3", "teil4"],
    parts: {
      teil3: { answers: { Answer1: "B) Lesen" } },
      teil4: { answers: { Answer1: "C) Hören" } },
    },
  }, `Teil 4.\n1c\nTeil 3.\n1b`);

  assert.equal(result.correctCount, 2);
  assert.equal(result.totalCount, 2);
});
