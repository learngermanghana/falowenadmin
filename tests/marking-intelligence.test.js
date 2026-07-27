import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTutorCalibrationEvent,
  compareExaminerResults,
  hasWritingEvidence,
} from "../src/utils/markingIntelligence.js";

test("second examiner accepts close writing scores", () => {
  const comparison = compareExaminerResults(
    { finalScore: 72, writingScore: 70, confidence: 0.9 },
    { finalScore: 75, writingScore: 74, confidence: 0.88, status: "marked" },
  );

  assert.equal(comparison.scoreDelta, 3);
  assert.equal(comparison.writingScoreDelta, 4);
  assert.equal(comparison.requiresTutorReview, false);
  assert.equal(comparison.agreement, "high");
});

test("second examiner routes large score disagreement to tutor review", () => {
  const comparison = compareExaminerResults(
    { finalScore: 78, writingScore: 82 },
    { finalScore: 61, writingScore: 58, status: "marked" },
  );

  assert.equal(comparison.scoreDelta, 17);
  assert.equal(comparison.writingScoreDelta, 24);
  assert.equal(comparison.requiresTutorReview, true);
  assert.equal(comparison.agreement, "low");
});

test("second examiner respects its own needs_review signal", () => {
  const comparison = compareExaminerResults(
    { finalScore: 70, writingScore: 68 },
    { finalScore: 71, writingScore: 69, status: "needs_review" },
  );

  assert.equal(comparison.requiresTutorReview, true);
});

test("writing evidence is detected from writing score or writing part", () => {
  assert.equal(hasWritingEvidence({ writingScore: 64 }), true);
  assert.equal(hasWritingEvidence({ parts: [{ partId: "teil2", partType: "writing" }] }), true);
  assert.equal(hasWritingEvidence({ objectiveScore: 80, parts: [{ partId: "teil3", partType: "objective" }] }), false);
});

test("tutor score increase records AI too strict calibration", () => {
  const calibration = buildTutorCalibrationEvent({
    aiScore: 72,
    tutorScore: 81,
    aiFeedback: "Improve grammar.",
    tutorFeedback: "Improve grammar.",
    capturedAt: "2026-07-27T12:00:00.000Z",
  });

  assert.equal(calibration.scoreDelta, 9);
  assert.equal(calibration.manualOverride, true);
  assert.equal(calibration.reasonCode, "ai_too_strict");
});

test("tutor score decrease records AI too generous calibration", () => {
  const calibration = buildTutorCalibrationEvent({
    aiScore: 78,
    tutorScore: 66,
    capturedAt: "2026-07-27T12:00:00.000Z",
  });

  assert.equal(calibration.scoreDelta, -12);
  assert.equal(calibration.reasonCode, "ai_too_generous");
});

test("feedback-only edit is recorded without inventing a score issue", () => {
  const calibration = buildTutorCalibrationEvent({
    aiScore: 75,
    tutorScore: 75,
    aiFeedback: "Generic feedback.",
    tutorFeedback: "Specific correction from the student's sentence.",
    capturedAt: "2026-07-27T12:00:00.000Z",
  });

  assert.equal(calibration.scoreChanged, false);
  assert.equal(calibration.feedbackChanged, true);
  assert.equal(calibration.manualOverride, true);
  assert.equal(calibration.reasonCode, "feedback_rewritten");
});

test("unchanged tutor approval becomes a positive calibration example", () => {
  const calibration = buildTutorCalibrationEvent({
    aiScore: 84,
    tutorScore: 84,
    aiFeedback: "Accurate feedback.",
    tutorFeedback: "Accurate feedback.",
    capturedAt: "2026-07-27T12:00:00.000Z",
  });

  assert.equal(calibration.manualOverride, false);
  assert.equal(calibration.reasonCode, "ai_approved");
});
