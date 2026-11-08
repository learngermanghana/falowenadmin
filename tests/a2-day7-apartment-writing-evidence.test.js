import test from "node:test";
import assert from "node:assert/strict";

import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { evaluateWritingTaskEvidence, missingTaskPointsFromEvidence } from "../src/utils/writingTaskEvidence.js";
import { applyQuestionAwareWritingGuard } from "../src/utils/questionAwareWritingMarking.js";
import { compareExaminerResults } from "../src/utils/markingIntelligence.js";

const task = getA2WritingTaskSpec("A2-3.7");
const victoria = [
  "TEIL 2",
  "Sehr geehrter Herr Müller,",
  "Ich schreibe Ihnen, weil ich über eine Wohnung sprechen möchte.",
  "Ich suche eine Wohnung in Fulda.",
  "Ich möchte eine Wohnung mit zwei Zimmern, die Wohnung muss eine Küche, einen Balkon und ein Bad haben.",
  "Ich möchte eine möblierte Wohnung.",
  "Das Wohnzimmer muss hell, schön und groß sein, weil ich viele Fotos machen möchte.",
  "Ich möchte wissen, wie groß die Wohnung ist und wie viel die Wohnung im Monat kostet.",
  "Ich freue mich auf Ihre Antwort.",
  "Mit freundlichen Grüßen Victoria Odoom",
  "TEIL 3",
  "1. A 2. B 3. C 4. C 5. A",
  "TEIL 4",
  "1. B 2. C 3. A 4. B 5. C",
].join("\n");

test("A2-3.7 recognises Victoria's rental question but not an unasked viewing or availability question", () => {
  assert.ok(task);
  const evidence = evaluateWritingTaskEvidence(task, victoria);
  assert.deepEqual(evidence.map((item) => item.status), ["missing", "met", "partial"]);
  assert.deepEqual(missingTaskPointsFromEvidence(evidence), ["Ask whether an apartment is available"]);
  assert.match(evidence[1].evidence, /zwei Zimmer/);
  assert.match(evidence[2].evidence, /wie viel die Wohnung im Monat kostet/);
  assert.deepEqual(evidence[2].missingDetails, ["Ask for a viewing appointment"]);
});

test("A2-3.7 accepts natural formal direct and indirect enquiries without requiring keywords alone", () => {
  for (const source of [
    "Haben Sie noch eine Wohnung frei? Ich möchte wissen, wie viel die Miete kostet. Wann kann ich die Wohnung besichtigen?",
    "Ich möchte wissen, ob eine Wohnung verfügbar ist. Welche Nebenkosten gibt es? Ich möchte einen Besichtigungstermin vereinbaren.",
    "Gibt es eine Wohnung in Fulda? Wie hoch ist die Kaution? Ist eine Besichtigung möglich?",
  ]) {
    assert.deepEqual(evaluateWritingTaskEvidence(task, source).map((item) => item.status), ["met", "met", "met"], source);
  }
});

test("A2-3.7 does not credit rent or the statement of a housing preference as a viewing or vacancy enquiry", () => {
  for (const source of [
    "Ich suche eine Wohnung in Fulda mit zwei Zimmern. Wie viel kostet die Wohnung im Monat?",
    "Die Wohnung ist groß und hell. Ich suche eine Wohnung in Fulda.",
  ]) {
    const evidence = evaluateWritingTaskEvidence(task, source);
    assert.equal(evidence[0].status, "missing", source);
    assert.notEqual(evidence[2].status, "met", source);
  }
});

test("A2-3.7 corrects stale AI task-completion claims while retaining tutor review for genuine omissions", () => {
  const result = applyQuestionAwareWritingGuard({
    assignmentKey: "A2-3.7",
    level: "A2",
    objectiveScore: 90,
    objectiveCorrect: 9,
    objectiveTotal: 10,
    writingScore: 80,
    writingScorePercent: 80,
    score: 80,
    finalScore: 80,
    confidence: 0.96,
    taskCompletion: { completed: 1, total: 3, missing: [
      "Ask whether an apartment is available", "Ask about rental conditions and a viewing",
    ] },
    missingTaskPoints: ["Ask whether an apartment is available", "Ask about rental conditions and a viewing"],
    feedback: "You covered 1 of 3 task points. Ask about rental conditions and a viewing is missing.",
    reviewReasons: [
      { code: "missing_task_points", message: "Required writing points are missing: Ask whether an apartment is available; Ask about rental conditions and a viewing.", source: "question_aware_writing" },
    ],
    status: "needs_review",
    shouldSendAutomatically: false,
  }, {
    referenceEntry: { assignmentKey: "A2-3.7", level: "A2", writingParts: ["teil2"], aiGradedParts: ["teil2"] },
    submission: { assignmentKey: "A2-3.7", level: "A2" },
  }, victoria);

  assert.deepEqual(result.taskPointEvidence.map(({ status }) => status), ["missing", "met", "partial"]);
  assert.deepEqual(result.missingTaskPoints, ["Ask whether an apartment is available"]);
  assert.deepEqual(result.taskCompletion.partial, ["Ask about rental conditions and a viewing"]);
  assert.match(result.feedback, /Partly covered/);
  assert.match(result.feedback, /Ask for a viewing appointment/);
  assert.doesNotMatch(result.feedback, /covered 1 of 3|viewing is missing/i);
  assert.match(result.improvementSummary, /Ask for a viewing appointment/);
  assert.equal(result.reviewReasons.filter(({ code }) => code === "missing_task_points").length, 1);
  assert.equal(result.reviewReasons.filter(({ code }) => code === "partial_task_points").length, 1);
  assert.equal(result.status, "needs_review");
  assert.equal(result.shouldSendAutomatically, false);
});

test("Second examiner's small numeric delta is not mislabelled as a score-threshold disagreement", () => {
  const comparison = compareExaminerResults(
    { finalScore: 80, writingScore: 74 },
    { finalScore: 82, writingScore: 79, missingTaskPoints: ["Ask whether an apartment is available"], status: "needs_review", confidence: 0.96 },
  );
  assert.equal(comparison.scoreDelta, 2);
  assert.equal(comparison.writingScoreDelta, 5);
  assert.equal(comparison.hardSecondaryReviewSignal, true);
  assert.equal(comparison.requiresTutorReview, true);
  assert.equal(comparison.scoreDelta < comparison.scoreDeltaThreshold, true);
  assert.equal(comparison.writingScoreDelta < comparison.writingDeltaThreshold, true);
});
