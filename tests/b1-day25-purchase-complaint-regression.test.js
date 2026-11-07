import test from "node:test";
import assert from "node:assert/strict";

import { getB1WritingTaskSpec } from "../src/data/b1WritingTaskSpecs.js";
import { canonicalCourseReference } from "../src/utils/canonicalCourseReference.js";
import { evaluateB1WritingTaskEvidence } from "../src/utils/b1WritingTaskEvidence.js";
import { markingConsistencyWarnings } from "../src/utils/markingQuality.js";
import {
  applyQuestionAwareWritingGuard,
  resolveQuestionAwareWritingTask,
} from "../src/utils/questionAwareWritingMarking.js";

const ruthSubmission = `TEIL 2
Sehr geehrte Damen und Herren,
am Montag habe ich bei Ihnen ein Handy gekauft. Bei der Lieferung war das Display kaputt. Deshalb habe ich das Handy gestern per Post zurückgeschickt. Ich möchte ein neues Gerät erhalten. Bitte antworten Sie mir so schnell wie möglich.
Mit freundlichen Grüßen
Ruth
TEIL 3
1. B 2. C 3. B 4. B 5. B 6. C 7. B
TEIL 4
1. A 2. B 3. A 4. B 5. A`;

function publishedOptions(submissionText = ruthSubmission) {
  return {
    referenceEntry: canonicalCourseReference("B1-8.25"),
    submission: { assignmentKey: "B1-8.25", level: "B1" },
    submissionText,
  };
}

test("B1 Day 25 identifies the current published German writing requirements", () => {
  const task = resolveQuestionAwareWritingTask(publishedOptions());
  assert.ok(task);
  assert.equal(task.source, "learner-coursebook");
  assert.equal(task.semanticEvidenceRuleSet, "B1-8.25-published");
  assert.equal(task.taskPoints.length, 3);
  assert.match(task.taskPoints[0], /Datum, Produkt und Bestellnummer/);
});

test("Ruth receives partial purchase credit and full defect/replacement credit", () => {
  const canonical = getB1WritingTaskSpec("B1-8.25");
  const published = resolveQuestionAwareWritingTask(publishedOptions());
  for (const task of [canonical, published]) {
    const evidence = evaluateB1WritingTaskEvidence(task, ruthSubmission.split("TEIL 3")[0]);
    assert.deepEqual(evidence.map((item) => item.status), ["partial", "met", "met"]);
    assert.deepEqual(evidence[0].missingDetails, ["order number"]);
    assert.match(evidence[0].evidence, /am Montag.*Handy gekauft/i);
    assert.match(evidence[1].evidence, /Display kaputt/i);
    assert.match(evidence[2].evidence, /neues Gerät erhalten/i);
  }
});

test("a real order number completes the compound purchase point", () => {
  const task = getB1WritingTaskSpec("B1-8.25");
  const complete = "Am 2. November habe ich ein Handy gekauft. Meine Bestellnummer ist AB-12345. Das Display ist kaputt. Ich möchte ein neues Gerät erhalten.";
  assert.deepEqual(evaluateB1WritingTaskEvidence(task, complete).map((item) => item.status), ["met", "met", "met"]);

  const noActualNumber = "Am Montag habe ich ein Handy gekauft. Meine Bestellnummer fehlt. Das Display ist kaputt. Ich möchte ein neues Gerät erhalten.";
  assert.equal(evaluateB1WritingTaskEvidence(task, noActualNumber)[0].status, "partial");
  const noReplacement = "Am Montag habe ich ein Handy gekauft. Das Display ist kaputt. Ich möchte ein neues Gerät kaufen.";
  assert.equal(evaluateB1WritingTaskEvidence(task, noReplacement)[2].status, "missing");
});

