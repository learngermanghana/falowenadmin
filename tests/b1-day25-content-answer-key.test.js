import test from "node:test";
import assert from "node:assert/strict";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { getB1WritingTaskSpec } from "../src/data/b1WritingTaskSpecs.js";
import { evaluateB1WritingTaskEvidence } from "../src/utils/b1WritingTaskEvidence.js";
import { getA2B1WritingRequirement } from "../src/utils/a2B1WritingCadence.js";
import { validateAnswerEntry } from "../src/utils/answerKeyIntegrity.js";

const [label, entry] = Object.entries(dictionary).find(([, row]) => row.assignment_id === "B1-8.25");

test("B1 Day 25 key has the exact new seven Lesen answers", () => {
  const expected = ["B","C","B","B","B","C","B"];
  assert.deepEqual(Object.values(entry.answers.teil3).map(x => x[0]), expected);
  assert.deepEqual(entry.expectedParts, ["teil2","teil3","teil4"]);
  assert.deepEqual(entry.writingParts, ["teil2"]);
  assert.deepEqual(entry.aiGradedParts, ["teil2"]);
  assert.equal(entry.partGrading.teil2.gradingMode, "ai_written_response");
  assert.equal(getA2B1WritingRequirement({level:"B1",assignmentKey:"B1-8.25"}), true);
  assert.equal(validateAnswerEntry(label,entry).errors.length,0);
});

test("B1 Day 25 five Richtig/Falsch Hören answers match the updated workbook", () => {
  assert.deepEqual(Object.values(entry.answers.teil4).map(x => x[0]), ["A","B","A","B","A"]);
  assert.ok(entry.expectedParts.includes("teil4"));
  assert.ok(entry.referenceAnswerParts.includes("teil4"));
  assert.equal(entry.partGrading.teil4.gradingMode, "answer_key");
});

test("B1 Day 25 writing is the formal ElectroWorld complaint", () => {
  const spec=getB1WritingTaskSpec("B1-8.25");
  assert.equal(spec.textType,"formal_email");
  assert.equal(spec.register,"formal");
  assert.equal(spec.taskPoints.length,3);
  const answer="Sehr geehrte Damen und Herren, am 20. Oktober habe ich ein Tablet mit der Bestellnummer 12345 bestellt. Leider ist das Gerät beschädigt angekommen. Deshalb bitte ich um eine Ersatzlieferung. Vielen Dank. Mit freundlichen Grüßen";
  const evidence=evaluateB1WritingTaskEvidence(spec,answer);
  assert.equal(evidence.length,3);
  assert.ok(evidence.every(x=>x.status==="met"), JSON.stringify(evidence));
  const obsolete = evaluateB1WritingTaskEvidence(spec,"Meiner Meinung nach ist Online-Shopping praktisch, aber es gibt Risiken.");
  assert.ok(obsolete.every(x=>x.status!=="met"), "the old forum answer must not pass the updated complaint task");
});
