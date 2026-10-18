import test from "node:test";
import assert from "node:assert/strict";
import { computeObjectiveScore, selectVersionedObjectiveReferenceEntry } from "../src/utils/objectiveMarking.js";

const newSubmission = `TEIL 1
A1-6-WORKBOOK-V2
1. Falsch
2. Richtig
3. Richtig
4. Falsch
5. Richtig

TEIL 2
1. B
2. A
3. C
4. B
5. C`;

test("new A1-6 submissions score 10/10 even when registry includes normalized parts and rawAnswers", () => {
  const cloudEntry = {
    assignmentKey: "A1-6",
    parts: { teil1: { answers: [
      { questionKey: "Answer1", correctLetter: "F", correctText: "Falsch" },
      { questionKey: "Answer2", correctLetter: "R", correctText: "Richtig" },
    ] } },
    rawAnswers: {
      "Teil 1": { Answer1: "Falsch", Answer2: "Richtig", Answer3: "Richtig", Answer4: "Falsch", Answer5: "Richtig" },
      "Teil 2": { Answer1: "B", Answer2: "A", Answer3: "C", Answer4: "B", Answer5: "C" },
    },
    totalAnswers: 15,
  };
  const selected = selectVersionedObjectiveReferenceEntry(cloudEntry, newSubmission, "A1-6");
  assert.equal(selected.parts, undefined);
  assert.equal(selected.rawAnswers, undefined);
  assert.equal(selected.totalAnswers, 10);
  const result = computeObjectiveScore(cloudEntry, newSubmission);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
});

test("untagged A1-6 submissions still receive the original 24-answer apartment key", () => {
  const old = selectVersionedObjectiveReferenceEntry({
    assignmentKey: "A1-6",
    parts: { main: { answers: [] } },
    rawAnswers: { Answer1: "Falsch" },
  }, "Teil 1\n1. Das Wohnzimmer – the living room", "A1-6");
  assert.equal(old.totalAnswers, 24);
  assert.equal(Object.keys(old.answers).length, 24);
  assert.equal(old.answers.Answer1, "Das Wohnzimmer – the living room");
  assert.equal(old.parts, undefined);
});
