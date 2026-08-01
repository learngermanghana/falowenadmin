import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const marySubmission = `1, B
2,B
3,B
4, C
5, C

1.  B
2. A
3. B
4. B

1) Falsch
2) Falsch
3) Falsch
4) Richtig
5) Falsch.`;

function wrongKeys(result) {
  return Object.entries(result.details)
    .filter(([, detail]) => detail.correct === false)
    .map(([key]) => key);
}

test("A1-12.1 does not borrow a missing answer from a later restarted block", () => {
  const result = computeObjectiveScore("A1-12.1", marySubmission);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 8);
  assert.equal(result.details["teil2.5"].student, "");
  assert.equal(result.details["teil2.5"].correct, false);
  assert.equal(result.details["teil3.5"].student, "Falsch.");
  assert.deepEqual(wrongKeys(result), [
    "teil1.2",
    "teil2.2",
    "teil2.5",
    "teil3.1",
    "teil3.2",
    "teil3.3",
    "teil3.5",
  ]);
});

test("an explicitly labelled Teil 3 remains authoritative when Teil 1 and Teil 2 are omitted", () => {
  const referenceEntry = {
    parts: {
      teil1: { answers: { Answer1: "A", Answer2: "B", Answer3: "C", Answer4: "A", Answer5: "B" } },
      teil2: { answers: { Answer1: "B", Answer2: "C", Answer3: "A", Answer4: "C", Answer5: "A" } },
      teil3: {
        answers: {
          Answer1: "C) Im Moment ist vieles neu für sie.",
          Answer2: "B) Für neue Studenten eine Stadtführung gemacht.",
          Answer3: "C) Kocht jeder einmal für die anderen.",
          Answer4: "B) Deutsch zu sprechen.",
          Answer5: "C) Übernachtet Sonja in Marios Zimmer.",
        },
      },
    },
  };

  const result = computeObjectiveScore(referenceEntry, `TEIL 3

1-C   2-A   3-C   4-B   5-C`);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 4);
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((question) => result.details[`teil1.${question}`].student),
    ["", "", "", "", ""],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((question) => result.details[`teil2.${question}`].student),
    ["", "", "", "", ""],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((question) => result.details[`teil3.${question}`].student),
    ["C", "A", "C", "B", "C"],
  );
  assert.deepEqual(wrongKeys(result), [
    "teil1.1",
    "teil1.2",
    "teil1.3",
    "teil1.4",
    "teil1.5",
    "teil2.1",
    "teil2.2",
    "teil2.3",
    "teil2.4",
    "teil2.5",
    "teil3.2",
  ]);
});
