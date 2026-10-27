import test from "node:test";
import assert from "node:assert/strict";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { getB1WritingTaskSpec } from "../src/data/b1WritingTaskSpecs.js";
import { evaluateB1WritingTaskEvidence } from "../src/utils/b1WritingTaskEvidence.js";
import { validateAnswerEntry } from "../src/utils/answerKeyIntegrity.js";

const [label, entry] = Object.entries(dictionary).find(([, row]) => row.assignment_id === "B1-9.26");

test("B1 Day 26 Lesen has all seven Vienna travel advertisement answers", () => {
  assert.deepEqual(Object.values(entry.answers.teil3).map((answer) => answer[0]), ["A", "B", "X", "D", "E", "F", "H"]);
  assert.equal(Object.keys(entry.answers.teil3).length, 7);
  assert.deepEqual(entry.expectedParts, ["teil2", "teil3", "teil4"]);
  assert.deepEqual(entry.writingParts, ["teil2"]);
  assert.deepEqual(entry.aiGradedParts, ["teil2"]);
  assert.deepEqual(entry.referenceAnswerParts, ["teil3", "teil4"]);
  assert.match(entry.partGrading.teil3.instruction, /seven Anzeigen/);
  assert.equal(validateAnswerEntry(label, entry).errors.length, 0);
});

test("B1 Day 26 still marks five Hören items A B B B A", () => {
  assert.deepEqual(Object.values(entry.answers.teil4).map((answer) => answer[0]), ["A", "B", "B", "B", "A"]);
  assert.equal(entry.partGrading.teil4.gradingMode, "answer_key");
  assert.match(entry.partGrading.teil4.instruction, /b1\/day-26\/day-26\.mp3/);
});

test("B1 Day 26 evaluates the formal Vienna trip inquiry, not the superseded Markus essay", () => {
  const task = getB1WritingTaskSpec("B1-9.26");
  assert.equal(task.textType, "formal_email");
  assert.equal(task.register, "formal");
  assert.equal(task.recipient, "customer_service");
  assert.equal(task.taskPoints.length, 3);
  assert.match(task.taskText, /TraumReisen GmbH/);
  assert.match(task.taskText, /40–50/);
  assert.doesNotMatch(task.taskText, /Markus/i);
  assert.match(entry.partGrading.teil2.instruction, /FORMAL/);

  const complete = "Sehr geehrte Damen und Herren, ich interessiere mich für die Städtereise nach Wien. Bitte informieren Sie mich über die Reisedaten, die Hotelkategorie und die Ausflüge. Können Sie mir ein verbindliches Angebot zusenden? Mit freundlichen Grüßen, Leo";
  assert.deepEqual(evaluateB1WritingTaskEvidence(task, complete).map((point) => point.status), ["met", "met", "met"]);

  const oldEssay = "Meiner Meinung nach sollte man trotz Verspätungen reisen. Ich habe meinen Koffer verloren. Man sollte früher planen und den Kundenservice kontaktieren.";
  assert.deepEqual(evaluateB1WritingTaskEvidence(task, oldEssay).map((point) => point.status), ["missing", "missing", "missing"]);
});
