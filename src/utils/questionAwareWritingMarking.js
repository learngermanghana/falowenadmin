import { getTeachingSlideByAssignmentId } from "../data/teachingSlides.js";
import { getCachedAssignmentRegistryEntry } from "./assignmentRegistryCache.js";
import { toQuestionAwareWritingTask } from "./assignmentRegistry.js";
import { calculateWeightedMarkingOutcome } from "./markingScorePolicy.js";
import {
  detectWritingTextType,
  extractWritingTaskPoints,
  inferExpectedWritingTextType,
  inferWritingRegister,
  writingTextTypesCompatible,
} from "./writingTaskSchema.js";

const clean = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

function normalizeAssignmentKey(value = "") {
  const source = clean(value).toUpperCase();
  const match = source.match(/\b(A2|B1)-\d+(?:\.\d+)?\b/);
  return match?.[0] || source;
}

function assignmentKeyFromOptions(options = {}) {
  return normalizeAssignmentKey(
    options.referenceEntry?.assignmentKey
      || options.submission?.assignmentKey
      || options.submission?.assignmentId
      || options.assignmentKey
      || options.submission?.assignment
      || "",
  );
}

function levelFromOptions(options = {}, assignmentKey = "") {
  const explicit = clean(options.referenceEntry?.level || options.submission?.level || options.level).toUpperCase();
  const match = explicit.match(/\b(A2|B1)\b/) || assignmentKey.match(/^(A2|B1)-/);
  return match?.[1] || "";
}

function writingPartFromSlide(slide = {}) {
  const parts = Array.isArray(slide.workbookConnection?.parts) ? slide.workbookConnection.parts : [];
  return parts.find((part) => /(?:teil\s*2.*schreiben|schreiben|writing)/i.test(`${part?.label || ""} ${part?.detailEn || ""} ${part?.detailDe || ""}`)) || null;
}

function b1FriendshipTaskPoints() {
  return [
    "Explain how you and the friend met",
    "Explain why this specific friendship is special",
    "Make a concrete suggestion for a meeting",
  ];
}

export function resolveQuestionAwareWritingTask(options = {}) {
  const existing = options.referenceEntry?.questionAwareWritingTask || options.submission?.questionAwareWritingTask;
  if (existing?.assignmentKey) return existing;

  const assignmentKey = assignmentKeyFromOptions(options);
  const level = levelFromOptions(options, assignmentKey);
  if (!assignmentKey || !["A2", "B1"].includes(level)) return null;

  const publishedTask = toQuestionAwareWritingTask(getCachedAssignmentRegistryEntry(assignmentKey) || {});
  if (publishedTask) return publishedTask;

  const slide = getTeachingSlideByAssignmentId(assignmentKey);
  const writingPart = writingPartFromSlide(slide || {});
  const taskText = clean(writingPart?.detailDe || writingPart?.detailEn || "");
  if (!taskText) return null;

  const register = inferWritingRegister(taskText, slide || {});
  const textType = inferExpectedWritingTextType(taskText, slide || {}, register);
  const taskPoints = assignmentKey === "B1-1.2" ? b1FriendshipTaskPoints() : extractWritingTaskPoints(taskText);

  return {
    assignmentKey,
    level,
    title: clean(slide?.title || options.referenceEntry?.title || options.submission?.assignment || assignmentKey),
    taskText,
    textType,
    register,
    taskPoints,
    source: "teachingSlides",
    gradingInstruction: [
      `Grade the ${level} writing against this exact assignment task, not merely against the general topic: ${taskText}`,
      "Check every required communicative point separately and return taskCompletion plus missingTaskPoints.",
      `Expected text type: ${textType}. Expected register: ${register}.`,
      "A greeting and closing alone do not make an essay-style body a correct email or letter.",
      "Topic relevance, fluent grammar, connectors, length, or vocabulary cannot compensate for missing required task points.",
      "Never award 100% writing when a required task point is missing or the requested text type/register is materially wrong.",
    ].join(" "),
  };
}

export function enrichOptionsWithQuestionAwareWritingTask(options = {}) {
  const task = resolveQuestionAwareWritingTask(options);
  if (!task) return options;
  return {
    ...options,
    referenceEntry: { ...(options.referenceEntry || {}), questionAwareWritingTask: task },
    submission: { ...(options.submission || {}), questionAwareWritingTask: task },
  };
}

function writingText(submissionText = "") {
  let source = String(submissionText || "").trim();
  const laterPart = source.search(/(?:^|\n)\s*(?:teil\s*[34]|lesen|reading|h[oö]ren|hoeren|listening)\b/i);
  if (laterPart >= 0) source = source.slice(0, laterPart);
  return source.replace(/^\s*teil\s*2\b[^\n]*[:·]?\s*/i, "").trim();
}

