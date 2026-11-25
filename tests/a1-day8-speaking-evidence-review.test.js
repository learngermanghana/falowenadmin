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

test("A1 Day 8: all ten objective answers count with a verified zero", () => {
  const result = markVerifiedSpeakingSubmission({ referenceEntry: entry, submissionText, serverSpeakingAssessment: receipt });
  assert.equal(result.objectiveCorrect, 3);
  assert.equal(result.objectiveTotal, 10);
  assert.equal(result.finalScore, 15);
  assert.equal(result.status, "marked");
  assert.equal(result.shouldSendAutomatically, false);
});

test("A1 Day 8: explicitly failed transcript holds the final score for tutor review", () => {
  const result = markVerifiedSpeakingSubmission({
    referenceEntry: entry, submissionText,
    serverSpeakingAssessment: { ...receipt, transcriptionStatus: "failed" },
  });
  assert.equal(result.objectiveCorrect, 3);
  assert.equal(result.objectiveTotal, 10);
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

test("Day 8: translations count separately and country mistakes are rejected", () => {
  const text = [
    "TEIL 1",
    "1. Ich komme aus Deutschland. Ich spreche Deutsch.",
    "2. Sie kommt aus Frankreich. Sie spricht französisch.",
    "3. Sie kommen aus Russland. Sie sprechen russisch.",
    "4. Wir kommen aus Japanische. Wir sprechen japanisch.",
    "5. Er kommt aus Englisch. Er spricht englisch.",
    "TEIL 2", "GOETHE_A1_TUTOR_SPEAKING_V1",
    "TEIL 3", "A1-4-LISTENING-V2", "1. A", "2. B", "3. B", "4. A", "5. B",
  ].join("\n");
  const result = markVerifiedSpeakingSubmission({ referenceEntry: entry, submissionText: text,
    serverSpeakingAssessment: { ...receipt, score: 3 } });
  assert.equal(result.finalScore, 55);
  assert.deepEqual(result.scoreBreakdown.translation, { earned: 3, available: 5 });
  assert.deepEqual(result.scoreBreakdown.listening, { earned: 5, available: 5 });
  assert.match(result.feedback, /Schreiben \(translation\): 3\/5/);
  assert.match(result.feedback, /Hören: 5\/5/);
  assert.deepEqual(result.corrections.map(row => row.question), ["teil1.4", "teil1.5"]);
  const missing = markVerifiedSpeakingSubmission({ referenceEntry: entry,
    submissionText: text.slice(text.indexOf("TEIL 2")), serverSpeakingAssessment: receipt });
  assert.equal(missing.finalScore, null);
  assert.deepEqual(missing.missingRequiredParts, ["teil1"]);
});
