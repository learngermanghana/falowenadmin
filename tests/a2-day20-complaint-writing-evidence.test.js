import test from "node:test";
import assert from "node:assert/strict";

import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { evaluateWritingTaskEvidence, missingTaskPointsFromEvidence } from "../src/utils/writingTaskEvidence.js";
import { applyQuestionAwareWritingGuard } from "../src/utils/questionAwareWritingMarking.js";

const task = getA2WritingTaskSpec("A2-7.20");
const submission = [
  "TEIL 2",
  "Sehr geehrte Damen und Herren,",
  "Ich schreibe Ihnen, weil ich mich über die Schuhe beschweren möchte, die ich bei Ihnen gekauft habe.",
  "Ich habe diese Schuhe vor drei Tagen bei Ihnen gekauft, aber sie sind zu klein und die Farbe gefällt mir nicht.",
  "Ich möchte größere Schuhe in Rot, Größe 39.",
  "Ich möchte fragen, wann meine neuen Schuhe ankommen?",
  "Ich freue mich auf Ihre Antwort.",
  "Mit freundlichen Grüßen",
  "Victoria Odoom",
  "TEIL 3",
  "1. B 2. C 3. B 4. A 5. B",
  "TEIL 4",
  "1. B 2. C 3. C 4. A 5. A",
].join("\n");

test("A2-7.20 gives Victoria credit for the exact size problem and contextual replacement request", () => {
  assert.ok(task);
  const evidence = evaluateWritingTaskEvidence(task, submission);
  assert.deepEqual(evidence.map((item) => item.status), ["met", "met", "met"]);
  assert.deepEqual(missingTaskPointsFromEvidence(evidence), []);
  assert.match(evidence[1].evidence, /zu klein/i);
  assert.match(evidence[2].evidence, /größere Schuhe in Rot/i);
});

test("A2-7.20 does not treat a complaint or generic new purchase as an exchange", () => {
  const examples = [
    "Ich habe die Schuhe gekauft. Sie sind zu klein.",
    "Ich möchte rote Schuhe kaufen.",
    "Ich habe Schuhe gekauft. Ich möchte wissen, wann das Geschäft öffnet.",
  ];
  for (const sample of examples) {
    const evidence = evaluateWritingTaskEvidence(task, sample);
    assert.equal(evidence[2].status, "missing", sample);
  }
});

test("A2-7.20 retains explicit repairs, refunds and exchanges", () => {
  for (const sample of ["Ich möchte die Schuhe umtauschen.", "Bitte reparieren Sie das Handy.", "Ich bitte um eine Rückerstattung."]) {
    const evidence = evaluateWritingTaskEvidence(task, sample);
    assert.equal(evidence[2].status, "met", sample);
  }
});

test("A2-7.20 repairs the incorrect 1/3 task-completion assessment without false missing-point review", () => {
  const result = applyQuestionAwareWritingGuard({
    level: "A2",
    assignmentKey: "A2-7.20",
    objectiveScore: 90,
    objectiveCorrect: 9,
    objectiveTotal: 10,
    score: 80,
    finalScore: 80,
    writingScore: 70,
    writingScorePercent: 70,
    taskCompletion: { completed: 1, total: 3, missing: ["Describe the exact product problem", "Request exchange, repair or refund"] },
    missingTaskPoints: ["Describe the exact product problem", "Request exchange, repair or refund"],
    confidence: 0.94,
    feedback: "You covered 1 of 3 task points. Describe the exact product problem is missing.",
    reviewReasons: [
      { code: "missing_task_points", message: "Required writing points are missing: Describe the exact product problem; Request exchange, repair or refund.", source: "question_aware_writing" },
    ],
    status: "marked",
    shouldSendAutomatically: true,
  }, {
    referenceEntry: { assignmentKey: "A2-7.20", level: "A2", writingParts: ["teil2"], aiGradedParts: ["teil2"] },
    submission: { assignmentKey: "A2-7.20", level: "A2" },
  }, submission);

  assert.deepEqual(result.taskPointEvidence.map((item) => item.status), ["met", "met", "met"]);
  assert.deepEqual(result.taskCompletion.missing, []);
  assert.equal(result.taskCompletion.completed, 3);
  assert.equal(result.reviewReasons.some((reason) => reason.code === "missing_task_points"), false);
  assert.doesNotMatch(result.feedback, /1 of 3|problem is missing/i);
});

