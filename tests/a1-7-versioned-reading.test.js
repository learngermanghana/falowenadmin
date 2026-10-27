import test from "node:test";
import assert from "node:assert/strict";
import { computeObjectiveScore, selectVersionedObjectiveReferenceEntry } from "../src/utils/objectiveMarking.js";

const listening = `TEIL 2
1. Richtig
2. Falsch
3. Richtig
4. B
5. A`;

test("new A1-7 signs reading scores exactly five plus existing five Hören answers", () => {
  const submission = `TEIL 1
A1-7-READING-V2
1. Falsch
2. Richtig
3. Richtig
4. Richtig
5. Falsch

${listening}`;
  const result = computeObjectiveScore({
    assignmentKey: "A1-7",
    parts: { teil1: { answers: [{ questionKey: "Answer1", correctLetter: "F", correctText: "Falsch" }] } },
    rawAnswers: { "Teil 1": { Answer1: "Falsch" } },
  }, submission);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
});

test("old A1-7 five-choice reading keeps its original reference", () => {
  const text = `TEIL 1
1. B
2. A
3. B
4. C
5. B

${listening}`;
  const selected = selectVersionedObjectiveReferenceEntry({ assignmentKey: "A1-7", rawAnswers: { "Teil 1": { Answer1: "Falsch" } } }, text, "A1-7");
  assert.equal(selected.answers["Teil 1"].Answer1, "B) Zwei Tage");
  assert.equal(selected.rawAnswers, undefined);
  const result = computeObjectiveScore("A1-7", text);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
});
