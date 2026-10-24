import test from "node:test";
import assert from "node:assert/strict";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { getB1WritingTaskSpec } from "../src/data/b1WritingTaskSpecs.js";
import { evaluateB1WritingTaskEvidence } from "../src/utils/b1WritingTaskEvidence.js";
import { getA2B1WritingRequirement } from "../src/utils/a2B1WritingCadence.js";
import { validateAnswerEntry } from "../src/utils/answerKeyIntegrity.js";

const [label, entry] = Object.entries(dictionary).find(([, row]) => row.assignment_id === "B1-8.25");

test("B1 Day 25 key has the exact new seven Lesen answers", () => {
  const expected = ["B","B","B","A","A","A","C"];
  assert.deepEqual(Object.values(entry.answers.teil3).map(x => x[0]), expected);
  assert.deepEqual(entry.expectedParts, ["teil2","teil3","teil4"]);
  assert.deepEqual(entry.writingParts, ["teil2"]);
  assert.deepEqual(entry.aiGradedParts, ["teil2"]);
  assert.equal(entry.partGrading.teil2.gradingMode, "ai_written_response");
  assert.equal(getA2B1WritingRequirement({level:"B1",assignmentKey:"B1-8.25"}), true);
  assert.equal(validateAnswerEntry(label,entry).errors.length,0);
});

test("B1 Day 25 seven Hören answers are now scored with the verified recording", () => {
  assert.deepEqual(Object.values(entry.answers.teil4).map(x => x[0]), ["B","C","A","B","A","C","B"]);
  assert.ok(entry.expectedParts.includes("teil4"));
  assert.ok(entry.referenceAnswerParts.includes("teil4"));
  assert.equal(entry.partGrading.teil4.gradingMode, "answer_key");
});

test("B1 Day 25 writing is a reasoned online-shopping opinion rather than a complaint", () => {
  const spec=getB1WritingTaskSpec("B1-8.25");
  assert.equal(spec.textType,"opinion_essay");
  assert.equal(spec.register,"neutral");
  assert.equal(spec.taskPoints.length,3);
  const answer="Meiner Meinung nach ist Online-Shopping zwar praktisch, aber es gibt Risiken. Ich kaufe oft im Internet, weil die Auswahl groß ist. Ein Fake-Shop kann gefährlich sein, doch das Widerrufsrecht schützt uns. In meinem Heimatland habe ich schon eine schlechte Lieferung erlebt.";
  const evidence=evaluateB1WritingTaskEvidence(spec,answer);
  assert.equal(evidence.length,3);
  assert.ok(evidence.every(x=>x.status==="met"), JSON.stringify(evidence));
});
