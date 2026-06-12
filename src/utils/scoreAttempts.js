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
  const isResubmission = Boolean(existingScore) && previousScore !== null && previousScore < PASS_MARK;
  const previousAttempt = Math.max(1, Number(existingScore?.attempt || existingScore?.attemptNumber || 1) || 1);

  return {
    attempt: existingScore ? (isResubmission ? previousAttempt + 1 : previousAttempt) : 1,
    status: scoreResult(currentScore),
    is_resubmission: isResubmission,
    previous_score: isResubmission ? previousScore : "",
    previous_result: isResubmission ? (scoreResult(previousScore) || existingScore?.status || existingScore?.result || "") : "",
    resubmitted_at: isResubmission ? nowIso : "",
  };
}

export function shouldSkipExistingScore(existingScore = null, allowDuplicate = false) {
  if (!existingScore?.sheetSaved || allowDuplicate) return false;
  const previousScore = previousScoreValue(existingScore);
  return previousScore === null || previousScore >= PASS_MARK;
}
