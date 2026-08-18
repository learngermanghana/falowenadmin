function normalizePercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function withResubmissionComparison(result = {}, submission = {}) {
  const previousRaw = submission.previousScore ?? submission.previous_score ?? null;
  const previousScore = normalizePercent(previousRaw);
  const currentScore = normalizePercent(result.finalScore ?? result.score ?? null);
  const isResubmission = Boolean(submission.isResubmission || submission.is_resubmission || Number(submission.attempt || 0) > 1 || submission.previousSubmissionText || previousRaw !== null);
  if (!isResubmission || previousScore === null || currentScore === null) return result;
  const comparison = currentScore > previousScore
    ? `This resubmission improved from ${previousScore}% to ${currentScore}%.`
    : currentScore === previousScore
      ? `This resubmission did not improve the score; it remains ${currentScore}%.`
      : `This resubmission did not improve the score; it changed from ${previousScore}% to ${currentScore}%.`;
  const withoutOldComparison = (value = "") => String(value || "").replace(/(?:This|Your) resubmission (?:improved|did not improve)[^.]*\.?/gi, "").replace(/[ \t]{2,}/g, " ").trim();
  const feedback = [comparison, withoutOldComparison(result.feedback || result.improvementSummary)].filter(Boolean).join(" ");
  return { ...result, feedback, improvementSummary: feedback, resubmissionComparison: { previousScore, currentScore, improved: currentScore > previousScore } };
}
