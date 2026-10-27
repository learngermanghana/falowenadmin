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

const submission = `1, felix wohnst in Berlin
2, felix wohnt mit seiner Frau und seinen drei kindern
3, felix Fährt mit seinen Auto zur Arbeit
4, felix Arbeitstag beginnt um 7:30uhr
5, Barzahlung.

1. B
2. B
3. B
4. B
5. D.


1) b
2) b
3) c
4) c
5)) c.`;

test("A1-12.2 keeps three restarted answer blocks aligned with Teil 1, Teil 2 and Teil 3", () => {
  const result = computeObjectiveScore(referenceEntry, submission);
  const wrongQuestions = Object.entries(result.details)
    .filter(([, detail]) => !detail.correct)
    .map(([question]) => question);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 14);
  assert.deepEqual(wrongQuestions, ["teil3.3"]);

  assert.equal(result.details["teil1.1"].student, "felix wohnst in Berlin");
  assert.equal(result.details["teil1.4"].correct, true);
  assert.equal(result.details["teil2.5"].student, "D.");
  assert.equal(result.details["teil3.1"].student, "b");
  assert.equal(result.details["teil3.5"].student, "c.");
  assert.equal(result.details["teil3.5"].correct, true);
});
