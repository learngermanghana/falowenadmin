import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const submission = `Teil 1
1. B) Um Viertel vor sieben
2.b) Um halb acht
3.c) Um Viertel nach acht
4.b) Am Dienstag und Donnerstag
5.a) Um Viertel vor sieben
6. c) Um Viertel nach sieben
7.b) Um halb zehn

Teil 2
1.b) Um sieben Uhr
2.b) Um acht Uhr
3.b) Um sechs Uhr
4.b) Um zehn Uhr
5.a) Sie geht zur Arbeit.`;

test("A1-7 keeps restarted Hören numbering after seven Lesen answers", () => {
  const result = computeObjectiveScore("A1-7", submission);

  assert.equal(result.totalCount, 17);
  assert.equal(result.correctCount, 11);

  assert.equal(result.details["teil1.7"].student, "b) Um halb zehn");
  assert.equal(result.details["teil1.7"].correct, false);

  assert.equal(result.details["teil2.1"].student, "b) Um sieben Uhr");
  assert.equal(result.details["teil2.1"].correct, true);
  assert.equal(result.details["teil2.2"].student, "b) Um acht Uhr");
  assert.equal(result.details["teil2.2"].correct, true);
  assert.equal(result.details["teil2.3"].student, "b) Um sechs Uhr");
  assert.equal(result.details["teil2.3"].correct, true);
  assert.equal(result.details["teil2.4"].student, "b) Um zehn Uhr");
  assert.equal(result.details["teil2.4"].correct, true);
  assert.equal(result.details["teil2.5"].student, "a) Sie geht zur Arbeit.");
  assert.equal(result.details["teil2.5"].correct, true);

  for (const question of [6, 7, 8, 9, 10]) {
    assert.equal(result.details[`teil2.${question}`].student, "");
    assert.equal(result.details[`teil2.${question}`].correct, false);
  }
});

test("A1-7 marks all seven Lesen and ten Hören answers against the revised key", () => {
  const complete = submission.replace("7.b) Um halb zehn", "7.a) Um Viertel nach neun") + `
6.b) Um neun Uhr
7.b) Er geht in die Bibliothek
8.b) Bis zwei Uhr nachmittags
9.b) Um drei Uhr nachmittags
10.b) Um sieben Uhr`;
  const result = computeObjectiveScore("A1-7", complete);
  assert.equal(result.totalCount, 17);
  assert.equal(result.correctCount, 17);
});

const letterSection = (part, letters) => `Teil ${part}\n` + [...letters].map((letter, i) => `${i + 1}. ${letter}`).join("\n");

test("A1-7 never swaps Lesen and Hören to improve a score", () => {
  const lesen = letterSection(1, "CCABCBB");
  const horen = letterSection(2, "BBACACCCCC");
  for (const submission of [`${lesen}\n\n${horen}`, `${horen}\n\n${lesen}`]) {
    const result = computeObjectiveScore("A1-7", submission);
    assert.equal(result.totalCount, 17);
    assert.equal(result.correctCount, 4);
    assert.equal(result.details["teil1.1"].student, "C");
    assert.equal(result.details["teil2.1"].student, "B");
  }
});