function readStructuredTask(result = {}) {
  const task = result.taskCompletion || result.writing?.taskCompletion || result.ai?.taskCompletion || {};
  const completed = Number(task.completed ?? task.completedPoints ?? result.completedTaskPoints);
  const total = Number(task.total ?? task.totalPoints ?? result.totalTaskPoints);
  const missing = [
    ...(Array.isArray(task.missing) ? task.missing : []),
    ...(Array.isArray(task.missingPoints) ? task.missingPoints : []),
    ...(Array.isArray(result.missingTaskPoints) ? result.missingTaskPoints : []),
  ].map(clean).filter(Boolean);
  return {
    completed: Number.isFinite(completed) ? completed : null,
    total: Number.isFinite(total) ? total : null,
    missing: [...new Set(missing)],
  };
}

function b1FriendshipLocalMissing(source = "") {
  const missing = [];
  const hasMeetingStory = /\bkennengelernt\b/i.test(source)
    && /\b(?:wir|uns|ich|mein(?:e|en|em|er)?\s+(?:best(?:e|en|em|er)?\s+)?(?:freund|freundin))\b/i.test(source);
  const hasSpecificRelationship = /\b(?:mein(?:e|en|em|er)?\s+(?:best(?:e|en|em|er)?\s+)?(?:freund|freundin)|unsere\s+freundschaft|diese\s+freundschaft)\b/i.test(source);
  const hasPersonalReason = /\b(?:besonders|vertraue|unterstützt|unterstützen|hilft|ehrlich|zuverlässig|verständnisvoll|wichtig)\b/i.test(source);
  const hasMeetingSuggestion = /\b(?:wollen|können|sollen)\s+wir\b[^.!?]{0,90}\btreffen|\bwie\s+wäre\s+es\b[^.!?]{0,90}\btreffen|\bhast\s+du\b[^.!?]{0,70}\bzeit|\blass\s+uns\b[^.!?]{0,70}\btreffen|\btreffen\s+wir\s+uns\b|\bmöchtest\s+du\b[^.!?]{0,70}\btreffen/i.test(source);
  if (!hasMeetingStory) missing.push("Explain how you and the friend met");
  if (!(hasSpecificRelationship && hasPersonalReason)) missing.push("Explain why this specific friendship is special");
  if (!hasMeetingSuggestion) missing.push("Make a concrete suggestion for a meeting");
  return missing;
}

function emailBodyLooksLikeOpinionEssay(source = "") {
  const essayMarkers = [
    /\bmeine\s+meinung\s+ist\b/i,
    /\beinerseits\b/i,
    /\bandererseits\b/i,
    /\bzusammenfassend\b/i,
    /\bin\s+meinem\s+heimatland\b/i,
    /\bvor-?\s*und\s*nachteile\b/i,
  ].filter((pattern) => pattern.test(source)).length;
  const directInteraction = [
    /\b(?:du|dir|dich|dein(?:e|en|em|er)?)\b/i.test(source),
    /\?/.test(source),
    /\b(?:wir|uns)\b/i.test(source),
    /\b(?:schreib\s+mir|was\s+meinst\s+du|hast\s+du\s+zeit|wollen\s+wir|können\s+wir)\b/i.test(source),
  ].filter(Boolean).length;
  return essayMarkers >= 2 && directInteraction <= 2;
}

function registerMismatch(task = {}, source = "") {
  if (task.register === "informal") {
    return /\bsehr\s+geehrte(?:r|n)?\b|\bmit\s+freundlichen\s+gr(?:ü|u)(?:ß|ss)en\b/i.test(source);
  }
  if (task.register === "formal") {
    return /(?:^|\n)\s*(?:hallo|liebe?r?)\b|\b(?:liebe\s+grüße|viele\s+grüße|bis\s+bald)\b/i.test(source);
  }
  return false;
}

function numericPercent(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
}

function guardCapForMissing(missingCount, total) {
  if (!missingCount) return 100;
  const effectiveTotal = Number.isFinite(total) && total > 0 ? total : Math.max(3, missingCount);
  const ratio = missingCount / effectiveTotal;
  if (ratio >= 0.99) return 55;
  if (ratio >= 0.66) return 65;
  if (ratio >= 0.33) return 80;
  return 85;
}

