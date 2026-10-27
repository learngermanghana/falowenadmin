import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const referenceEntry = {
  assignmentKey: "A1-12.2",
  format: "objective",
  expectedParts: ["teil1", "teil2", "teil3"],
  answers: {
    "Teil 1": {
      Answer1: "In Berlin",
      Answer2: "Mit seiner Frau und seinen drei Kindern",
      Answer3: "Mit seinem Auto",
      Answer4: "Um 7:30 Uhr",
      Answer5: "a) Barzahlung (cash)",
    },
    "Teil 2": {
      Answer1: "B) Um 9:00 Uhr",
      Answer2: "B) Um 12:00 Uhr",
      Answer3: "B) Um 18:00 Uhr",
      Answer4: "B) Um 21:00 Uhr",
      Answer5: "D) Alles Genannte",
    },
    "Teil 3": {
      Answer1: "B) Um 9 Uhr",
      Answer2: "B) Um 12 Uhr",
      Answer3: "A) ein Computer und ein Drucker",
      Answer4: "C) in einer Bar",
      Answer5: "C) bar",
    },
  },
};

const submission = `TEIL 1.

1.Berlin
2.seine Frau und 3 kinder
3.Er fährt mit dem Auto zur Arbeit
4.Er beginnt um 7.30 uhr zu arbeiten
5.ich gehe zur schule

TEIL 2.

1.Um 9.00 uhr
2.um 12.00 uhr
3.um 18.00 uhr
4.um 21.00 uhr
5.Bürobedarf für eine prodoktive Arbeitsumgebung

TEIL 3.

1.UM 9.00 uhr
2.um 12.00 uhr
3.computer und ein Telefon
4.in einem Aktenschrank
5.bar`;

test("A1-12.2 accepts concise semantic fill-in answers", () => {
  const result = computeObjectiveScore(referenceEntry, submission);
  const wrong = Object.entries(result.details)
    .filter(([, detail]) => !detail.correct)
    .map(([key]) => key);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 11);
  assert.equal(result.details["teil1.2"].correct, true);
  assert.equal(result.details["teil1.3"].correct, true);
  assert.deepEqual(wrong, ["teil1.5", "teil2.5", "teil3.3", "teil3.4"]);
});
