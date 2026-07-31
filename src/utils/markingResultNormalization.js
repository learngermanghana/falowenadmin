function stripBoldMarkdown(value = "") {
  return String(value || "").replace(/\*\*/g, "");
}

export function normalizeBrowserMarkingResult(result = {}, payload = {}) {
  const assignmentKey = String(result.assignmentKey || payload.assignmentKey || payload.referenceEntry?.assignmentKey || "").trim();
  const level = String(result.level || payload.level || payload.referenceEntry?.level || payload.submission?.level || "UNKNOWN").trim() || "UNKNOWN";
  const finalScore = Number.isFinite(Number(result.finalScore ?? result.score))
    ? Math.max(0, Math.min(100, Math.round(Number(result.finalScore ?? result.score)))) : 0;
  const feedback = stripBoldMarkdown(result.feedback || "AI marking completed. Review the result before sending it to the student.").trim();
  const status = ["marked", "needs_review"].includes(String(result.status || "").toLowerCase())
    ? String(result.status).toLowerCase() : "needs_review";
  return {
    ...result,
    score: finalScore,
    finalScore,
    passed: Boolean(result.passed ?? finalScore >= 60),
    level,
    assignmentKey,
    detectedParts: Array.isArray(result.detectedParts) ? result.detectedParts : [],
    parts: Array.isArray(result.parts) ? result.parts : [],
    expectedParts: Array.isArray(result.expectedParts) ? result.expectedParts : payload.referenceEntry?.expectedParts || [],
    objectiveCorrect: Number(result.objectiveCorrect || 0),
    objectiveTotal: Number(result.objectiveTotal || 0),
    writingStrengths: Array.isArray(result.writingStrengths) ? result.writingStrengths : result.writingStrengths ? [String(result.writingStrengths)] : [],
    taskCompletion: result.taskCompletion && typeof result.taskCompletion === "object" ? result.taskCompletion : null,
    missingTaskPoints: Array.isArray(result.missingTaskPoints) ? result.missingTaskPoints : [],
    nextStep: String(result.nextStep || result.writingNextStep || result.improvementTarget || "").trim(),
    writingNextStep: String(result.writingNextStep || result.nextStep || result.improvementTarget || "").trim(),
    corrections: Array.isArray(result.corrections) ? result.corrections : [],
    aiOriginalFeedback: String(result.aiOriginalFeedback || result.feedback || "").trim(),
    aiDetailedFeedback: String(result.aiDetailedFeedback || result.feedback || "").trim(),
    feedback,
    improvementSummary: stripBoldMarkdown(result.improvementSummary || feedback),
    status,
    shouldSendAutomatically: Boolean(result.shouldSendAutomatically) && status === "marked",
  };
}
