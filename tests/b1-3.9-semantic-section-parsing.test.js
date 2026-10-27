import test from "node:test";
import assert from "node:assert/strict";

import { checkDeterministicObjectiveAnswers, splitSubmissionIntoParts } from "../src/utils/autoMarking.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { parseSubmissionSections } from "../src/utils/submissionSections.js";

const submission = `Teil 2 · Schreiben 
Work-Life-Balance im modernen Arbeitsumfeld

Heutzutage ist das Thema Work-Life-Balance sehr wichtig. Ich bin der Meinung, dass flexible Arbeitsmodelle hilfreich sind, weil sie mehr Zeit für Familie und Erholung schaffen.
Einerseits spart man im Homeoffice den Arbeitsweg. Mit flexiblen Arbeitszeiten kann man den Tag besser planen, um mehr Freizeit zu haben. Andererseits kann die Grenze zwischen Arbeit und Privatleben verschwinden. Manche Menschen beantworten abends E-Mails, ohne richtig abzuschalten.
Ich arbeite als Dozentin im Büro. Das finde ich praktisch, weil ich Arbeit und Privatleben klar trennen kann. Nach Feierabend verbringe ich Zeit mit meinem Sohn.
In meinem Land Tansania arbeiten viele Menschen lange und machen kaum Pausen. Manche arbeiten von Januar bis Dezember, ohne Urlaub zu machen. Sie konzentrieren sich stark auf das Geldverdienen. Dabei vergessen sie manchmal ihre Familie und ihre Gesundheit.
Zusammenfassend ist eine gute Work-Life-Balance möglich, wenn Arbeitgeber und Beschäftigte klare Arbeitszeiten festlegen.

Teil 2 · Lesen 1B · 2C · 3A · 4B · 5C · 6B · 7B

Teil 2 · Hören 1B · 2C · 3A · 4B · 5B`;

const smartMarkingReference = {
  level: "B1",
  assignmentKey: "B1-3.9",
  format: "objective",
  answers: {
    teil3: {
      Answer1: "B) Zeitdruck und hohe Erwartungen",
      Answer2: "C) Herzprobleme und Bluthochdruck",
      Answer3: "A) Regelmäßige Bewegung",
      Answer4: "B) Sie liefert dem Körper die nötigen Nährstoffe",
      Answer5: "C) Den Körper und Geist zu entspannen",
      Answer6: "B) Sie tragen zum Wohlbefinden bei",
      Answer7: "B) Auf die Signale des Körpers hören, frühzeitig Maßnahmen ergreifen",
    },
    teil4: {
      Answer1: "B) Realistische Ziele setzen",
      Answer2: "C) Sie verbessert die Stimmung",
      Answer3: "A) Sie beruhigen Körper und Geist",
      Answer4: "B) Weil er den Körper regeneriert",
      Answer5: "B) Sie helfen, das Wohlbefinden zu steigern",
    },
  },
};

test("semantic Lesen and Hören labels override a stale Teil 2 prefix", () => {
  const sections = parseSubmissionSections(submission);

  assert.deepEqual(sections.map((section) => section.partId), ["teil2", "teil3", "teil4"]);
  assert.equal(sections[1].text, "1B 2C 3A 4B 5C 6B 7B");
  assert.equal(sections[2].text, "1B 2C 3A 4B 5B");
});

test("B1-3.9 browser deterministic parser marks compact Lesen and Hören answers", () => {
  const result = computeObjectiveScore("B1-3.9", submission);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  assert.equal(result.details["teil3.1"].student, "B");
  assert.equal(result.details["teil3.7"].student, "B");
  assert.equal(result.details["teil4.1"].student, "B");
  assert.equal(result.details["teil4.5"].student, "B");
  assert.ok(Object.values(result.details).every((detail) => detail.correct));
});

test("B1-3.9 smart marking service parser also returns 12/12 for the exact workbook paste", () => {
  const result = checkDeterministicObjectiveAnswers({
    referenceEntry: smartMarkingReference,
    submissionText: submission,
  });

  assert.ok(result);
  assert.equal(result.objectiveTotal, 12);
  assert.equal(result.objectiveCorrect, 12);
  assert.equal(result.objectiveScore, 100);
  assert.deepEqual(result.wrongAnswers, []);
  assert.deepEqual(
    result.detectedParts.map(({ partId, correct, total }) => ({ partId, correct, total })),
    [
      { partId: "teil3", correct: 7, total: 7 },
      { partId: "teil4", correct: 5, total: 5 },
    ],
  );
});

test("smart marking keeps legacy Teil 2. Lesen Sie prompts as Teil 2", () => {
  const parts = splitSubmissionIntoParts(`Teil 2. Lesen Sie den Text und schreiben Sie Ihre Meinung.\nIch finde das Thema wichtig.`);
  assert.equal(parts[0]?.partId, "teil2");
});
