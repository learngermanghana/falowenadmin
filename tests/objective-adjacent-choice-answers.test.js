import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const referenceEntry = {
  assignmentKey: "B1-2.5-adjacent-choice-test",
  expectedParts: ["Teil 2", "Teil 3", "Teil 4"],
  writingParts: ["Teil 2"],
  parts: {
    "Teil 3": {
      answers: ["B) Am Samstag um 14:00 Uhr", "B) Hell und geraumig", "B) Die Badewanne", "B) Zwei Monatsmieten", "A) Ab dem ersten des nachsten Monats", "B) Ein Jahr", "C) Sie entschied sich, die Wohnung zu mieten"],
    },
    "Teil 4": {
      answers: ["A) Am fruhen Morgen", "B) Der Vermieter spart Zeit", "B) Auf das Umfeld und die Nachbarschaft", "C) Weil die Wohnung schnell vergeben sein konnte", "B) Gehaltsnachweise und Mieterselbstauskunft"],
    },
  },
};

test("compact adjacent objective choices such as 1B are parsed within each part", () => {
  const submission = `Teil 2 : Schreiben

Sehr geehrte Damen und Herren,
ich interessiere mich für die Wohnung.

Teil 3
1B   2B  3B  4B  5A  6B  7C

Teil 4
1A  2B  3B  4C  5B`;

  const result = computeObjectiveScore(referenceEntry, submission);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  assert.deepEqual(Object.values(result.details).map(({ student }) => student), ["B", "B", "B", "B", "A", "B", "C", "A", "B", "B", "C", "B"]);
});

test("embedded identifiers such as Zimmer 2B are not parsed as another answer", () => {
  const embeddedIdentifierReference = {
    assignmentKey: "embedded-identifier-test",
    expectedParts: ["Teil 3"],
    parts: {
      "Teil 3": {
        answers: ["Zimmer 2B", "B) Zweite Antwort"],
      },
    },
  };

  const result = computeObjectiveScore(embeddedIdentifierReference, `Teil 3
1: Zimmer 2B`);

  assert.equal(result.totalCount, 2);
  assert.equal(result.correctCount, 1);
  assert.equal(result.details["teil3.1"].student, "Zimmer 2B");
  assert.equal(result.details["teil3.2"].student, "");
});
