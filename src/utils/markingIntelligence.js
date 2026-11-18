const DEFAULT_SCORE_DELTA_THRESHOLD = 8;
const DEFAULT_WRITING_DELTA_THRESHOLD = 10;
const SECOND_EXAMINER_REVIEW_CONFIDENCE = 0.65;

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

function writingPartPresent(result = {}) {
  return (Array.isArray(result.parts) ? result.parts : []).some((part) => part?.partType === "writing" || part?.partId === "teil2");
}

export function hasWritingEvidence(result = {}) {
  if (writingPartPresent(result)) return true;
  const score = readWritingScore(result);
  return score !== null && score > 0;
}

export function hasLikelyUnlabelledWritingBeforeObjective(submissionText = "") {
  const text = String(submissionText || "");
  if (!text.trim()) return false;
  if (/(?:^|\n)\s*(?:teil|part)\s*(?:2|zwei|two)\b|\b(?:schreiben|writing)\b/i.test(text)) return false;

  const objectiveMarker = text.search(/(?:^|\n)\s*(?:(?:teil|part)\s*(?:3|4|drei|vier|three|four)\b|(?:lesen|h[oö]ren|hoeren|reading|listening)\b)/im);
  if (objectiveMarker <= 0) return false;

  const leading = text.slice(0, objectiveMarker).trim();
  const words = leading.split(/\s+/).filter(Boolean);
  if (words.length < 20) return false;

  const hasGreeting = /\b(?:hallo|lieber|liebe|guten tag|sehr geehrte(?:r|n)?|dear|hello|hi)\b/i.test(leading);
  const hasClosing = /\b(?:viele gr[üu](?:ß|ss)e|liebe gr[üu](?:ß|ss)e|mit freundlichen gr[üu](?:ß|ss)en|tsch[üu]ss|bis bald|regards|best wishes|sincerely)\b/i.test(leading);
  const firstPerson = /\b(?:ich|mir|mich|mein(?:e|er|em|en|es)?|wir|uns)\b/i.test(leading);
  const sentenceCount = (leading.match(/[.!?]/g) || []).length;

  const essaySignals = leading.match(/\b(?:meine meinung|meiner meinung|einerseits|andererseits|zusammenfassend|abschließend|zum beispiel|vor- und nachteile|vorteile|nachteile)\b/gi) || [];
  const looksLikeEssay = words.length >= 40 && sentenceCount >= 3 && essaySignals.length >= 2;

  return firstPerson && sentenceCount >= 2 && (hasGreeting || hasClosing || looksLikeEssay);
}

export function ensureExplicitWritingLabel(submissionText = "") {
  const text = String(submissionText || "");
  if (!hasLikelyUnlabelledWritingBeforeObjective(text)) return text;
  return `Teil 2 Schreiben\n${text}`;
}

function hasHardSecondaryReviewSignal(result = {}) {
  const missingTaskPoints = [
    ...(Array.isArray(result.missingTaskPoints) ? result.missingTaskPoints : []),
    ...(Array.isArray(result.taskCompletion?.missing) ? result.taskCompletion.missing : []),
    ...(Array.isArray(result.taskCompletion?.missingPoints) ? result.taskCompletion.missingPoints : []),
  ].filter(Boolean);

  return Boolean(
    result.ai?.questionAwareWritingGuard?.applied
    || result.ai?.writingScoreMissing
    || result.ai?.unlabelledWritingDetected
    || missingTaskPoints.length,
  );
}

// A2-2.4 contains three short communicative points. A small difference in the
// language-quality score should not turn two otherwise consistent, confident
// assessments into a tutor-review case. Do not apply this to other tasks or
// missing/uncertain evidence, and never change either examiner's actual score.
export function a2Day4WritingDeltaThreshold(primary = {}, secondary = {}, assignmentKey = "") {
  if (String(assignmentKey || "").trim().toUpperCase() !== "A2-2.4") return 10;
  const completeEvidence = (result) => Array.isArray(result.taskPointEvidence)
    && result.taskPointEvidence.length === 3
    && result.taskPointEvidence.every((point) => point?.status === "met")
    && !(result.missingTaskPoints || []).length
    && !(result.taskCompletion?.missing || []).length
    && !(result.reviewReasons || []).length
    && String(result.status || "").toLowerCase() === "marked"
    && Number.isFinite(Number(result.confidence))
    && Number(result.confidence) >= 0.9;
  const primaryScore = numericScore(primary.finalScore ?? primary.score);
  const secondaryScore = numericScore(secondary.finalScore ?? secondary.score);
  if (!completeEvidence(primary) || !completeEvidence(secondary)
    || primaryScore === null || secondaryScore === null) return 10;
  const scoreDelta = Math.abs(primaryScore - secondaryScore);
  // A2-2.4 is a short invitation with three independently verified task points.
  // Where both graders independently award strong writing marks and agree on
  // every point, a language-quality variation up to 17% is not by itself a
  // reason to hold the learner's result. Never relax this for low writing
  // marks, missing evidence, explicit review reasons or larger overall gaps.
  const primaryWriting = readWritingScore(primary);
  const secondaryWriting = readWritingScore(secondary);
  if (scoreDelta <= 7 && primaryWriting !== null && secondaryWriting !== null
    && primaryWriting >= 75 && secondaryWriting >= 75) return 18;
  return scoreDelta <= 5 ? 14 : 10;
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
  const secondaryConfidence = Number.isFinite(Number(secondary.confidence)) ? Number(secondary.confidence) : null;
  const secondaryRequestedReview = String(secondary.status || "").toLowerCase() === "needs_review";
  const hardSecondaryReviewSignal = hasHardSecondaryReviewSignal(secondary);
  const lowConfidenceSecondaryReview = secondaryRequestedReview
    && (secondaryConfidence === null || secondaryConfidence < SECOND_EXAMINER_REVIEW_CONFIDENCE);
  const requiresTutorReview = missingScore
    || (scoreDelta !== null && scoreDelta > scoreThreshold)
    || (writingScoreDelta !== null && writingScoreDelta > writingThreshold)
    || hardSecondaryReviewSignal
    || lowConfidenceSecondaryReview;

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
    hardSecondaryReviewSignal,
    lowConfidenceSecondaryReview,
    secondaryConfidence,
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
