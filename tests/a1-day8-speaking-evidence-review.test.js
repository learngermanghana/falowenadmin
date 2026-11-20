import test from "node:test";
import assert from "node:assert/strict";
import { markVerifiedSpeakingSubmission, speakingEvidenceNeedsReview } from "../src/utils/verifiedSpeakingMarking.js";
import dictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { normalizeAnswerKeyEntry } from "../src/utils/answerKeyNormalizer.js";

const entry = normalizeAnswerKeyEntry("A1 Countries and Languages 4", dictionary["A1 Countries and Languages 4"]);
const submissionText = [
  "TEIL 1",
  "1. Ich komme aus Germany. Ich spreche Deutch",
  "2. Sie komme aus Frankreish.",
  "3. Sie kommen aus Russia. Sie sprenchen Russian",
  "4. Wir kommen aus Japan. Wir sprenchen japanese",
  "5. Er kommt aus England. Er sprencht Englisch",
  "TEIL 2",
  "GOETHE_A1_TUTOR_SPEAKING_V1",
  "Verified speaking assessment: example-receipt",
  "TEIL 3",
  "A1-4-LISTENING-V2",
  "1. C",
  "2. B",
  "3. B",
  "4. C",
  "5. B",
].join("\n");
const receipt = {
  assignmentKey: "A1-4", assessmentId: "example-receipt",
  score: 0, maxScore: 10,
  feedback: "The answer did not include a personal introduction.",
};

test("A1 Day 8: known objective answers remain 3/5 with a verified zero", () => {
  const result = markVerifiedSpeakingSubmission({ referenceEntry: entry, submissionText, serverSpeakingAssessment: receipt });
  assert.equal(result.objectiveCorrect, 3);
  assert.equal(result.objectiveTotal, 5);
  assert.equal(result.finalScore, 20);
  assert.equal(result.status, "marked");
  assert.equal(result.shouldSendAutomatically, false);
});

test("A1 Day 8: explicitly failed transcript holds the final score for tutor review", () => {
  const result = markVerifiedSpeakingSubmission({
    referenceEntry: entry, submissionText,
    serverSpeakingAssessment: { ...receipt, transcriptionStatus: "failed" },
  });
  assert.equal(result.objectiveCorrect, 3);
  assert.equal(result.objectiveTotal, 5);
  assert.equal(result.finalScore, null);
  assert.equal(result.status, "needs_review");
  assert.equal(result.shouldSendAutomatically, false);
  assert.equal(result.speakingEvidenceReviewRequired, true);
  assert.equal(result.reviewReasons[0].code, "speaking_evidence_review");
});

test("A1 Day 8: explicit low confidence holds rather than inventing marks", () => {
  assert.equal(speakingEvidenceNeedsReview({ transcriptConfidence: 0.2 }), true);
  assert.equal(speakingEvidenceNeedsReview({ transcriptConfidence: 0.9 }), false);
  assert.equal(speakingEvidenceNeedsReview({ needsTranscriptReview: true }), true);
  assert.equal(speakingEvidenceNeedsReview({}), false);
});
