"use strict";

// Pure verification helpers; never send uncertain coursework to the student.
const value = input => String(input ?? "").trim();
const present = input => input !== null && input !== undefined && input !== "";
const numeric = input => input !== null && input !== undefined && input !== "" && Number.isFinite(Number(input));
function referenceVersionProblem(submission = {}, reference = {}) {
  const saved = value(submission.markingReferenceVersion || submission.answerKeyVersion || submission.markingKeyVersion);
  if (!saved) return ""; // Historical submissions do not carry an immutable key version.
  const active = value(reference.version || reference.answerKeyVersion || reference.referenceVersion);
  if (!active) return "Submitted answer-key version is recorded, but the registered answer key is unversioned.";
  return active === saved ? "" : "Submitted answer-key version does not match the registered key. Tutor must verify the original version.";
}
function scoreProblems(result = {}) {
  const problems = [];
  const score = result.finalScore ?? result.score;
  if (!numeric(score) || Number(score) < 0 || Number(score) > 100)
    problems.push("Final score must be within 0–100.");
  if (numeric(result.finalScore) && numeric(result.score) &&
      Math.abs(Number(result.finalScore) - Number(result.score)) > 0.5)
    problems.push("Two different final scores were returned.");
  if (result.confidence !== undefined && (!numeric(result.confidence) ||
      Number(result.confidence) < 0 || Number(result.confidence) > 1))
    problems.push("AI confidence is outside 0–1.");
  if (result.objectiveCorrect !== undefined || result.objectiveTotal !== undefined) {
    const correct = result.objectiveCorrect, total = result.objectiveTotal;
    if (!numeric(correct) || !numeric(total) || Number(correct) < 0 ||
        Number(total) < 0 || Number(correct) > Number(total))
      problems.push("Objective correct/total counts are inconsistent.");
  }
  if (present(result.writingScore) && present(result.maxWritingScore) &&
      (!numeric(result.writingScore) || !numeric(result.maxWritingScore) ||
       Number(result.writingScore) < 0 || Number(result.maxWritingScore) < 0 ||
       Number(result.writingScore) > Number(result.maxWritingScore)))
    problems.push("Writing score exceeds its available marks.");
  if (present(result.writingScorePercent) &&
      (!numeric(result.writingScorePercent) || Number(result.writingScorePercent) < 0 ||
       Number(result.writingScorePercent) > 100))
    problems.push("Writing percentage is outside 0–100.");
  if (result.writingMinimumMet === false && result.passed === true)
    problems.push("The pass outcome contradicts the writing minimum.");
  return problems;
}
function isTransientMarkingError(error) {
  const status = Number(error?.status ?? error?.statusCode ?? error?.response?.status);
  const code = value(error?.code).toLowerCase();
  const message = value(error?.message).toLowerCase();
  if (/insufficient_quota|invalid_api_key|permission_denied|invalid_request/.test(code + " " + message))
    return false;
  if ([408, 409, 425, 429, 500, 502, 503, 504].includes(status)) return true;
  return /(^|[^a-z])(econnreset|etimedout|eai_again|enotfound|econnrefused|ehostunreach|und_err_connect_timeout)([^a-z]|$)/.test(code + " " + message)
    || /fetch failed|network error|temporarily unavailable|rate limit|too many requests|timed out|timeout|service unavailable|socket hang up|bad gateway|gateway timeout/.test(message);
}
module.exports = { referenceVersionProblem, scoreProblems, isTransientMarkingError };
