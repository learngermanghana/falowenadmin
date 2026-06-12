export const PASS_MARK = 60;

export function numericScore(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const match = String(value ?? "").trim().match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const score = Number(match[0]);
  return Number.isFinite(score) ? score : null;
}

export function scoreResult(value) {
  const score = numericScore(value);
  if (score === null) return "";
  return score >= PASS_MARK ? "passed" : "failed";
}

export function previousScoreValue(score = null) {
  if (!score) return null;
  return numericScore(score.score ?? score.finalScore ?? score.final_score ?? score.resultScore);
}

export function buildScoreAttemptMetadata(existingScore = null, currentScore, nowIso = new Date().toISOString()) {
  const previousScore = previousScoreValue(existingScore);
  const isResubmission = Boolean(existingScore?.sheetSaved);
  const previousAttempt = Math.max(1, Number(existingScore?.attempt || existingScore?.attemptNumber || 1) || 1);

  return {
    attempt: isResubmission ? previousAttempt + 1 : 1,
    status: scoreResult(currentScore),
    is_resubmission: isResubmission,
    previous_score: isResubmission && previousScore !== null ? previousScore : "",
    previous_result: isResubmission ? (scoreResult(previousScore) || existingScore?.status || existingScore?.result || "") : "",
    resubmitted_at: isResubmission ? nowIso : "",
  };
}

export function shouldSkipExistingScore(existingScore = null, currentScore = null, allowDuplicate = false) {
  if (!existingScore?.sheetSaved || allowDuplicate) return false;
  const previousScore = previousScoreValue(existingScore);
  const nextScore = numericScore(currentScore);
  return nextScore === null || nextScore >= PASS_MARK
    ? previousScore === null || previousScore >= PASS_MARK
    : false;
}