test("the question-aware marking guard corrects the stale missing-point claim but retains examiner review", () => {
  const result = applyQuestionAwareWritingGuard({
    level: "B1",
    assignmentKey: "B1-8.25",
    score: 92,
    finalScore: 92,
    objectiveScore: 100,
    objectiveCorrect: 12,
    objectiveTotal: 12,
    writingScore: 94,
    writingScorePercent: 94,
    confidence: 0.96,
    status: "needs_review",
    shouldSendAutomatically: false,
    taskCompletion: { completed: 2, total: 3, missing: ["Grund des Schreibens: Geben Sie Ihren Kauf an (Datum, Produkt und Bestellnummer)."] },
    missingTaskPoints: ["Grund des Schreibens: Geben Sie Ihren Kauf an (Datum, Produkt und Bestellnummer)."],
    feedback: "Bei der Lieferung war das Display kaputt describes the damage. You covered 2 of 3 task points; Grund des Schreibens: Geben Sie Ihren Kauf an (Datum, Produkt und Bestellnummer). is missing.",
    reviewReasons: [
      { code: "missing_task_points", message: "Required writing points are missing: Grund des Schreibens: Geben Sie Ihren Kauf an (Datum, Produkt und Bestellnummer).", source: "question_aware_writing" },
      { code: "second_examiner_disagreement", message: "Independent examiners require tutor review (score delta: 2, writing delta: 4).", source: "second_examiner" },
    ],
    secondExaminer: { requiresTutorReview: true, scoreDelta: 2, writingScoreDelta: 4 },
  }, publishedOptions(), ruthSubmission);

  assert.deepEqual(result.taskPointEvidence.map((item) => item.status), ["partial", "met", "met"]);
  assert.deepEqual(result.missingTaskPoints, []);
  assert.deepEqual(result.taskCompletion.partial, ["Grund des Schreibens: Geben Sie Ihren Kauf an (Datum, Produkt und Bestellnummer)."]);
  assert.equal(result.taskCompletion.completed, 2);
  assert.equal(result.taskCompletion.total, 3);
  assert.ok(result.writingScore <= 90, "partial credit cannot receive a near-perfect writing score");
  assert.match(result.feedback, /Partly covered:/i);
  assert.match(result.feedback, /order number/i);
  assert.doesNotMatch(result.feedback, /You covered all 3 required points|Still missing: Grund des Schreibens|You covered 2 of 3 task points/i);
  assert.equal(result.reviewReasons.some((reason) => reason.code === "missing_task_points"), false);
  assert.equal(result.reviewReasons.some((reason) => reason.code === "partial_task_points"), true);
  assert.equal(result.reviewReasons.some((reason) => reason.code === "second_examiner_disagreement"), true);
  assert.equal(result.status, "needs_review");
  assert.equal(result.shouldSendAutomatically, false);
  assert.doesNotMatch(markingConsistencyWarnings(result, { text: ruthSubmission, assignmentId: "B1-8.25" }).join(" "), /no task-point evidence|Task evidence for/i);
});

test("changed published complaint prompts do not inherit an old automatic rule", () => {
  const reference = canonicalCourseReference("B1-8.25");
  const changed = {
    ...reference,
    questionAwareWritingTask: {
      ...reference.questionAwareWritingTask,
      taskPointsDe: ["Schreiben Sie eine allgemeine Bewertung.", ...reference.questionAwareWritingTask.taskPointsDe.slice(1)],
    },
  };
  const task = resolveQuestionAwareWritingTask({ referenceEntry: changed });
  assert.equal(task.semanticEvidenceRuleSet, undefined);
});

test("an explicitly objective-only B1 Day 25 reference still disables writing marking", () => {
  const task = resolveQuestionAwareWritingTask({
    referenceEntry: {
      assignmentKey: "B1-8.25",
      level: "B1",
      writingParts: [],
      aiGradedParts: [],
      questionAwareWritingTask: canonicalCourseReference("B1-8.25").questionAwareWritingTask,
    },
  });
  assert.equal(task, null);
});
