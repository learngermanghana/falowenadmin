import test from "node:test";
import assert from "node:assert/strict";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { mergeObjectiveScore } from "../src/utils/markingReview.js";
import { reconcileMarkingQuality } from "../src/utils/markingQuality.js";

const text = "TEIL 3\n1. B\n2. B\n3. C\n4. A\n5. B\n\nTEIL 4\n1. B\n2. A\n3. C\n4. A\n5. B";
const stale = {
  level: "A2", assignmentKey: "A2-3.8", finalScore: 33, writingScore: 0,
  feedback: 'Objective score: 4/12 correct (33%). Teil4 question 2: correct B) Obst und Gemuse.',
  wrongAnswers: [{ question: "2", partId: "teil4", expected: "B) Obst und Gemuse" }],
  detectedParts: [{ partId: "teil4", partType: "objective", total: 5, correct: 1, wrong: 4, summary: "1 correct, 4 wrong" }, { partId: "teil3", partType: "objective", total: 7, correct: 3, wrong: 4 }],
  parts: [{ partId: "teil3", partType: "objective", score: 3, maxScore: 7 }],
  ai: { objectiveCorrect: 4, objectiveTotal: 12, wrongAnswers: [{ question: "2" }] },
};

test("A2-3.8 perfect restaurant submission replaces every stale objective field", () => {
  const objective = computeObjectiveScore("A2-3.8", text);
  assert.equal(objective.correctCount, 10);
  assert.equal(objective.totalCount, 10);
  const merged = mergeObjectiveScore({ ...stale, writingScore: null }, objective);
  const result = reconcileMarkingQuality(merged, objective, { assignmentId: "A2-3.8", text }, { writingExpected: false });
  assert.equal(result.finalScore, 100);
  assert.equal(result.objectiveScore, 100);
  assert.equal(result.writingScorePercent, null);
  assert.equal(result.writingScore, null);
  assert.deepEqual(result.wrongAnswers, []);
  assert.deepEqual(result.ai.wrongAnswers, []);
  assert.equal(result.ai.objectiveTotal, 10);
  assert.deepEqual(result.detectedParts.map(({ partId, answerCount, total, correct, wrong }) => ({ partId, answerCount, total, correct, wrong })), [
    { partId: "teil3", answerCount: 5, total: 5, correct: 5, wrong: 0 },
    { partId: "teil4", answerCount: 5, total: 5, correct: 5, wrong: 0 },
  ]);
  assert.ok(result.parts.every((part) => part.score === 5 && part.maxScore === 5));
  assert.match(result.feedback, /Teil 3: 5\/5 correct\. Teil 4: 5\/5 correct\. All objective answers are correct\./);
  assert.doesNotMatch(result.feedback, /4\/12|33%|Obst|Gemuse/);
  assert.deepEqual(result.consistencyWarnings, []);
  assert.equal(result.aiOriginalFeedback, stale.feedback);
});

test("A2-3.8 incorrect answer identifies the current restaurant answer, not a stale key", () => {
  const objective = computeObjectiveScore("A2-3.8", text.replace('TEIL 4\n1. B\n2. A', 'TEIL 4\n1. B\n2. B'));
  const result = reconcileMarkingQuality(mergeObjectiveScore({ ...stale, writingScore: null }, objective), objective, { text }, { wordTarget: 100 });
  assert.equal(result.finalScore, 90);
  assert.equal(result.wrongAnswers.length, 1);
  assert.equal(result.wrongAnswers[0].partId, "teil4");
  assert.match(result.wrongAnswers[0].expected, /Mineralwasser.*Apfelsaft/);
  assert.match(result.feedback, /Teil 4: 4\/5 correct/);
  assert.doesNotMatch(result.feedback, /Obst|All objective answers are correct/);
});
