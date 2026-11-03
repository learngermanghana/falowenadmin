import test from "node:test";
import assert from "node:assert/strict";

import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { evaluateWritingTaskEvidence } from "../src/utils/writingTaskEvidence.js";
import { applyQuestionAwareWritingGuard } from "../src/utils/questionAwareWritingMarking.js";
import { compareExaminerResults } from "../src/utils/markingIntelligence.js";

// Anonymised real-world regression: the buyer, fault and remedy are all explicit.
const letter = [
  "Sehr geehrte Damen und Herren,",
  "ich hoffe, es geht Ihnen gut.",
  "Ich wende mich an Sie, weil mein Mixer nicht funktioniert.",
  "Ich habe den Mixer letzten Freitag gekauft, aber leider funktioniert das Produkt nicht.",
  "Der Mixer mixt nicht und lässt sich nicht einschalten.",
  "Ich möchte gern eine Reparatur.",
  "Soll ich den Mixer zu Ihnen bringen, oder bieten Sie einen Reparaturservice bei mir zu Hause an?",
  "Falls eine Reparatur nicht möglich ist, kann ich dann eine Rückerstattung erhalten?Vielen Dank für Ihre Hilfe.",
  "Ich freue mich auf Ihre Rückmeldung.",
  "Mit freundlichen Grüßen",
].join("\n");

const submission = [
  "TEIL 2",
  letter,
  "TEIL 3",
  "1. B", "2. C", "3. B", "4. A", "5. B",
  "TEIL 4",
  "1. B", "2. C", "3. C", "4. A", "5. A",
].join("\n");

const task = getA2WritingTaskSpec("A2-7.20");

test("A2-7.20 recognises the purchased mixer, the specific defect, and the repair/refund request", () => {
  const evidence = evaluateWritingTaskEvidence(task, letter);
  assert.equal(evidence.length, 3);
  assert.deepEqual(evidence.map((point) => point.status), ["met", "met", "met"]);
  assert.match(evidence[0].evidence, /Mixer.*gekauft/i);
  assert.match(evidence[1].evidence, /funktioniert.*nicht|mixt nicht|einschalten/i);
  assert.match(evidence[2].evidence, /Reparatur|Rückerstattung/i);
});

test("A2-7.20 accepts concrete kitchen-appliance faults without requiring the exact word defekt", () => {
  for (const fault of [
    "Der Mixer mixt nicht.",
    "Der Mixer lässt sich nicht einschalten.",
    "Der Mixer schaltet sich nicht ein.",
    "Der Mixer geht nicht an.",
  ]) {
    const evidence = evaluateWritingTaskEvidence(task,
      `Ich habe einen Mixer gekauft. ${fault} Ich möchte eine Reparatur.`);
    assert.deepEqual(evidence.map((point) => point.status), ["met", "met", "met"], fault);
  }
});

test("A2-7.20 still rejects purchases with no complaint or specific defect", () => {
  const evidence = evaluateWritingTaskEvidence(task,
    "Ich habe einen Mixer gekauft. Der Mixer funktioniert gut. Bitte schicken Sie mir die Anleitung.");
  assert.deepEqual(evidence.map((point) => point.status), ["missing", "missing", "missing"]);
});

test("canonical evidence clears false missing points and old 1-of-3 feedback without lowering the writing score", () => {
  const previous = {
    level: "A2",
    assignmentKey: "A2-7.20",
    objectiveScore: 90,
    objectiveCorrect: 9,
    objectiveTotal: 10,
    writingScore: 80,
    writingScorePercent: 80,
    finalScore: 80,
    score: 80,
    taskCompletion: { completed: 1, total: 3, missing: task.taskPoints.slice(0, 2) },
    missingTaskPoints: task.taskPoints.slice(0, 2),
    feedback: "You covered 1 of 3 task points; the reason for writing and the exact product problem are missing.",
    reviewReasons: [
      { code: "missing_task_points", message: "Required writing points are missing.", source: "question_aware_writing" },
      { code: "task_completion_conflict", message: "AI taskCompletion reports complete work while canonical task evidence shows missing points.", source: "question_aware_writing" },
    ],
    confidence: 0.94,
    status: "marked",
  };
  const options = {
    referenceEntry: { assignmentKey: "A2-7.20", level: "A2", writingParts: ["teil2"] },
    submission: { assignmentKey: "A2-7.20", level: "A2" },
    submissionText: submission,
  };

  const corrected = applyQuestionAwareWritingGuard(previous, options, submission);
  assert.deepEqual(corrected.taskPointEvidence.map((point) => point.status), ["met", "met", "met"]);
  assert.deepEqual(corrected.missingTaskPoints, []);
  assert.deepEqual(corrected.taskCompletion, { completed: 3, total: 3, missing: [] });
  assert.equal(corrected.writingScorePercent, 80);
  assert.equal(corrected.objectiveCorrect, 9);
  assert.equal(corrected.status, "marked");
  assert.doesNotMatch(corrected.feedback, /covered 1 of 3|still missing|reason for writing.*missing/i);
  assert.match(corrected.feedback, /covered all 3 required points/i);
  assert.equal(corrected.reviewReasons.some((item) =>
    ["missing_task_points", "task_completion_conflict"].includes(item.code)), false);

  const checked = compareExaminerResults(corrected, { ...corrected, confidence: 0.94 });
  assert.equal(checked.scoreDelta, 0);
  assert.equal(checked.writingScoreDelta, 0);
  assert.equal(checked.requiresTutorReview, false);
});
