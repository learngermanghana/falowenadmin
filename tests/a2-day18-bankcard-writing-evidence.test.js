import test from "node:test";
import assert from "node:assert/strict";

import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { evaluateWritingTaskEvidence, missingTaskPointsFromEvidence } from "../src/utils/writingTaskEvidence.js";
import { applyQuestionAwareWritingGuard } from "../src/utils/questionAwareWritingMarking.js";
import { compareExaminerResults } from "../src/utils/markingIntelligence.js";

const task = getA2WritingTaskSpec("A2-7.18");

const studentSubmission = [
  "TEIL 2",
  "Sehr geehrte Frau Sabine,",
  "Ich schreibe Ihnen, weil ich meine Bankkarte entsperren möchte. Könnten Sie mir bitte helfen?",
  "Ich kann sie seit drei Tagen in Ghana nicht benutzen.",
  "Zweitens möchte ich wissen, welche Unterlagen ich dafür brauche?",
  "Außerdem sind meine Adresse und meine Aufenthaltserlaubnis auch nötig?",
  "Zum Schluss möchte ich wissen, wie lange der Vorgang dauern wird?",
  "Ich freue mich auf Ihrer Antwort.",
  "Mit freundlichen Grüße, Leo Pat.",
  "TEIL 3",
  "1. A 2. B 3. B 4. C 5. B",
  "TEIL 4",
  "1. B 2. B 3. B 4. A 5. D",
].join("\n");

test("A2-7.18 accepts a learner's polite Bankkarte unblocking request and all three writing points", () => {
  assert.ok(task);
  const evidence = evaluateWritingTaskEvidence(task, studentSubmission);
  assert.deepEqual(evidence.map(({ status }) => status), ["met", "met", "met"]);
  assert.deepEqual(missingTaskPointsFromEvidence(evidence), []);
  assert.match(evidence[0].evidence, /Bankkarte entsperren möchte/i);
  assert.match(evidence[1].evidence, /Unterlagen/i);
  assert.match(evidence[2].evidence, /wie lange/i);
});

test("A2-7.18 accepts direct and indirect unblocking enquiries for Karte and Bankkarte", () => {
  const examples = [
    "Könnten Sie bitte meine Karte entsperren?",
    "Können Sie meine Bankkarte entsperren?",
    "Ich möchte wissen, ob meine Bankkarte entsperrt werden kann.",
    "Kann meine EC-Karte entsperrt werden?",
    "Meine Bankkarte ist gesperrt. Können Sie sie bitte entsperren?",
    "Ich würde gern meine Girokarte freischalten.",
  ];

  for (const sentence of examples) {
    const evidence = evaluateWritingTaskEvidence(task, sentence);
    assert.equal(evidence[0].status, "met", sentence);
  }
});

test("A2-7.18 still flags a mere description of a blocked card without an unblock request", () => {
  const examples = [
    "Meine Bankkarte ist seit drei Tagen gesperrt.",
    "Ich kann meine Karte nicht benutzen.",
    "Ich möchte wissen, warum meine Bankkarte gesperrt ist.",
    "Wie lange dauert der Vorgang? Welche Unterlagen brauche ich? Meine Bankkarte ist gesperrt.",
  ];

  for (const sentence of examples) {
    const evidence = evaluateWritingTaskEvidence(task, sentence);
    assert.equal(evidence[0].status, "missing", sentence);
  }
});

test("A2-7.18 does not cap a fully covered submission or trigger a false second-examiner review", () => {
  const options = {
    referenceEntry: {
      assignmentKey: "A2-7.18",
      level: "A2",
      writingParts: ["teil2"],
      aiGradedParts: ["teil2"],
    },
    submission: { assignmentKey: "A2-7.18", level: "A2" },
  };
  const initial = {
    level: "A2",
    assignmentKey: "A2-7.18",
    objectiveScore: 100,
    objectiveCorrect: 10,
    objectiveTotal: 10,
    score: 93,
    finalScore: 93,
    writingScore: 86,
    writingScorePercent: 86,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    missingTaskPoints: [],
    confidence: 0.99,
    feedback: "You covered all three points in your email.",
    reviewReasons: [{
      code: "missing_task_points",
      message: "Required writing points are missing: Ask whether the blocked card can be unblocked.",
      source: "question_aware_writing",
    }],
    status: "marked",
    shouldSendAutomatically: true,
  };

  const marked = applyQuestionAwareWritingGuard(initial, options, studentSubmission);
  assert.deepEqual(marked.taskPointEvidence.map(({ status }) => status), ["met", "met", "met"]);
  assert.deepEqual(marked.missingTaskPoints, []);
  assert.deepEqual(marked.taskCompletion.missing, []);
  assert.equal(marked.writingScorePercent, 86);
  assert.equal(marked.finalScore, 93);
  assert.equal(marked.status, "marked");
  assert.equal(marked.shouldSendAutomatically, true);
  assert.equal((marked.reviewReasons || []).some(({ code }) => code === "missing_task_points"), false);

  const agreement = compareExaminerResults(marked, {
    ...marked,
    confidence: 0.99,
    status: "marked",
  });
  assert.equal(agreement.scoreDelta, 0);
  assert.equal(agreement.writingScoreDelta, 0);
  assert.equal(agreement.requiresTutorReview, false);
});
