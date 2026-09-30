import test from "node:test";
import assert from "node:assert/strict";

import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const entryById = (assignmentId) =>
  Object.values(answersDictionary).find((entry) => entry.assignment_id === assignmentId);

const expectedShapes = {
  "A2-1.2": [5, 3],
  "A2-1.3": [5, 5],
  "A2-2.4": [5, 5],
  "A2-2.5": [5, 5],
  "A2-3.6": [5, 5],
  "A2-5.13": [5, 5],
  "A2-5.14": [5, 0],
  "A2-6.15": [5, 5],
  "A2-6.16": [5, 5],
  "A2-7.18": [5, 5],
  "A2-7.20": [5, 5],
  "A2-9.23": [5, 0],
  "A2-9.24": [5, 5],
  "A2-9.25": [5, 0],
  "A2-10.26": [5, 5],
  "A2-10.27": [5, 5],
  "A2-10.28": [5, 5],
};

test("A2 grading keys keep their reviewed canonical assessment shapes", () => {
  for (const [assignmentId, [teil3Count, teil4Count]] of Object.entries(expectedShapes)) {
    const entry = entryById(assignmentId);
    assert.ok(entry, `missing ${assignmentId}`);
    assert.equal(Object.keys(entry.answers?.teil3 || {}).length, teil3Count, `${assignmentId} Teil 3`);
    assert.equal(Object.keys(entry.answers?.teil4 || {}).length, teil4Count, `${assignmentId} Teil 4`);
  }
});


test("A2-9.24 stable Anzeige codes score the restored matching task correctly", () => {
  const result = computeObjectiveScore("A2-9.24", `
Teil 3
1. A
2. B
3. C
4. D
5. C
  `);

  assert.equal(result.correctCount, 5);
  assert.equal(result.totalCount, 5);
});

test("A2-7.18 current 5+5 Lesen and Hören submission scores 10/10", () => {
  const result = computeObjectiveScore("A2-7.18", `
Teil 3
1. A
2. B
3. B
4. C
5. B

Teil 4
1. B
2. B
3. B
4. A
5. D
  `);

  assert.equal(result.correctCount, 10);
  assert.equal(result.totalCount, 10);
  assert.equal(Object.values(result.details).filter((detail) => !detail.correct).length, 0);
  assert.equal(result.details["teil3.1"].expectedDisplay, "A) Donnerstag um 14:00 Uhr");
  assert.equal(result.details["teil3.4"].expectedDisplay, "C) 45 Minuten");
});

test("A2-7.18 accidental September 7+3 submission is remapped to the original 5+5 key", () => {
  const result = computeObjectiveScore("A2-7.18", `
Teil 3
1. B
2. B
3. A
4. C
5. C
6. B
7. A

Teil 4
1. B
2. A
3. B
  `);

  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 8);
  assert.equal(result.details["teil3.1"].student, "B");
  assert.equal(result.details["teil3.2"].student, "F");
  assert.equal(result.details["teil3.3"].student, "B");
  assert.equal(result.details["teil3.4"].student, "D");
  assert.equal(result.details["teil3.5"].student, "A");
  assert.equal(result.details["teil3.5"].correct, false);
  assert.equal(result.details["teil4.1"].student, "B");
  assert.equal(result.details["teil4.2"].student, "A");
  assert.equal(result.details["teil4.2"].correct, false);
  assert.equal(result.details["teil4.3"].student, "B");
  assert.equal(result.details["teil4.4"].student, "A");
  assert.equal(result.details["teil4.5"].student, "D");
});

test("A2-10.28 scores the new five-question Zukunftspläne listening key", () => {
  const result = computeObjectiveScore("A2-10.28", `
Teil 3
1. A
2. B
3. C
4. B
5. B

Teil 4
1. B
2. C
3. A
4. C
5. A
  `);

  assert.equal(result.correctCount, 10);
  assert.equal(result.totalCount, 10);
  assert.equal(result.details["teil4.1"].expected, "B");
  assert.equal(result.details["teil4.5"].expected, "A");
});

test("A2-10.27 restored listening answers are scored instead of treated as missing", () => {
  const result = computeObjectiveScore("A2-10.27", `
Teil 3
1. B
2. B
3. C
4. B
5. B

Teil 4
1. B
2. B
3. B
4. A
  `);

  assert.equal(result.correctCount, 9);
  assert.equal(result.totalCount, 9);
});
