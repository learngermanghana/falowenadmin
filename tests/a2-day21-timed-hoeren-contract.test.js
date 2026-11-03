import test from "node:test";
import assert from "node:assert/strict";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import snapshot from "../src/data/courseMarkingSnapshot.json" with { type: "json" };
import { canonicalCourseReference } from "../src/utils/canonicalCourseReference.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const title = "A2 8.21 Ein Wochenende planen";
const fiveListeningAnswers = [
  "A) Sie hat frisches Obst gekauft.",
  "B) Sie war lange spazieren.",
  "C) Er hat ein Buch gelesen.",
  "A) Weil sie am Freitag das Meeting planen müssen.",
  "B) Um zehn Uhr.",
];

test("A2 Day 21 Hören is a fifth-question graded objective section, never excluded", () => {
  const entry = dictionary[title];
  assert.deepEqual(entry.expectedParts, ["teil2", "teil3", "teil4"]);
  assert.deepEqual(entry.referenceAnswerParts, ["teil3", "teil4"]);
  assert.deepEqual(entry.excludedParts, []);
  assert.equal(entry.partGrading.teil4.gradingMode, "answer_key");
  assert.deepEqual(Object.values(entry.answers.teil4), fiveListeningAnswers);
  assert.deepEqual(snapshot.answerKeys[title].answers.teil4, entry.answers.teil4);
  assert.deepEqual(snapshot.answerKeys[title].answers.teil3, entry.answers.teil3);
});

test("A2 Day 21 recognizes all 10 objective answers and never marks submitted Hören as missing", () => {
  const reference = canonicalCourseReference("A2-8.21");
  assert.ok(reference);
  assert.ok(reference.expectedParts.includes("teil4"));
  assert.equal(reference.excludedParts.includes("teil4"), false);
  const student = [
    "TEIL 3", "1. A", "2. B", "3. B", "4. A", "5. C",
    "TEIL 4", "1. A", "2. B", "3. C", "4. A", "5. B",
  ].join("\n");
  const correct = computeObjectiveScore(reference, student);
  assert.equal(correct.totalCount, 10);
  assert.equal(correct.correctCount, 10);
  const wrong = computeObjectiveScore(reference, student.replace("TEIL 4\n1. A", "TEIL 4\n1. C"));
  assert.equal(wrong.totalCount, 10);
  assert.equal(wrong.correctCount, 9);
});
