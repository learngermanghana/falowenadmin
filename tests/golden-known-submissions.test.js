import test from "node:test";
import assert from "node:assert/strict";
import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const a112Submission = `
1. b) Ärztin
2. a) Weil sie keine Zeit hat.
3. b) Um 8 Uhr
4. c) Viele verschiedene Fächer
5. c) Einen Sprachkurs besuchen
Q2. 1. b) Falsch
2. b) Falsch
3. b) Falsch
4. b) Falsch
5. b) Falsch
Q3.1 1. a) Richtig
2. b) Falsch
3. a) Richtig
4. b) Falsch
5. Richtig
`;

test("golden A1-12.1 Q-section submission scores 13 of 15", () => {
  const result = computeObjectiveScore("A1-12.1", a112Submission);
  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 13);
  assert.equal(result.details["teil3.2"].correct, false);
  assert.equal(result.details["teil3.4"].correct, false);
});

const joshA112Submission = `Teil 1
Q1. Ich heiße Anna
Q2. Ich heißt Max
Q3. Er heißt Peter
Q4. Wir kommen aus Italien
Q5. Ihr komme aus Brasilien
Q6. Sie kommt aus Russland
Q7. Ich wohne in Berlin
Q8. Du wohnst in Madrid
Q9. Sie wohnen in Wien(formal Sie)

Tiel 2.
Guten Tag, ich heiße Josh. Ich komme aus Ghana, ich wohne in Accra.

Tiel 3.
Q1.A
Q2.C
Q3.D
Q4.B
Q5.A`;

test("golden A1-1.2 keeps subject-verb grammar strict from committed metadata", () => {
  const result = computeObjectiveScore("A1-1.2", joshA112Submission);
  assert.equal(result.totalCount, 14);
  assert.equal(result.correctCount, 11);
  assert.equal(result.details[2].correct, false);
  assert.equal(result.details[5].correct, false);
  assert.equal(result.details[9].correct, false);
});

test("A1-3 writing registration is committed in the answer dictionary", () => {
  const entry = Object.values(answersDictionary).find((value) => String(value?.assignment_id || value?.assignmentId || "").toUpperCase() === "A1-3");
  assert.ok(entry);
  assert.deepEqual(entry.expectedParts, ["teil1", "teil2", "teil3"]);
  assert.deepEqual(entry.writingParts, ["teil2"]);
  assert.deepEqual(entry.aiGradedParts, ["teil2"]);
  assert.equal(entry.partGrading?.teil2?.gradingMode, "ai_written_response");
});

const b124Submission = `
Teil 2 · Schreiben
Heutzutage ist die Wohnungssuche besonders in Großstädten sehr schwierig. Ich bin der Meinung, dass persönliche Kontakte hilfreicher sind, weil es weniger Konkurrenz gibt. Einerseits bieten Online-Portale viele Anzeigen, und man kann Wohnungen einfach vergleichen. Andererseits bewerben sich dort sehr viele Menschen. Bei einer Besichtigung in Hamburg waren einmal etwa dreißig Interessenten dabei. Durch persönliche Kontakte erfährt man oft früher von freien Wohnungen. Deshalb glaube ich, dass Kontakte bessere Chancen bieten. Zusammenfassend sollte man beide Methoden nutzen, aber persönliche Kontakte bevorzugen.

Teil 3 · Lesen
1B 2A 3B 4B 5A

Teil 4 · Hören
1B 2C 3B 4B 5B
`;

test("golden B1-2.4 objective submission uses the committed 10-question key", () => {
  const result = computeObjectiveScore("B1-2.4", b124Submission);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
});
