import test from "node:test";
import assert from "node:assert/strict";
import { comparePublishedAnswerKeys, mergePublishedMarkingContract } from "../src/utils/publishedMarkingContract.js";
import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { evaluateWritingTaskEvidence } from "../src/utils/writingTaskEvidence.js";
import { exactObjectiveFeedback } from "../src/utils/markingQuality.js";
import { verifiedObjectiveMetadata } from "../src/utils/markingReview.js";
import { resolveQuestionAwareWritingTask } from "../src/utils/questionAwareWritingMarking.js";

const answerKey = {
  teil3: { Answer1: "A) In der Touristeninformation", Answer2: "B) An den Landungsbrücken" },
  teil4: { Answer1: "A) Eine Hafenrundfahrt", Answer2: "B) 20 Euro" },
};
const lesson = {
  assignmentKey: "A2-4.10", answers: answerKey, writingParts: ["teil2"],
};
const contract = {
  schemaVersion: 1, assignmentId: "A2-4.10", sourceVersion: "abcde12345",
  answerKey: { answers: answerKey },
  writingTask: {
    assignmentKey: "A2-4.10",
    taskSituationDe: "Sie möchten mit einem Freund oder einer Freundin einen Tag in einer Stadt oder in einem neuen Viertel verbringen. Schreiben Sie eine E-Mail.",
    taskPointsDe: [
      "Sagen Sie, welchen Ort Sie gemeinsam entdecken möchten und warum.",
      "Schlagen Sie zwei Aktivitäten oder Orte vor, zum Beispiel einen Markt, einen Park, ein Café oder eine Sehenswürdigkeit.",
      "Nennen Sie einen konkreten Tag und Treffpunkt und fragen Sie, was die Person lieber machen möchte.",
    ],
    taskText: "Sie möchten mit einem Freund oder einer Freundin einen Tag in einer Stadt oder in einem neuen Viertel verbringen. Schreiben Sie eine E-Mail.",
    source: "learner-coursebook",
  },
};

test("A matching staff-only learner contract is applied and versioned", () => {
  const outcome = mergePublishedMarkingContract(lesson, contract);
  assert.equal(outcome.warning, "");
  assert.equal(outcome.answersUpdated, true);
  assert.equal(outcome.writingUpdated, true);
  assert.equal(outcome.sourceVersion, "abcde12345");
  const task = resolveQuestionAwareWritingTask({ referenceEntry: outcome.referenceEntry });
  assert.equal(task.source, "learner-coursebook");
  assert.equal(task.sourceVersion, "abcde12345");
  assert.deepEqual(task.taskPointsDe, contract.writingTask.taskPointsDe);
  assert.deepEqual(task.taskPoints, getA2WritingTaskSpec("A2-4.10").taskPoints);
  assert.doesNotMatch(task.taskText, /Fest einladen|besondere[s]? Fest/);
});

test("A conflicting learner objective key never silently overwrites the current verified key", () => {
  const changed = structuredClone(contract);
  changed.answerKey.answers.teil4.Answer2 = "C) 40 Euro";
  const outcome = mergePublishedMarkingContract(lesson, changed);
  assert.match(outcome.warning, /differ|review/i);
  assert.equal(outcome.answersUpdated, false);
  assert.deepEqual(outcome.referenceEntry.answers, answerKey);
  assert.equal(outcome.writingUpdated, true);
  assert.equal(comparePublishedAnswerKeys(answerKey, changed.answerKey.answers).safe, false);
  assert.equal(mergePublishedMarkingContract(lesson, { ...contract, assignmentId: "A2-4.9" }).writingUpdated, undefined);
});

test("Current A2-4.10 writing rubric credits city activities but checks for a meeting point", () => {
  const writing = `Liebe Mia
Wie geht es dir? Ich möchte Accra mit dir entdecken, weil die Stadt interessant ist. Wir könnten zuerst den Markt besuchen und danach im Café etwas trinken. Wir könnten nächsten Freitag gehen, weil ich dann frei habe. Was möchtest du machen?
Viele Grüße
Alex`;
  const spec = getA2WritingTaskSpec("A2-4.10");
  assert.equal(spec.taskPoints.length, 3);
  assert.doesNotMatch(spec.taskText, /Fest einladen|mitbringen/);
  const evidence = evaluateWritingTaskEvidence(spec, writing);
  assert.deepEqual(evidence.map(item => item.status), ["met", "met", "missing"]);
});

test("Flat perfect objective scores show Objective, not the internal main part identifier", () => {
  const objective = { correctCount: 30, totalCount: 30, details: Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => [String(i + 1), {
      partId: "main", student: "A", expected: "A", correct: true,
    }]),
  )};
  const feedback = exactObjectiveFeedback(objective);
  assert.equal(feedback, "Objective: 30/30 correct. All objective answers are correct.");
  assert.doesNotMatch(feedback, /\bmain\b/i);
  const metadata = verifiedObjectiveMetadata({}, objective);
  assert.match(metadata.detectedParts[0].summary, /^Objective:/);
  assert.equal(metadata.detectedParts[0].partId, "main");
});
