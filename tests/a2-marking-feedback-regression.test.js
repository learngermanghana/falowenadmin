import test from "node:test";
import assert from "node:assert/strict";
import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { evaluateWritingTaskEvidence } from "../src/utils/writingTaskEvidence.js";
import { applyQuestionAwareWritingGuard } from "../src/utils/questionAwareWritingMarking.js";
import { comparePublishedAnswerKeys } from "../src/utils/publishedMarkingContract.js";
import { dedupeRepeatedFeedback, limitFeedbackWords } from "../src/utils/feedbackPolicy.js";
import { reconcileMarkingQuality } from "../src/utils/markingQuality.js";

const victoriaSubmission = [
  "TEIL 2",
  "Sehr geehrte Frau Müller",
  "ich schreibe Ihnen ,weil ich über eine offene Stelle in Ihrem Beruf frage.",
  "Erstens, ich bin Ärztin mit fünf Jahren Berufserfahrung.",
  "Ich bin organisiert, klug und gute Teamplayerin.",
  "Außerdem habe ich alle notwendigen Fähigkeiten, die ein Darmarzt braucht.",
  "Zum Schluss, Ich möchte wissen, wie die Arbeitszeiten sind und an welchen Tagen ich arbeiten muss.",
  "Ich möchte wissen, wie hoch das Gehalt ist.",
  "Ich freue mich auf Ihre Antwort.",
  "Mit freundlichen Grüßen",
  "Victoria Odoom",
  "TEIL 3",
  "1. A",
].join("\n");

test("A2-5.12 does not count merely mentioning an open vacancy as asking whether it exists", () => {
  const task = getA2WritingTaskSpec("A2-5.12");
  const evidence = evaluateWritingTaskEvidence(task, victoriaSubmission.split("TEIL 3")[0]);
  assert.equal(evidence.length, 3);
  assert.deepEqual(evidence.map((point) => point.status), ["missing", "met", "met"]);
  assert.match(evidence[0].label, /open positions/i);
});

test("A2-5.12 accepts direct and indirect vacancy inquiries with both hours and salary", () => {
  const task = getA2WritingTaskSpec("A2-5.12");
  const opening = "Sehr geehrte Frau Müller,\nich habe fünf Jahre Berufserfahrung und gute Fähigkeiten. Wie sind die Arbeitszeiten und wie hoch ist das Gehalt?";
  for (const inquiry of ["Gibt es noch offene Stellen?", "Ich möchte wissen, ob es noch offene Stellen gibt."]) {
    const evidence = evaluateWritingTaskEvidence(task, opening + "\n" + inquiry);
    assert.deepEqual(evidence.map((point) => point.status), ["met", "met", "met"]);
    assert.match(evidence[0].evidence, /offene Stellen/i);
  }
  const noSalary = evaluateWritingTaskEvidence(task, opening.replace(" und wie hoch ist das Gehalt", "") + "\nGibt es noch offene Stellen?");
  assert.equal(noSalary[2].status, "missing");
});

test("A2-5.12 question-aware guard caps unjustified full-content scores without changing objective credit", () => {
  const result = applyQuestionAwareWritingGuard({
    level: "A2",
    assignmentKey: "A2-5.12",
    objectiveScore: 100,
    objectiveCorrect: 10,
    objectiveTotal: 10,
    writingScore: 86,
    writingScorePercent: 86,
    finalScore: 94,
    score: 94,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    feedback: "You covered all 3 required points.",
    status: "marked",
  }, {
    referenceEntry: { assignmentKey: "A2-5.12", level: "A2", writingParts: ["teil2"] },
    submission: { assignmentKey: "A2-5.12", level: "A2" },
  }, victoriaSubmission);
  assert.deepEqual(result.taskPointEvidence.map((point) => point.status), ["missing", "met", "met"]);
  assert.equal(result.taskCompletion.completed, 2);
  assert.equal(result.writingScorePercent, 80);
  assert.equal(result.finalScore, 92);
  assert.equal(result.objectiveScore, 100);
  assert.equal(result.status, "needs_review");
  assert.doesNotMatch(result.feedback, /You covered all 3 required points/i);
});

test("student feedback strips interrupted instructions and repeated task claims", () => {
  const feedback = "Your formal email has a clear purpose. Remove the You covered all 3 required points. You covered all 3 required points. Teil 3: 5/5 correct.";
  const result = dedupeRepeatedFeedback(feedback);
  assert.doesNotMatch(result, /Remove the You|Remove the$/i);
  assert.equal((result.match(/You covered all 3 required points/g) || []).length, 1);

  const long = "Your formal email clearly explains your professional experience. Remove the comma after Zum Schluss, and fix the verb position. Teil 3: 5/5 correct.";
  const clipped = limitFeedbackWords(long, 13);
  assert.equal(clipped, "Your formal email clearly explains your professional experience.");
  assert.doesNotMatch(clipped, /Remove the/);
});

test("staff key comparison ignores choice-label formatting but names real mismatches", () => {
  const plain = { teil3: { Answer1: "A" }, teil4: { Answer1: "B" } };
  const labelled = { teil3: { Answer1: "A) Anzeige A" }, teil4: { Answer1: "B) Tierärztin" } };
  assert.equal(comparePublishedAnswerKeys(plain, labelled).safe, true);
  const different = structuredClone(labelled);
  different.teil4.Answer1 = "C) Tierarzt";
  const checked = comparePublishedAnswerKeys(plain, different);
  assert.equal(checked.safe, false);
  assert.match(checked.reason, /teil4\.answer1/);
  assert.match(checked.reason, /Admin: B; coursebook: C\) Tierarzt/);
  const conflictingDescription = comparePublishedAnswerKeys(labelled, {
    ...labelled, teil4: { Answer1: "B) Lehrer" },
  });
  assert.equal(conflictingDescription.safe, false);
});

test("formal salutation feedback replaces false ich capitalization with the missing comma", () => {
  const objective = {
    correctCount: 2, totalCount: 2,
    details: {
      "teil3.1": { partId: "teil3", correct: true, student: "A", expected: "A" },
      "teil4.1": { partId: "teil4", correct: true, student: "B", expected: "B" },
    },
  };
  const source = "Review exact wording: Write \"Ich schreibe Ihnen ,weil ich über eine offene Stelle in Ihrem Beruf frage.\" instead of \"ich schreibe Ihnen ,weil ich über eine offene Stelle in Ihrem Beruf frage.\"";
  const reviewed = reconcileMarkingQuality(
    { feedback: source, writingScore: 86, writingScorePercent: 86, finalScore: 94 },
    objective,
    { text: victoriaSubmission, assignmentId: "A2-5.12" },
    { writingExpected: true },
  );
  assert.match(reviewed.feedback, /Add a comma after the formal salutation/);
  assert.doesNotMatch(reviewed.feedback, /Write "Ich schreibe Ihnen|Write “Ich schreibe Ihnen/);
  assert.match(reviewed.feedback, /All objective answers are correct/);
});
