export const SCORE_PASS_MARK = 60;

export function buildManualScoreCorrection(score, nowIso = new Date().toISOString()) {
  const numeric = Number(score);
  const normalizedScore = Number.isFinite(numeric)
    ? Math.max(0, Math.min(100, Math.round(numeric)))
    : score;
  const hasNumericScore = Number.isFinite(numeric);
  const passed = hasNumericScore && normalizedScore >= SCORE_PASS_MARK;
  const failed = hasNumericScore && normalizedScore < SCORE_PASS_MARK;

  return {
    score: normalizedScore,
    finalScore: normalizedScore,
    ...(hasNumericScore ? {
      status: passed ? "passed" : "failed",
      result: passed ? "passed" : "failed",
      passed,
      failed,
    } : {}),
    updatedAt: nowIso,
    manuallyEdited: true,
    manuallyEditedAt: nowIso,
    manualScoreOverride: true,
    scoreOverrideAuthoritative: true,
  };
}
