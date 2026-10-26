import { computeObjectiveScore } from "./objectiveMarking.js";

// Called only by the automatic worker with a receipt it loaded from the
// server-only collection. Never parse a numeric speaking score from draft text.
export function markVerifiedSpeakingSubmission({ referenceEntry, submissionText, serverSpeakingAssessment: speaking }) {
  if (!speaking || !["A1-2", "A1-4", "A1-8", "A1-11"].includes(speaking.assignmentKey)) throw new Error("Verified speaking assessment required");
  // Use one canonical representation: combining normalized boolean options
  // with raw answers otherwise counts the same Richtig/Falsch item twice.
  const { parts, answers, rawAnswers, answerKeys, answer_key, key, ...metadata } = referenceEntry;
  const objective = computeObjectiveScore({ ...metadata, answers: rawAnswers || answers || parts }, submissionText);
  if (!objective.totalCount) throw new Error("Objective answer key unavailable for mixed speaking workbook");
  const total = objective.totalCount + speaking.maxScore;
  const finalScore = Math.round(100 * (objective.correctCount + speaking.score) / total);
  const corrections = Object.entries(objective.details).filter(([, detail]) => !detail.correct)
    .map(([question, detail]) => ({ question, submitted: detail.student || "blank", expected: detail.expectedDisplay || detail.expected, type: "objective" }));
  return {
    status: "marked", score: finalScore, finalScore, passed: finalScore >= 60, confidence: 1,
    objectiveScore: Math.round(100 * objective.correctCount / objective.totalCount),
    objectiveCorrect: objective.correctCount, objectiveTotal: objective.totalCount, objectiveDetails: objective.details,
    writingScore: null, writingScorePercent: null, maxWritingScore: 0,
    speakingScore: speaking.score, maxSpeakingScore: speaking.maxScore, speakingAssessmentId: speaking.assessmentId,
    scoreBreakdown: { objective: { earned: objective.correctCount, available: objective.totalCount }, speaking: { earned: speaking.score, available: speaking.maxScore }, totalAvailable: total },
    markingRubricVersion: "a1-verified-speaking-v1", corrections,
    feedback: `Speaking: ${speaking.score}/${speaking.maxScore}. ${speaking.feedback} Objective answers: ${objective.correctCount}/${objective.totalCount} correct.`
      + (corrections.length ? " Review: " + corrections.map(item => `${item.question}: your answer ${item.submitted}; correct answer ${item.expected}`).join("; ") + "." : ""),
    reviewReasons: [], consistencyWarnings: [], shouldSendAutomatically: finalScore >= 60,
  };
}