const leonardSubmission = [
  "TEIL 2",
  "Sehr geehrte Damen und Herren,",
  "Ich wende mich an Sie, weil ich vor zwei Tagen ein Handy gekauft habe.",
  "Leider es funktioniert nicht.",
  "Ich habe das Gerät bereit neu gestartet.",
  "Ich möchte wissen, Könnten Sie das Produkt bitte umtauschen?",
  "Wenn das möglichkeit ist, hätte ich mein Geld zurück?",
  "Ihr freue mich auf Antwort.",
  "Mit freundlichen Grüßen, Leo Mark.",
  "TEIL 3",
  "1. B 2. C 3. B 4. A 5. B",
  "TEIL 4",
  "1. B 2. C 3. C 4. C 5. A",
].join("\n");

test("A2-7.20 recognises Leonard's formal contact, phone purchase, defect and exchange request", () => {
  const evidence = evaluateWritingTaskEvidence(task, leonardSubmission);
  assert.deepEqual(evidence.map(({ status }) => status), ["met", "met", "met"]);
  assert.deepEqual(missingTaskPointsFromEvidence(evidence), []);
  assert.match(evidence[0].evidence, /wende mich an Sie.*Handy gekauft/i);
  assert.match(evidence[1].evidence, /funktioniert nicht/i);
  assert.match(evidence[2].evidence, /umtauschen/i);
});

test("A2-7.20 credits an implicit complaint across sentences without special opening vocabulary", () => {
  const examples = [
    "Ich habe vor zwei Tagen ein Handy gekauft. Leider funktioniert es nicht.",
    "Ich wende mich an Sie, weil ich Schuhe gekauft habe. Die Schuhe sind zu klein.",
    "Ich reklamiere das defekte Handy.",
  ];
  for (const sample of examples) {
    const evidence = evaluateWritingTaskEvidence(task, sample);
    assert.equal(evidence[0].status, "met", sample);
  }
});

test("A2-7.20 does not assume that a purchase or negated defect is a complaint", () => {
  const examples = [
    "Ich habe ein Handy gekauft. Es funktioniert gut.",
    "Ich habe ein Handy gekauft. Es ist nicht defekt.",
    "Ich möchte ein Handy kaufen. Können Sie mir bitte helfen?",
  ];
  for (const sample of examples) {
    const evidence = evaluateWritingTaskEvidence(task, sample);
    assert.equal(evidence[0].status, "missing", sample);
  }
});

test("A2-7.20 repairs Leonard's false missing-point warnings but keeps genuine examiner review", () => {
  const result = applyQuestionAwareWritingGuard({
    level: "A2",
    assignmentKey: "A2-7.20",
    objectiveScore: 100,
    objectiveCorrect: 10,
    objectiveTotal: 10,
    score: 90,
    finalScore: 90,
    writingScore: 80,
    writingScorePercent: 80,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    missingTaskPoints: ["Explain why you are writing or complaining and what you bought"],
    confidence: 0.84,
    feedback: "The opening clearly identifies both the complaint and the product. You covered 2 of 3 task points; Explain why you are writing or complaining and what you bought is missing. Correct Leider es funktioniert nicht to Leider funktioniert es nicht.",
    reviewReasons: [
      { code: "missing_task_points", message: "Required writing points are missing: Explain why you are writing or complaining and what you bought.", source: "question_aware_writing" },
      { code: "task_completion_conflict", message: "AI taskCompletion reports complete work while canonical task evidence shows missing points.", source: "question_aware_writing" },
      { code: "second_examiner_disagreement", message: "Independent examiners require review (writing delta: 21).", source: "second_examiner" },
    ],
    secondExaminer: { requiresTutorReview: true, writingScoreDelta: 21 },
    status: "needs_review",
    shouldSendAutomatically: false,
  }, {
    referenceEntry: { assignmentKey: "A2-7.20", level: "A2", writingParts: ["teil2"], aiGradedParts: ["teil2"] },
    submission: { assignmentKey: "A2-7.20", level: "A2" },
  }, leonardSubmission);

  assert.deepEqual(result.taskPointEvidence.map(({ status }) => status), ["met", "met", "met"]);
  assert.equal(result.taskCompletion.completed, 3);
  assert.deepEqual(result.missingTaskPoints, []);
  assert.doesNotMatch(result.feedback, /2 of 3|is missing|still missing/i);
  assert.match(result.feedback, /Leider funktioniert es nicht/i);
  assert.equal(result.reviewReasons.some(({ code }) => code === "missing_task_points" || code === "task_completion_conflict"), false);
  assert.equal(result.reviewReasons.some(({ code }) => code === "second_examiner_disagreement"), true);
  assert.equal(result.shouldSendAutomatically, false);
  assert.equal(result.status, "needs_review");
});