function updateWritingParts(parts = [], score) {
  if (!Array.isArray(parts)) return parts;
  return parts.map((part) => {
    const isWriting = part?.partType === "writing" || String(part?.partId || "").toLowerCase() === "teil2";
    if (!isWriting) return part;
    return {
      ...part,
      score,
      writingScore: score,
      result: part?.result && typeof part.result === "object" ? { ...part.result, score, writingScore: score } : part?.result,
    };
  });
}

function recomputeOutcome(result = {}, task = {}, writingScore) {
  return calculateWeightedMarkingOutcome({
    level: task.level || result.level || result.assignmentKey || "",
    assignmentId: result.assignmentId,
    assignmentKey: task.assignmentKey || result.assignmentKey,
    writingPercent: writingScore,
    objectiveScore: numericPercent(result.objectiveScore),
    objectiveDetails: result.objectiveDetails || {},
    hasWriting: true,
  });
}

export function applyQuestionAwareWritingGuard(result = {}, options = {}, rawSubmissionText = "") {
  const task = options.referenceEntry?.questionAwareWritingTask
    || options.submission?.questionAwareWritingTask
    || resolveQuestionAwareWritingTask(options);
  if (!task || !["A2", "B1"].includes(task.level)) return result;

  const currentWritingScore = numericPercent(result.writingScorePercent ?? result.writingScore);
  if (currentWritingScore === null) return result;

  const source = writingText(rawSubmissionText || options.submissionText || options.submission?.text || "");
  const structured = readStructuredTask(result);
  const localMissing = task.assignmentKey === "B1-1.2" ? b1FriendshipLocalMissing(source) : [];
  const missingTaskPoints = [...new Set([...structured.missing, ...localMissing])];
  const total = Math.max(structured.total || 0, task.taskPoints?.length || 0, missingTaskPoints.length ? 3 : 0);
  const detectedTextType = detectWritingTextType(source);
  const classifierMismatch = detectedTextType.confidence >= 0.72
    && !writingTextTypesCompatible(task.textType, detectedTextType.detectedType);
  const legacyEssayMismatch = /email|letter|message|invitation/.test(task.textType) && emailBodyLooksLikeOpinionEssay(source);
  const genreMismatch = classifierMismatch || legacyEssayMismatch;
  const wrongRegister = registerMismatch(task, source);

  let cap = guardCapForMissing(missingTaskPoints.length, total);
  if (genreMismatch) cap = Math.min(cap, 65);
  if (wrongRegister) cap = Math.min(cap, 70);
  const guardedWritingScore = Math.min(currentWritingScore, cap);

  if (guardedWritingScore === currentWritingScore && !missingTaskPoints.length && !genreMismatch && !wrongRegister) {
    return {
      ...result,
      ai: { ...(result.ai || {}), questionAwareWritingTask: task, detectedWritingTextType: detectedTextType },
    };
  }

  const completed = Math.max(0, total - missingTaskPoints.length);
  const weightedOutcome = recomputeOutcome(result, task, guardedWritingScore);
  const issueText = [
    genreMismatch ? `detected ${detectedTextType.detectedType} instead of ${task.textType}` : "",
    wrongRegister ? `the register does not match the requested ${task.register} register` : "",
    missingTaskPoints.length ? `missing task points: ${missingTaskPoints.join("; ")}` : "",
  ].filter(Boolean).join("; ");
  const guardFeedback = `Question-aware writing check: ${issueText}. The writing score is capped at ${guardedWritingScore}% because language quality cannot replace task fulfilment.`;

  return {
    ...result,
    score: weightedOutcome.finalScore,
    finalScore: weightedOutcome.finalScore,
    passed: weightedOutcome.passed,
    scoreBreakdown: weightedOutcome.scoreBreakdown || result.scoreBreakdown || null,
    writingMinimumMet: weightedOutcome.writingMinimumMet,
    markingPolicy: weightedOutcome.policy,
    writingScore: guardedWritingScore,
    writingScorePercent: guardedWritingScore,
    parts: updateWritingParts(result.parts, guardedWritingScore),
    taskCompletion: { completed, total, missing: missingTaskPoints },
    missingTaskPoints,
    feedback: [result.feedback, guardFeedback].filter(Boolean).join(" "),
    improvementSummary: [result.improvementSummary, guardFeedback].filter(Boolean).join(" "),
    status: "needs_review",
    shouldSendAutomatically: false,
    ai: {
      ...(result.ai || {}),
      questionAwareWritingTask: task,
      detectedWritingTextType: detectedTextType,
      questionAwareWritingGuard: {
        applied: true,
        originalWritingScore: currentWritingScore,
        guardedWritingScore,
        genreMismatch,
        registerMismatch: wrongRegister,
        missingTaskPoints,
        detectedWritingTextType: detectedTextType,
      },
    },
  };
}
