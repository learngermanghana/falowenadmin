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
    "Ich möchte wissen, ob eine Wohnung verfügbar ist. Ich brauche zwei Zimmer. Welche Nebenkosten gibt es? Ich möchte einen Besichtigungstermin vereinbaren.",
    "Gibt es eine Wohnung in Fulda? Ich brauche zwei Zimmer. Wie hoch ist die Kaution? Ist eine Besichtigung möglich?",
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


const contextualEnquiry = [
  "TEIL 2",
  "Lieber Herr Vermieter,",
  "ich schreibe, weil ich mich für Ihre Wohnung interessiere. Ist sie noch verfügbar?",
  "Ich suche eine Wohnung mit zwei Zimmern und einer Küche. Sie soll in der Nähe meiner Arbeit sein. Die Miete darf höchstens 500 Euro pro Monat kosten.",
  "Könnten Sie mir bitte die Mietbedingungen sagen? Und ist ein Besichtigungstermin möglich? Ich habe nächste Woche Zeit.",
  "Vielen Dank für Ihre Antwort.",
  "Mit freundlichen Grüßen",
  "Max",
  "TEIL 3",
  "1. A 2. B 3. C 4. D 5. A",
  "TEIL 4",
  "1. B 2. A 3. A 4. B 5. A",
].join("\n");

test("A2-3.7 credits contextual pronoun availability enquiries and retains exact evidence", () => {
  const evidence = evaluateWritingTaskEvidence(task, contextualEnquiry);
  assert.deepEqual(evidence.map(({ status }) => status), ["met", "met", "met"]);
  assert.equal(evidence[0].evidence, "Ist sie noch verfügbar?");
  assert.deepEqual(missingTaskPointsFromEvidence(evidence), []);
  for (const source of [
    "Ich interessiere mich für Ihre Wohnung. Ist sie noch frei?",
    "Ich interessiere mich für Ihre Wohnung. Ich möchte wissen, ob sie noch verfügbar ist.",
    "Ich suche eine Wohnung. Ist diese noch zu mieten?",
  ]) {
    assert.equal(evaluateWritingTaskEvidence(task, source)[0].status, "met", source);
  }
  for (const source of [
    "Ist sie noch verfügbar?",
    "Ich interessiere mich für Ihre Wohnung. Sie ist noch verfügbar.",
    "Ich suche eine Wohnung. Haben Sie nächste Woche Zeit?",
    "Die Wohnung hat eine Garage. Ist sie noch frei?",
    "Ich suche eine Wohnung. Ich habe eine Frage zur Besichtigung. Ist sie noch verfügbar?",
  ]) {
    assert.equal(evaluateWritingTaskEvidence(task, source)[0].status, "missing", source);
  }
});

test("A2-3.7 guard clears false missing-point claims and corrects an unknown landlord greeting", () => {
  const missing = "Ask whether an apartment is available";
  const result = applyQuestionAwareWritingGuard({
    assignmentKey: "A2-3.7", level: "A2",
    objectiveScore: 80, objectiveCorrect: 8, objectiveTotal: 10,
    writingScore: 80, writingScorePercent: 80, score: 80, finalScore: 80,
    confidence: 0.98,
    taskCompletion: { completed: 2, total: 3, missing: [missing] },
    missingTaskPoints: [missing],
    feedback: "Still missing: Ask whether an apartment is available.",
    reviewReasons: [{ code: "missing_task_points", message: "Required writing points are missing: " + missing + ".", source: "question_aware_writing" }],
    corrections: [{ partId: "teil2", from: "Lieber Herr Vermieter", to: "Sehr geehrter Herr Vermieter", reason: "Use a formal salutation for a formal hotel or business email." }],
    status: "marked", shouldSendAutomatically: true,
  }, {
    referenceEntry: { assignmentKey: "A2-3.7", level: "A2", writingParts: ["teil2"], aiGradedParts: ["teil2"] },
    submission: { assignmentKey: "A2-3.7", level: "A2" },
  }, contextualEnquiry);
  assert.deepEqual(result.taskPointEvidence.map(({ status }) => status), ["met", "met", "met"]);
  assert.deepEqual(result.missingTaskPoints, []);
  assert.equal(result.taskCompletion.completed, 3);
  assert.equal(result.reviewReasons.some(({ code }) => code === "missing_task_points"), false);
  assert.doesNotMatch(result.feedback, /Still missing:|Required writing points are missing/i);
  assert.ok(result.corrections.some(({ to, reason }) => to === "Sehr geehrte Damen und Herren" && /rental enquiry/.test(reason)));
  assert.ok(!result.corrections.some(({ to }) => /Sehr geehrter Herr Vermieter/i.test(to || "")));
});
