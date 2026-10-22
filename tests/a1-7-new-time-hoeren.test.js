import test from "node:test";
import assert from "node:assert/strict";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { computeObjectiveScore, selectVersionedObjectiveReferenceEntry } from "../src/utils/objectiveMarking.js";

const entry = Object.values(dictionary).find(x => x.assignment_id === "A1-7");

test("A1-7 current five Lesen and five Hören answers are exactly B-B-C-B-A", () => {
  assert.ok(entry);
  assert.equal(entry.listeningVersion, "A1-7-HOEREN-V3");
  assert.deepEqual(Object.values(entry.answers["Teil 1"]), ["Falsch", "Richtig", "Richtig", "Richtig", "Falsch"]);
  assert.deepEqual(Object.values(entry.answers["Teil 2"]), [
    "B) Um 16:00 Uhr", "B) Um 6:30 Uhr", "C) Er sieht fern.",
    "B) Um 18:00 Uhr", "A) Tom holt Anna ab.",
  ]);
  assert.deepEqual(entry.expectedParts, ["teil1", "teil2"]);
});

const newText = [
  "TEIL 1", "A1-7-READING-V2", "A1-7-HOEREN-V3",
  "1. Falsch", "2. Richtig", "3. Richtig", "4. Richtig", "5. Falsch",
  "", "TEIL 2", "1. B", "2. B", "3. C", "4. B", "5. A",
].join("\n");

test("current A1-7 student work scores 10/10 using new versioned listening", () => {
  const result = computeObjectiveScore("A1-7", newText);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
  assert.deepEqual([1,2,3,4,5].map(i => result.details["teil2." + i].student), ["B","B","C","B","A"]);
});

test("old A1-7 reading-v2 submissions keep their historic Hören reference", () => {
  const oldText = [
    "TEIL 1", "A1-7-READING-V2", "1. Falsch", "2. Richtig", "3. Richtig", "4. Richtig", "5. Falsch",
    "", "TEIL 2", "1. Richtig", "2. Falsch", "3. Richtig", "4. B", "5. A",
  ].join("\n");
  const oldReference = selectVersionedObjectiveReferenceEntry(entry, oldText, "A1-7");
  assert.equal(oldReference.answers["Teil 2"].Answer1, "Richtig");
  assert.equal(oldReference.answers["Teil 2"].Answer4, "B) Um sechs Uhr");
  const result = computeObjectiveScore("A1-7", oldText);
  assert.equal(result.totalCount, 10);
  assert.equal(result.correctCount, 10);
});

test("A1-7 new listening answers are not accepted just for matching an old option letter", () => {
  const wrong = computeObjectiveScore("A1-7", newText.replace(
    "1. B\n2. B\n3. C\n4. B\n5. A", "1. A\n2. A\n3. A\n4. A\n5. B",
  ));
  assert.equal(wrong.totalCount, 10);
  assert.equal(wrong.correctCount, 5);
});
