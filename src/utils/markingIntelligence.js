const DEFAULT_SCORE_DELTA_THRESHOLD = 8;
const DEFAULT_WRITING_DELTA_THRESHOLD = 10;

function numericScore(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeFeedback(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function readWritingScore(result = {}) {
  const topLevel = numericScore(result.writingScorePercent ?? result.writingScore);
  if (topLevel !== null) return topLevel;

  const scores = (Array.isArray(result.parts) ? result.parts : [])
    .filter((part) => part?.partType === "writing" || part?.partId === "teil2")
    .map((part) => numericScore(part?.result?.score ?? part?.result?.writingScore ?? part?.score ?? part?.writingScore))
    .filter((score) => score !== null);

  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function hasWritingEvidence(result = {}) {
  if (readWritingScore(result) !== null) return true;
  return (Array.isArray(result.parts) ? result.parts : []).some((part) => part?.partType === "writing" || part?.partId === "teil2");
}

export function compareExaminerResults(primary = {}, secondary = {}, options = {}) {
  const scoreThreshold = Number(options.scoreDeltaThreshold ?? DEFAULT_SCORE_DELTA_THRESHOLD);
  const writingThreshold = Number(options.writingDeltaThreshold ?? DEFAULT_WRITING_DELTA_THRESHOLD);
  const primaryScore = numericScore(primary.finalScore ?? primary.score);
  const secondaryScore = numericScore(secondary.finalScore ?? secondary.score);
  const primaryWritingScore = readWritingScore(primary);
  const secondaryWritingScore = readWritingScore(secondary);

  const scoreDelta = primaryScore !== null && secondaryScore !== null
    ? Math.abs(primaryScore - secondaryScore)
    : null;
  const writingScoreDelta = primaryWritingScore !== null && secondaryWritingScore !== null
    ? Math.abs(primaryWritingScore - secondaryWritingScore)
    : null;

  const missingScore = primaryScore === null || secondaryScore === null;
  const requiresTutorReview = missingScore
    || (scoreDelta !== null && scoreDelta > scoreThreshold)
    || (writingScoreDelta !== null && writingScoreDelta > writingThreshold)
    || String(secondary.status || "").toLowerCase() === "needs_review";

  let agreement = "high";
  if (requiresTutorReview) agreement = "low";
  else if ((scoreDelta ?? 0) > Math.max(3, Math.floor(scoreThreshold / 2)) || (writingScoreDelta ?? 0) > Math.max(4, Math.floor(writingThreshold / 2))) agreement = "medium";

  return {
    enabled: true,
    primaryScore,
    secondaryScore,
    primaryWritingScore,
    secondaryWritingScore,
    scoreDelta,
    writingScoreDelta,
    scoreDeltaThreshold: scoreThreshold,
    writingDeltaThreshold: writingThreshold,
    agreement,
    requiresTutorReview,
    secondaryConfidence: Number.isFinite(Number(secondary.confidence)) ? Number(secondary.confidence) : null,
    secondaryStatus: secondary.status || "unknown",
    secondaryFeedback: String(secondary.feedback || "").trim(),
    secondaryCorrections: Array.isArray(secondary.corrections) ? secondary.corrections : [],
  };
}

export function buildTutorCalibrationEvent({
  aiScore,
  tutorScore,
  aiFeedback = "",
  tutorFeedback = "",
  secondExaminer = null,
  source = "marking_page",
  capturedAt = new Date().toISOString(),
} = {}) {
  const normalizedAiScore = numericScore(aiScore);
  const normalizedTutorScore = numericScore(tutorScore);
  const scoreDelta = normalizedAiScore !== null && normalizedTutorScore !== null
    ? normalizedTutorScore - normalizedAiScore
    : null;
  const absoluteScoreDelta = scoreDelta === null ? null : Math.abs(scoreDelta);
  const feedbackChanged = Boolean(normalizeFeedback(aiFeedback) || normalizeFeedback(tutorFeedback))
    && normalizeFeedback(aiFeedback) !== normalizeFeedback(tutorFeedback);
  const scoreChanged = scoreDelta !== null && scoreDelta !== 0;
  const manualOverride = scoreChanged || feedbackChanged;

  let reasonCode = "ai_approved";
  if (scoreDelta !== null && scoreDelta >= 2) reasonCode = "ai_too_strict";
  else if (scoreDelta !== null && scoreDelta <= -2) reasonCode = "ai_too_generous";
  else if (feedbackChanged) reasonCode = "feedback_rewritten";
  else if (secondExaminer?.requiresTutorReview) reasonCode = "verifier_disagreement_approved";

  return {
    source,
    capturedAt,
    aiScore: normalizedAiScore,
    tutorScore: normalizedTutorScore,
    scoreDelta,
    absoluteScoreDelta,
    scoreChanged,
    feedbackChanged,
    manualOverride,
    reasonCode,
    secondExaminerScore: numericScore(secondExaminer?.secondaryScore),
    secondExaminerDelta: secondExaminer?.scoreDelta ?? null,
    secondExaminerAgreement: secondExaminer?.agreement || null,
    verifierRequestedReview: Boolean(secondExaminer?.requiresTutorReview),
  };
}
