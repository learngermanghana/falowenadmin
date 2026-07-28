import { buildNaturalStudentFeedback } from "./naturalMarkingFeedback.js";

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function questionNumber(value, fallback = "") {
  const match = String(value ?? "").match(/\d+/);
  return match?.[0] || String(fallback || "").trim();
}

export function deterministicWrongAnswers(objectiveResult = {}) {
  return Object.entries(objectiveResult.details || {})
    .filter(([, detail]) => detail && detail.correct === false)
    .map(([key, detail]) => ({
      question: questionNumber(detail.questionNumber ?? detail.question ?? key, key),
      partId: String(detail.partId || detail.part || "main").trim() || "main",
      student: detail.student ?? detail.submitted ?? detail.studentAnswer ?? "",
      expected: detail.expected ?? detail.correctAnswer ?? detail.expectedAnswer ?? "",
      correct: false,
    }));
}

export function reconcileFinalDeterministicFeedback(result = {}, objectiveResult = {}, submissionText = "") {
  const objectiveTotal = numeric(objectiveResult.totalCount, 0);
  if (objectiveTotal <= 0) return result;

  const objectiveCorrect = Math.max(0, Math.min(objectiveTotal, numeric(objectiveResult.correctCount, 0)));
  const objectiveScore = (objectiveCorrect / objectiveTotal) * 100;
  const objectiveDetails = objectiveResult.details || {};
  const wrongAnswers = deterministicWrongAnswers(objectiveResult);
  const originalFeedback = String(result.feedback || result.improvementSummary || "").trim();

  const reconciled = {
    ...result,
    objectiveScore,
    objectiveCorrect,
    objectiveTotal,
    objectiveDetails,
    wrongAnswers,
    aiOriginalFeedback: result.aiOriginalFeedback ?? originalFeedback,
    aiDetailedFeedback: result.aiDetailedFeedback || originalFeedback,
    ai: {
      ...(result.ai || {}),
      finalDeterministicFeedbackReconciled: true,
    },
  };

  const feedback = buildNaturalStudentFeedback(reconciled, submissionText);
  if (!feedback) return reconciled;

  return {
    ...reconciled,
    feedback,
    improvementSummary: feedback,
  };
}
