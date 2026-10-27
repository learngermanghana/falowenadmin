import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canonicalCourseReference } from "../src/utils/canonicalCourseReference.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { calculateWeightedMarkingOutcome } from "../src/utils/markingScorePolicy.js";
import { markVerifiedSpeakingSubmission } from "../src/utils/verifiedSpeakingMarking.js";
import { comparePublishedAnswerKeys } from "../src/utils/publishedMarkingContract.js";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import snapshot from "../src/data/courseMarkingSnapshot.json" with { type: "json" };

const dorothy = "TEIL 1\n1. Richtig\n2. Richtig\n3. Falsch\n4. Richtig\n5. Richtig\nTEIL 2\n6. B\n7. C\n8. B";
const alhassan = "TEIL 1\n1. C\n2. A\n3. A\n4. A\nTEIL 2\nHallo, ich heiBe Alhassan Fehimah. Ich komme aus Ghana. Ich wohne in Agona Swedru. Tschuss!";
const awudu = "TEIL 1\nGOETHE_A1_TUTOR_SPEAKING_V1\nVerified speaking assessment: example-receipt\nTEIL 2\n1. A\n2. B\n3. A\n4. B\n5. A";
const awuduAll = awudu + "\nTEIL 3\n1. Richtig\n2. Falsch\n3. Falsch\n4. Richtig\n5. Falsch";

test("canonical and local contracts agree for Day 2 and Day 12", () => {
  for (const id of ["A1-1.1", "A1-8"]) {
    const source = Object.values(dictionary).find(row => row.assignment_id === id);
    const published = Object.values(snapshot.answerKeys).find(row => row.assignment_id === id);
    assert.ok(source && published && canonicalCourseReference(id));
    assert.deepEqual(source.answers, published.answers);
    assert.deepEqual(source.expectedParts, published.expectedParts);
    assert.deepEqual(source.referenceAnswerParts, published.referenceAnswerParts);
    assert.deepEqual(source.writingParts, published.writingParts);
    assert.equal(comparePublishedAnswerKeys(source.answers, published.answers).safe, true);
  }
});

test("Dorothy: Day 12 reading marks 8/8, with no speaking checkpoint", () => {
  const entry = canonicalCourseReference("A1-8");
  assert.deepEqual(entry.referenceAnswerParts, ["teil1", "teil2"]);
  assert.deepEqual(entry.writingParts, []);
  assert.deepEqual(entry.speakingParts || [], []);
  const result = computeObjectiveScore(entry, dorothy);
  assert.equal(result.totalCount, 8);
  assert.equal(result.correctCount, 8);
  assert.ok(Object.values(result.details).every(row => row.correct === true));
});

test("Alhassan: Day 2 objective score covers only 4 listening choices; writing is required", () => {
  const entry = canonicalCourseReference("A1-1.1");
  assert.deepEqual(entry.referenceAnswerParts, ["teil1"]);
  assert.deepEqual(entry.writingParts, ["teil2"]);
  assert.equal(entry.partGrading.teil2.gradingMode, "ai_written_response");
  const score = computeObjectiveScore(entry, alhassan);
  assert.equal(score.totalCount, 4);
  assert.equal(score.correctCount, 2);
  const combined = calculateWeightedMarkingOutcome({ level: "A1", assignmentKey: "A1-1.1", objectiveScore: 50, writingPercent: 90 });
  assert.equal(combined.finalScore, 70);
  assert.equal(combined.passed, true);
  const service = readFileSync(new URL("../src/services/markingService.js", import.meta.url), "utf8");
  assert.match(service, /required_writing_unscored/);
});

test("Awudu: verified Day 17 speaking and five Hören answers cannot publish without Lesen", () => {
  const entry = canonicalCourseReference("A1-11");
  const speaking = { assignmentKey: "A1-11", score: 8, maxScore: 10, feedback: "Polite request; say Stadtplan.", assessmentId: "example-receipt" };
  const partial = markVerifiedSpeakingSubmission({ referenceEntry: entry, submissionText: awudu, serverSpeakingAssessment: speaking });
  assert.equal(partial.objectiveCorrect, 5);
  assert.equal(partial.objectiveTotal, 10);
  assert.equal(partial.speakingScore, 8);
  assert.equal(partial.status, "needs_review");
  assert.equal(partial.finalScore, null);
  assert.equal(partial.shouldSendAutomatically, false);
  assert.deepEqual(partial.missingRequiredParts, ["teil3"]);
  assert.match(partial.feedback, /not submitted/i);
  const complete = markVerifiedSpeakingSubmission({ referenceEntry: entry, submissionText: awuduAll, serverSpeakingAssessment: speaking });
  assert.equal(complete.status, "marked");
  assert.equal(complete.finalScore, 90);
  assert.equal(complete.objectiveCorrect, 10);
  assert.equal(complete.shouldSendAutomatically, true);
});

test("Day 12 rejects obsolete speaking receipts and automatic worker no longer requires them", () => {
  const speaking = { assignmentKey: "A1-8", score: 10, maxScore: 10, feedback: "claimed", assessmentId: "fake" };
  assert.throws(() => markVerifiedSpeakingSubmission({
    referenceEntry: canonicalCourseReference("A1-8"), submissionText: dorothy, serverSpeakingAssessment: speaking,
  }), /verified speaking assessment required/i);
  const worker = readFileSync(new URL("../functions/automaticCourseMarking.js", import.meta.url), "utf8");
  assert.doesNotMatch(worker, /A1-2', 'A1-4', 'A1-8', 'A1-11/);
});
