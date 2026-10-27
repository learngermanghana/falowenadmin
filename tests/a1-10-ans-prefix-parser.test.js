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

const submissionText = `Teil I

1) Der Autor geht Jeden Tag einkaufen?
Ans Falsch
2) Der Autor kauft im supermarkt obst Gemüse,Brot,milch und Eier.
Ans Falsch
3) Der Autor macht oft eine Einkaufsliste,um Geld zu sparen.
Ans Falsch
4) Der Autor geht gern auf den wochenmark, wei die Atmosphäre schon ist und die pradukte frisch sind
Ans Falsch
5) Letzten Samstag hat der Autor Tomaten,Gurken salat und kartoffein auf dem markt gekauft.
Ans wahr
6) Der verkäufer fragt den kuden ob er noch etwas mÖchte.
Ans Falsch.
7) Der Autor bereitet einen Tomatensalat mit Tomaten zwiebeln,salz, pfeffer und olivenel zu.
Ans wahr

Teil 2

1) Wie oft geht der sprecher einkaufen?
Ans B
2) was hat der sprecher zuerst gekauft?
Ans C
3) wie viele Tomaten hat der sprecher gekauft?
Ans A .
4) was hat dier gesamte Einkauf
Ans B
5) was hat die kassierein dem sprecher gewünscht
Ans B`;

test("A1-10 deterministic parser binds Ans lines, Roman Teil I, and preserves the missing gap", () => {
  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText });

  assert.equal(result.objectiveCorrect, 10);
  assert.equal(result.objectiveTotal, 15);
  assert.equal(result.objectiveScore, 67);
  assert.deepEqual(
    result.wrongAnswers.map(({ question, expected, student }) => ({ question, expected, student })),
    [
      { question: 2, expected: "WAHR", student: "Falsch" },
      { question: 4, expected: "WAHR", student: "Falsch" },
      { question: 8, expected: "FALSCH", student: "" },
      { question: 9, expected: "FALSCH", student: "" },
      { question: 10, expected: "FALSCH", student: "" },
    ],
  );
});
