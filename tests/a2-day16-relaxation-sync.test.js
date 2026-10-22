import test from "node:test";
import assert from "node:assert/strict";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { evaluateWritingTaskEvidence } from "../src/utils/writingTaskEvidence.js";
import { getA2WorkbookAlignedSlideDay16To20 } from "../src/data/a2WorkbookAlignedSlidesDays16To20.js";

const entry = Object.values(dictionary).find(value => value.assignment_id === "A2-6.16");

test("A2 Day 16 retains its five reading answers but uses the newly approved Lena-Max Hören 5/5 key", () => {
  assert.ok(entry);
  assert.deepEqual(Object.values(entry.answers.teil3).map(text => text.slice(0, 1)), ["B", "C", "D", "A", "C"]);
  assert.deepEqual(Object.values(entry.answers.teil4).map(text => text.slice(0, 1)), ["B", "A", "C", "B", "A"]);
  assert.deepEqual(entry.expectedParts, ["teil2", "teil3", "teil4"]);
  assert.deepEqual(entry.writingParts, ["teil2"]);
  assert.deepEqual(entry.referenceAnswerParts, ["teil3", "teil4"]);
  assert.match(entry.partGrading.teil2.instruction, /Markus/);
  assert.doesNotMatch(entry.partGrading.teil2.instruction, /appointment|insurance/i);
});

test("A2 Day 16 writing task is a 20–30-word informal relaxation invitation to Markus, never doctor letter", () => {
  const task = getA2WritingTaskSpec("A2-6.16");
  assert.equal(task.textType, "informal_email");
  assert.equal(task.register, "informal");
  assert.equal(task.recipient, "friend_or_personal_contact");
  assert.match(task.taskText, /20–30 Wörter/);
  assert.match(task.taskText, /Markus/);
  assert.deepEqual(task.taskPoints, [
    "Name a relaxing activity you do",
    "Explain why that activity helps you relax",
    "Invite Markus to relax together next weekend",
  ]);
  assert.doesNotMatch(JSON.stringify(task), /Arzt|appointment|insurance|examinations/);
});

test("Markus sample fulfills three real writing points, never the old doctor rubric", () => {
  const task = getA2WritingTaskSpec("A2-6.16");
  const sample = [
    "Lieber Markus,",
    "zur Entspannung gehe ich im Park spazieren, weil ich danach ruhig bin.",
    "Hast du Lust, nächstes Wochenende mitzukommen?",
    "Viele Grüße",
    "Anna",
  ].join("\n");
  assert.equal(sample.trim().split(/\s+/).length, 23);
  const verdict = evaluateWritingTaskEvidence(task, sample);
  assert.deepEqual(verdict.map(point => point.status), ["met", "met", "met"]);
  assert.equal(evaluateWritingTaskEvidence(task, sample.replace("Hast du Lust, nächstes Wochenende mitzukommen?", "Bis bald!"))[2].status, "missing");
});

test("teacher slide task copy matches the new student workbook and listening story", () => {
  const slide = getA2WorkbookAlignedSlideDay16To20("A2-6.16");
  const writing = slide.workbookConnection.parts.find(p => p.label === "Teil 2 · Schreiben");
  const listening = slide.workbookConnection.parts.find(p => p.label === "Teil 4 · Hören");
  assert.match(writing.detailEn, /Markus/);
  assert.match(listening.detailEn, /Lena and Max/);
  assert.doesNotMatch(writing.detailEn, /doctor/);
});
