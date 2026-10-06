import { calculateWeightedMarkingOutcome } from "./markingScorePolicy.js";

function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function objectivePercentFromResult(objectiveResult = {}) {
  const total = Number(objectiveResult.totalCount || 0);
  if (!total) return 0;
  return (Number(objectiveResult.correctCount || 0) / total) * 100;
}

export function getMaxWritingScore(result = {}) {
  const candidates = [
    result.maxWritingScore,
    result.writingMaxScore,
    result.maxWritingPoints,
    result.writingMaxPoints,
    result.rubricMaxScore,
    result.writingRubricMax,
    result.ai?.maxWritingScore,
    result.ai?.writingMaxScore,
    ...(Array.isArray(result.parts)
      ? result.parts
        .filter((part) => String(part?.partType || "").toLowerCase() === "writing")
        .flatMap((part) => [part.maxScore, part.maxPoints, part.total, part.totalPoints])
      : []),
  ];

  const explicitMax = candidates.find((value) => Number.isFinite(Number(value)) && Number(value) > 0);
  if (explicitMax) return Number(explicitMax);

  return 100;
}

export function writingScoreToPercent(writingScore, maxWritingScore = 100) {
  const numericScore = Number(writingScore);
  const numericMax = Number(maxWritingScore);
  if (!Number.isFinite(numericScore)) return 0;
  if (!Number.isFinite(numericMax) || numericMax <= 0) return clampPercent(numericScore);
  return clampPercent((numericScore / numericMax) * 100);
}

export function writingPercentFromResult(result = {}) {
  if (result.writingScorePercent !== null && result.writingScorePercent !== undefined
      && result.writingScorePercent !== "" && Number.isFinite(Number(result.writingScorePercent))) {
    return clampPercent(result.writingScorePercent);
  }
  if (result.writingScore === null || result.writingScore === undefined || result.writingScore === "") return null;
  return writingScoreToPercent(result.writingScore, getMaxWritingScore(result));
}

export function mergeObjectiveScore(result = {}, objectiveResult = {}) {
  const objectivePercent = objectivePercentFromResult(objectiveResult);
  const writingPercent = writingPercentFromResult(result);
  const hasObjective = Number(objectiveResult.totalCount || 0) > 0;
  const hasWriting = writingPercent !== null && Number.isFinite(writingPercent);
  const weightedOutcome = calculateWeightedMarkingOutcome({
    level: result.level || result.assignmentKey || result.assignmentId || "",
    assignmentId: result.assignmentId,
    assignmentKey: result.assignmentKey,
    writingPercent: hasWriting ? writingPercent : null,
    objectiveScore: hasObjective ? objectivePercent : null,
    objectiveDetails: objectiveResult.details || {},
    hasWriting,
  });
  const finalScore = hasObjective || hasWriting
    ? weightedOutcome.finalScore
    : Number(result.finalScore ?? result.score ?? 0);

  return {
    ...result,
    score: finalScore,
    finalScore,
    passed: weightedOutcome.passed,
    scoreBreakdown: weightedOutcome.scoreBreakdown || result.scoreBreakdown || null,
    writingMinimumMet: weightedOutcome.writingMinimumMet,
    markingPolicy: weightedOutcome.policy,
    objectiveCorrect: objectiveResult.correctCount,
    objectiveTotal: objectiveResult.totalCount,
    objectiveDetails: objectiveResult.details,
    objectiveScore: objectivePercent,
    writingScore: result.writingScore ?? null,
    writingScorePercent: hasWriting ? writingPercent : null,
    maxWritingScore: getMaxWritingScore(result),
    aiOriginalScore: result.aiOriginalScore ?? result.finalScore ?? result.score ?? null,
    aiOriginalFeedback: result.aiOriginalFeedback ?? result.feedback ?? "",
  };
}


