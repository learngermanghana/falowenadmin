import test from "node:test";
import assert from "node:assert/strict";
import { computeObjectiveScore, selectVersionedObjectiveReferenceEntry } from "../src/utils/objectiveMarking.js";

const reading = `TEIL 2
1. C
2. B
3. D
4. A
5. C
6. B
7. C`;

const oldListening = `TEIL 3
1. C
2. C
3. B
4. B
5. A`;

const currentListening = `TEIL 3
A1-4-LISTENING-V2
1. A
2. B
3. B
4. A
5. B`;

test("old A1-4 listening work is graded against its original travel dialogue", () => {
  const result = computeObjectiveScore("A1-4", `${reading}\n\n${oldListening}`);
  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  assert.equal(result.details["8"]?.expected, "C");
});

test("tagged A1-4 submissions use five country/origin listening choices", () => {
  const result = computeObjectiveScore("A1-4", `${reading}\n\n${currentListening}`);
  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  assert.equal(result.details["teil3.1"]?.expected, "A");
  assert.equal(result.details["teil3.5"]?.expected, "B");
  assert.equal(Object.keys(result.details).filter(key => key.startsWith("teil3.")).length, 5);
});

test("the version tag overrides a stale cloud answer-key reference", () => {
  const selected = selectVersionedObjectiveReferenceEntry({
    assignmentKey: "A1-4",
    answers: { Answer1: "C", Answer2: "C" },
    rawAnswers: { Answer1: "C", Answer2: "C" },
  }, `${reading}\n\n${currentListening}`, "A1-4");
  assert.equal(selected.answers["Teil 3"].Answer1, "A) Aus Spanien");
  assert.equal(selected.answers["Teil 3"].Answer5, "B) Fußball spielen und Musik hören");
});
