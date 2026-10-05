import test from "node:test";
import assert from "node:assert/strict";
import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import {
  A2_REQUIRED_WRITING_ASSIGNMENTS,
  A2_NO_WRITING_ASSIGNMENTS,
  B1_REQUIRED_WRITING_ASSIGNMENTS,
  B1_NO_WRITING_ASSIGNMENTS,
  getReferenceWritingRequirement,
  resolveA2B1WritingRequirement,
} from "../src/utils/a2B1WritingCadence.js";
import { normalizeAnswerKeyEntry } from "../src/utils/answerKeyNormalizer.js";
import { calculateWeightedMarkingOutcome } from "../src/utils/markingScorePolicy.js";
import {
  applyQuestionAwareWritingGuard,
  enrichOptionsWithQuestionAwareWritingTask,
  resolveQuestionAwareWritingTask,
} from "../src/utils/questionAwareWritingMarking.js";

const byId = Object.fromEntries(Object.values(answersDictionary).map((entry) => [entry.assignment_id, entry]));
const noWriting = [...A2_NO_WRITING_ASSIGNMENTS, ...B1_NO_WRITING_ASSIGNMENTS];
const requiredWriting = [...A2_REQUIRED_WRITING_ASSIGNMENTS, ...B1_REQUIRED_WRITING_ASSIGNMENTS];

test("all current no-writing days remain objective-only through normalization and legacy imports", () => {
  for (const assignmentKey of noWriting) {
    const normalized = normalizeAnswerKeyEntry(assignmentKey, byId[assignmentKey]);
    assert.deepEqual(normalized.writingParts, [], assignmentKey);
    assert.deepEqual(normalized.aiGradedParts, [], assignmentKey);
    assert.equal(normalized.partGrading.teil2, undefined, assignmentKey);
    assert.equal(normalized.expectedParts.includes("teil2"), false, assignmentKey);
    assert.equal(getReferenceWritingRequirement(normalized), false, assignmentKey);

    // importAnswerDictionary historically stored expectedParts without grading declarations.
    const imported = { assignmentKey, level: normalized.level, expectedParts: normalized.expectedParts };
    assert.equal(getReferenceWritingRequirement(imported), null, assignmentKey);
    for (const referenceEntry of [normalized, imported, { assignmentKey, level: normalized.level }]) {
      const options = { referenceEntry, submission: { assignmentKey, level: normalized.level } };
      assert.equal(resolveA2B1WritingRequirement({ ...options.submission, referenceEntry }), false, assignmentKey);
      assert.equal(resolveQuestionAwareWritingTask(options), null, assignmentKey);
      const enriched = enrichOptionsWithQuestionAwareWritingTask(options);
      assert.equal(enriched.referenceEntry.questionAwareWritingTask, undefined, assignmentKey);
      assert.equal(enriched.submission.questionAwareWritingTask, undefined, assignmentKey);
    }
    const score = calculateWeightedMarkingOutcome({
      level: normalized.level, assignmentKey, writingPercent: 0, objectiveScore: 100,
    });
    assert.equal(score.policy, "a2-b1-objective-only", assignmentKey);
    assert.equal(score.finalScore, 100, assignmentKey);
    assert.equal(score.passed, true, assignmentKey);
    assert.equal(score.writingRequiredButMissing, false, assignmentKey);
  }
});

test("required writing days retain their requirement with full or sparse references", () => {
  for (const assignmentKey of requiredWriting) {
    const normalized = normalizeAnswerKeyEntry(assignmentKey, byId[assignmentKey]);
    assert.deepEqual(normalized.writingParts, ["teil2"], assignmentKey);
    assert.equal(getReferenceWritingRequirement(normalized), true, assignmentKey);
    for (const referenceEntry of [normalized, { expectedParts: normalized.expectedParts }, {}]) {
      assert.equal(resolveA2B1WritingRequirement({ assignmentKey, referenceEntry }), true, assignmentKey);
    }
  }
});

test("sparse current B1-1.2 and A2-1.2 references suppress stale semantic tasks and guards", () => {
  for (const assignmentKey of ["B1-1.2", "A2-1.2"]) {
    const level = assignmentKey.split("-")[0];
    const options = {
      referenceEntry: { assignmentKey, level, questionAwareWritingTask: { assignmentKey, level } },
      submission: { assignmentKey, level },
    };
    assert.equal(resolveQuestionAwareWritingTask(options), null);
    const result = { assignmentKey, level, objectiveScore: 100, writingScore: 0, finalScore: 100 };
    assert.equal(applyQuestionAwareWritingGuard(result, options, "Teil 3\n1. C\nTeil 4\n1. A"), result);
  }
});

test("explicit reference declarations override cadence in either direction", () => {
  for (const declaration of [
    { writingParts: ["teil2"] },
    { ai_graded_parts: ["Teil 2"] },
    { partGrading: { teil2: { gradingMode: "ai_written_response" } } },
  ]) {
    assert.equal(resolveA2B1WritingRequirement({ assignmentKey: "B1-1.2", referenceEntry: declaration }), true);
  }
  const referenceEntry = { expected_parts: ["teil3", "teil4"], writing_parts: [], ai_graded_parts: [] };
  assert.equal(resolveA2B1WritingRequirement({ assignmentKey: "A2-1.1", referenceEntry }), false);
  assert.equal(resolveA2B1WritingRequirement({ assignmentKey: "A2-99.99", referenceEntry: {} }), null);
});

test("snake-case explicit empty writing declaration also survives normalization", () => {
  const normalized = normalizeAnswerKeyEntry("A2-2.5", {
    assignment_id: "A2-2.5", writing_parts: [], ai_graded_parts: [],
    expected_parts: ["teil3", "teil4"], answers: { "teil3: Answer1": "C" },
  });
  assert.deepEqual(normalized.writingParts, []);
  assert.deepEqual(normalized.aiGradedParts, []);
  assert.equal(normalized.expectedParts.includes("teil2"), false);
});
