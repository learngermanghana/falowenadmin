import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("Format-only answer differences do not trigger a false review warning", () => {
  const sameAnswers = {
    "Teil 3": { Frage01: " a.   IN DER Touristeninformation! ", Frage2: "B: An den Landungsbrücken." },
    teil4: { Answer1: "a: eine hafenrundfahrt.", Answer2: "b) 20 €" },
  };
  const comparison = comparePublishedAnswerKeys(answerKey, sameAnswers);
  assert.equal(comparison.safe, true);
  assert.deepEqual(comparison.differences, []);
  const outcome = mergePublishedMarkingContract(lesson, {
    ...contract, answerKey: { answers: sameAnswers },
  });
  assert.equal(outcome.warning, "");
  assert.equal(outcome.answersUpdated, true);
});

test("Option changes and missing questions still require precise review", () => {
  const changedOption = structuredClone(answerKey);
  changedOption.teil4.Answer2 = "A) 20 Euro";
  const optionCheck = comparePublishedAnswerKeys(answerKey, changedOption);
  assert.equal(optionCheck.safe, false);
  assert.deepEqual(optionCheck.differences, ["teil4.q2"]);
  assert.match(optionCheck.reason, /Teil 4 Q2/);

  const changedText = structuredClone(answerKey);
  changedText.teil3.Answer1 = "A) Im Bahnhof";
  assert.deepEqual(comparePublishedAnswerKeys(answerKey, changedText).differences, ["teil3.q1"]);

  const incomplete = structuredClone(answerKey);
  delete incomplete.teil4.Answer2;
  assert.deepEqual(comparePublishedAnswerKeys(answerKey, incomplete).differences, ["teil4.q2"]);
  const ambiguous = structuredClone(answerKey);
  ambiguous.teil4.Answer2 = "B";
  assert.equal(comparePublishedAnswerKeys(answerKey, ambiguous).safe, false);
});

test("Outdated registry copies are reconciled only against a matching official Admin key", () => {
  const staleRegistry = {
    ...lesson,
    rawAnswers: {
      teil3: { ...answerKey.teil3, Answer1: "B) In der Touristeninformation" },
      teil4: answerKey.teil4,
    },
    parts: {
      teil3: { partId: "teil3", answers: [{ questionKey: "Answer1", correctLetter: "B" }] },
    },
  };
  const verified = mergePublishedMarkingContract(staleRegistry, contract, {
    authoritativeReferenceEntry: { answers: answerKey },
  });
  assert.equal(verified.warning, "");
  assert.equal(verified.keyStatus, "verified_admin_dictionary");
  assert.equal(verified.answersUpdated, true);
  assert.equal(verified.referenceEntry.parts.teil3.answers[0].correctLetter, "A");

  const unverified = mergePublishedMarkingContract(staleRegistry, contract, {
    authoritativeReferenceEntry: { answers: { ...answerKey, teil4: { ...answerKey.teil4, Answer2: "C) 40 Euro" } } },
  });
  assert.equal(unverified.keyStatus, "conflict");
  assert.equal(unverified.answersUpdated, false);
  assert.match(unverified.warning, /Teil 3 Q1/);
  assert.deepEqual(unverified.referenceEntry.rawAnswers, staleRegistry.rawAnswers);

  const changedOptionButSameText = {
    ...contract,
    answerKey: { answers: { ...answerKey, teil4: { ...answerKey.teil4, Answer2: "C) 20 Euro" } } },
  };
  const realConflict = mergePublishedMarkingContract(lesson, changedOptionButSameText, {
    authoritativeReferenceEntry: { answers: answerKey },
  });
  assert.equal(realConflict.answersUpdated, false);
  assert.match(realConflict.warning, /Teil 4 Q2/);
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

test("The marking page surfaces staff-feed answer disagreements before allowing save", () => {
  const page = readFileSync(new URL("../src/pages/MarkingPage.jsx", import.meta.url), "utf8");
  assert.match(page, /learner_answer_key_disagreement/);
  assert.match(page, /smartMarkingResult\.reviewReasons/);
  assert.match(page, /qualityNeedsReview/);
});
