import { computeObjectiveScore } from "./objectiveMarking.js";

// Only authenticated, server-owned speaking receipts reach this function.
// Student-pasted speaking scores must never be accepted here.
const SPEAKING_ASSIGNMENTS = new Set(["A1-2", "A1-4", "A1-11"]);


// A zero speaking mark is valid when supported by a usable recording. When the
// saved, authenticated receipt explicitly reports an unreliable transcript,
// preserve the objective marks but do not publish a speculative final score.
// No new transcription or AI request is made here.
export function speakingEvidenceNeedsReview(speaking = {}) {
  const status = String(speaking.transcriptionStatus || speaking.transcriptStatus || "").trim().toLowerCase();
  const unreliable = new Set(["failed", "error", "empty", "unavailable", "incomplete", "low_confidence", "needs_review"]);
  const confidence = speaking.transcriptConfidence ?? speaking.transcriptionConfidence;
  return speaking.needsTranscriptReview === true
    || speaking.transcriptionNeedsReview === true
    || unreliable.has(status)
    || (confidence !== null && confidence !== undefined && confidence !== ""
      && Number.isFinite(Number(confidence)) && Number(confidence) < 0.5);
}

// A missing entire objective section is an incomplete assignment, not five
// incorrect answers and not a publishable pass or fail.
export function missingVerifiedSpeakingObjectiveParts(referenceEntry = {}, objective = {}) {
  const expected = referenceEntry.referenceAnswerParts || [];
  const details = Object.values(objective.details || {});
  return expected.filter(part => {
    const normalized = String(part).toLowerCase().replace(/\s+/g, "");
    const rows = details.filter(row => String(row.partId || "").toLowerCase() === normalized);
    return !rows.length || rows.every(row => !String(row.student ?? "").trim());
  });
}

export function markVerifiedSpeakingSubmission({ referenceEntry, submissionText, serverSpeakingAssessment: speaking }) {
  if (!speaking || !SPEAKING_ASSIGNMENTS.has(speaking.assignmentKey)) {
    throw new Error("Verified speaking assessment required for an active speaking workbook");
  }
  const { parts, answers, rawAnswers, answerKeys, answer_key, key, ...metadata } = referenceEntry;
  const objective = computeObjectiveScore({ ...metadata, answers: rawAnswers || answers || parts }, submissionText);
  if (!objective.totalCount) throw new Error("Objective answer key unavailable for mixed speaking workbook");
  const day8 = speaking.assignmentKey === "A1-4";
  const missing = missingVerifiedSpeakingObjectiveParts(day8
    ? { referenceAnswerParts: ["teil1", "teil3"] } : referenceEntry, objective);
  const section = partId => {
    const rows = Object.values(objective.details).filter(row => row.partId === partId);
    return { earned: rows.filter(row => row.correct).length, available: rows.length };
  };
  const translation = section("teil1");
  const listening = section("teil3");
  if (day8 && (translation.available !== 5 || listening.available !== 5))
    throw new Error("Day 8 requires five translation and five listening answer keys");
  const objectiveNote = day8
    ? `Teil 1 – Schreiben (translation): ${translation.earned}/5. Teil 3 – Hören: ${listening.earned}/5.`
    : `Objective answers: ${objective.correctCount}/${objective.totalCount} correct.`;
  const scoredDetails = Object.entries(objective.details);
  const corrections = scoredDetails.filter(([, detail]) => !detail.correct && String(detail.student ?? "").trim())
    .map(([question, detail]) => ({ question, submitted: detail.student, expected: detail.expectedDisplay || detail.expected, type: "objective" }));
  const speakingNote = `${day8 ? "Teil 2 – Sprechen" : "Speaking"}: ${speaking.score}/${speaking.maxScore}. ${speaking.feedback}`;
  const common = {
    confidence: 1,
    objectiveScore: Math.round(100 * objective.correctCount / objective.totalCount),
    objectiveCorrect: objective.correctCount, objectiveTotal: objective.totalCount, objectiveDetails: objective.details,
    writingScore: null, writingScorePercent: null, maxWritingScore: 0,
    speakingScore: speaking.score, maxSpeakingScore: speaking.maxScore, speakingAssessmentId: speaking.assessmentId,
    markingRubricVersion: day8 ? "a1-day8-translation-speaking-listening-v2" : "a1-verified-speaking-v1", corrections,
    reviewReasons: [], consistencyWarnings: [],
  };

  if (missing.length) {
    const missingLabel = missing.map(part => part.replace(/^teil/i, "Teil ")).join(", ");
    const message = `Required ${missingLabel} objective section was not submitted. Complete this section before the final score is calculated.`;
    const answered = scoredDetails.filter(([, row]) => String(row.student ?? "").trim());
    return {
      ...common, status: "needs_review", score: null, finalScore: null, passed: false,
      shouldSendAutomatically: false,
      incompleteAssessment: true, missingRequiredParts: missing,
      scoreBreakdown: { objectiveAnswered: answered.length, objectiveRequired: objective.totalCount,
        speaking: { earned: speaking.score, available: speaking.maxScore }, incomplete: true },
      feedback: `${speakingNote} ${answered.length}/${objective.totalCount} objective responses submitted; ${objective.correctCount} correct. ${message}`,
      reviewReasons: [{ code: "missing_required_objective_part", message, source: "verified_speaking_marking" }],
    };
  }

  if (speakingEvidenceNeedsReview(speaking)) {
    const message = "Speaking transcription or recording evidence needs tutor verification before a final score can be published.";
    return {
      ...common, status: "needs_review", score: null, finalScore: null, passed: false,
      shouldSendAutomatically: false, incompleteAssessment: true,
      speakingEvidenceReviewRequired: true,
      scoreBreakdown: { objective: { earned: objective.correctCount, available: objective.totalCount },
        speaking: { earned: speaking.score, available: speaking.maxScore, provisional: true } },
      feedback: `${objectiveNote} Speaking mark ${speaking.score}/${speaking.maxScore} is provisional pending audio/transcript verification.`,
      reviewReasons: [{ code: "speaking_evidence_review", message, source: "verified_speaking_marking" }],
    };
  }

  const total = objective.totalCount + speaking.maxScore;
  const finalScore = Math.round(100 * (objective.correctCount + speaking.score) / total);
  return {
    ...common, status: "marked", score: finalScore, finalScore, passed: finalScore >= 60,
    scoreBreakdown: { objective: { earned: objective.correctCount, available: objective.totalCount },
      speaking: { earned: speaking.score, available: speaking.maxScore }, totalAvailable: total,
      ...(day8 ? { translation, listening } : {}) },
    feedback: `${speakingNote} ${objectiveNote}`
      + (corrections.length ? " Review: " + corrections.map(item => `${item.question}: your answer ${item.submitted}; correct answer ${item.expected}`).join("; ") + "." : ""),
    shouldSendAutomatically: finalScore >= 60,
  };
}
