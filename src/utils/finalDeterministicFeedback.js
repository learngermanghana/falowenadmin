import { buildNaturalStudentFeedback } from "./naturalMarkingFeedback.js";

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function questionNumber(value, fallback = "") {
  const source = String(value ?? "").trim();
  const multipart = source.match(/^(?:teil|part)\s*[1-4]\s*[._\s-]+(\d+)\s*$/i);
  if (multipart?.[1]) return multipart[1];
  const match = source.match(/\d+/);
  return match?.[0] || String(fallback || "").trim();
}

function objectiveClaim(value = "") {
  const source = String(value || "");
  return /\b(?:objective|multiple[ -]choice|answer(?:s|ed)?|option(?:s)?|question(?:s)?|correct|incorrect|wrong|teil\s*[34]|lesen|h[oö]ren|hoeren)\b/i.test(source)
    && /\b(?:answer(?:s|ed)?|option(?:s)?|question(?:s)?|correct|incorrect|wrong|review|improv|practi[cs]e|selected?|teil\s*[34])\b/i.test(source);
}

function writingOnlyList(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.filter((item) => !objectiveClaim(typeof item === "string" ? item : item?.text || item?.feedback || item?.description || ""));
}

function groundedCorrections(value, submissionText) {
  const source = String(submissionText || "").toLocaleLowerCase("de");
  return (Array.isArray(value) ? value : []).filter((item) => {
    if (!item || typeof item !== "object") return false;
    if (item.question || item.questionNumber || /teil\s*[34]/i.test(String(item.partId || item.part || ""))) return false;
    const from = String(item.from || item.original || item.student || item.error || "").trim();
    const to = String(item.to || item.corrected || item.improved || item.correction || "").trim();
    return Boolean(from && to && from !== to && source.includes(from.toLocaleLowerCase("de")));
  });
}

function registeredTaskPointTotal(result = {}) {
  const direct = Number(result.expectedWritingTaskPoints ?? result.writingTaskPointTotal);
  if (Number.isInteger(direct) && direct > 0) return direct;
  const writingPart = [result.registeredWritingPart, ...(Array.isArray(result.writingParts) ? result.writingParts : [])]
    .find((part) => part && typeof part === "object");
  const points = writingPart?.taskPoints || writingPart?.prompts || writingPart?.requirements;
  return Array.isArray(points) && points.length ? points.length : null;
}

function trustedTaskCompletion(result = {}) {
  const total = registeredTaskPointTotal(result);
  if (!total) return null;
  const task = result.taskCompletion;
  if (!task || typeof task !== "object") return null;
  const completed = Number(task.completed ?? task.completedPoints);
  return Number.isFinite(completed)
    ? { ...task, completed: Math.max(0, Math.min(total, completed)), total }
    : { ...task, total };
}

export function sanitizeWritingEvidence(result = {}, submissionText = "") {
  const writingStrengths = writingOnlyList(result.writingStrengths);
  const nextStep = objectiveClaim(result.nextStep) ? "" : String(result.nextStep || "").trim();
  const writingNextStep = objectiveClaim(result.writingNextStep) ? "" : String(result.writingNextStep || "").trim();
  const improvementTarget = objectiveClaim(result.improvementTarget) ? "" : String(result.improvementTarget || "").trim();
  const cleanNested = (nested) => nested && typeof nested === "object" ? {
    ...nested,
    strengths: writingOnlyList(nested.strengths),
    writingStrengths: writingOnlyList(nested.writingStrengths),
    nextStep: objectiveClaim(nested.nextStep) ? "" : nested.nextStep || "",
    improvementTarget: objectiveClaim(nested.improvementTarget) ? "" : nested.improvementTarget || "",
    taskCompletion: registeredTaskPointTotal(result) ? nested.taskCompletion ?? null : null,
    corrections: groundedCorrections(nested.corrections, submissionText),
  } : nested ?? null;

  return {
    ...result,
    writingStrengths,
    strengths: writingOnlyList(result.strengths),
    nextStep,
    writingNextStep,
    improvementTarget,
    taskCompletion: trustedTaskCompletion(result),
    missingTaskPoints: registeredTaskPointTotal(result) ? writingOnlyList(result.missingTaskPoints) : [],
    corrections: groundedCorrections(result.corrections, submissionText),
    writing: cleanNested(result.writing),
    rubric: cleanNested(result.rubric),
    ai: cleanNested(result.ai),
  };
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

function authoritativeDetectedParts(result = {}, objectiveDetails = {}, objectiveTotal = 0, objectiveCorrect = 0) {
  const groups = new Map();
  Object.values(objectiveDetails || {}).forEach((detail) => {
    if (!detail || typeof detail !== "object") return;
    const partId = String(detail.partId || detail.part || "main").trim() || "main";
    const current = groups.get(partId) || { partId, total: 0, correct: 0, wrong: 0 };
    current.total += 1;
    if (detail.correct === true) current.correct += 1;
    else current.wrong += 1;
    groups.set(partId, current);
  });

  if (!groups.size && objectiveTotal > 0) {
    groups.set("main", {
      partId: "main",
      total: objectiveTotal,
      correct: objectiveCorrect,
      wrong: Math.max(0, objectiveTotal - objectiveCorrect),
    });
  }

  const writingParts = Array.isArray(result.detectedParts)
    ? result.detectedParts.filter((part) => String(part?.partType || "").toLowerCase() === "writing")
    : [];
  const objectiveParts = [...groups.values()].map((group) => ({
    partId: group.partId,
    partType: "objective",
    answerCount: group.total,
    total: group.total,
    correct: group.correct,
    wrong: group.wrong,
    summary: `${group.partId}: ${group.total} objective found, ${group.correct} correct, ${group.wrong} wrong`,
  }));
  return [...writingParts, ...objectiveParts];
}

export function reconcileFinalDeterministicFeedback(result = {}, objectiveResult = {}, submissionText = "") {
  const objectiveTotal = numeric(objectiveResult.totalCount, 0);
  if (objectiveTotal <= 0) return result;

  const objectiveCorrect = Math.max(0, Math.min(objectiveTotal, numeric(objectiveResult.correctCount, 0)));
  const objectiveScore = (objectiveCorrect / objectiveTotal) * 100;
  const objectiveDetails = objectiveResult.details || {};
  const wrongAnswers = deterministicWrongAnswers(objectiveResult);
  const originalFeedback = String(result.feedback || result.improvementSummary || "").trim();

  const reconciled = sanitizeWritingEvidence({
    ...result,
    objectiveScore,
    objectiveCorrect,
    objectiveTotal,
    objectiveDetails,
    wrongAnswers,
    detectedParts: authoritativeDetectedParts(result, objectiveDetails, objectiveTotal, objectiveCorrect),
    aiOriginalFeedback: result.aiOriginalFeedback ?? originalFeedback,
    aiDetailedFeedback: result.aiDetailedFeedback || originalFeedback,
    ai: {
      ...(result.ai || {}),
      finalDeterministicFeedbackReconciled: true,
      objectiveDetectedPartsReconciled: true,
    },
  }, submissionText);

  const feedback = buildNaturalStudentFeedback(reconciled, submissionText);
  if (!feedback) return reconciled;

  return {
    ...reconciled,
    feedback,
    improvementSummary: feedback,
  };
}
