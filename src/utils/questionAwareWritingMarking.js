import { getTeachingSlideByAssignmentId } from "../data/teachingSlides.js";
import { A2_WRITING_RUBRIC_VERSION, getA2WritingTaskSpec } from "../data/a2WritingTaskSpecs.js";
import { B1_WRITING_RUBRIC_VERSION, getB1WritingTaskSpec } from "../data/b1WritingTaskSpecs.js";
import { getCachedAssignmentRegistryEntry } from "./assignmentRegistryCache.js";
import { toQuestionAwareWritingTask } from "./assignmentRegistry.js";
import { calculateWeightedMarkingOutcome } from "./markingScorePolicy.js";
import { heuristicWritingMarker } from "./autoMarking.js";
import { evaluateWritingTaskEvidence, missingTaskPointsFromEvidence, taskEvidenceSummary } from "./writingTaskEvidence.js";
import { evaluateB1WritingTaskEvidence } from "./b1WritingTaskEvidence.js";
import {
  detectWritingTextType,
  extractWritingTaskPoints,
  inferExpectedWritingTextType,
  inferWritingRegister,
  writingTextTypesCompatible,
} from "./writingTaskSchema.js";

const clean = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

function applyAuthoritativeWritingOverride(task = {}) {
  const assignmentKey = normalizeAssignmentKey(task.assignmentKey || "");
  const a2Spec = getA2WritingTaskSpec(assignmentKey);
  const b1Spec = getB1WritingTaskSpec(assignmentKey);
  const next = a2Spec
    ? { ...task, ...a2Spec, level: "A2" }
    : b1Spec
      ? { ...task, ...b1Spec, level: "B1" }
      : task;
  if (!next?.assignmentKey) return next;
  return {
    ...next,
    gradingInstruction: [
      "Grade the " + next.level + " writing against this exact assignment task, not merely against the general topic: " + next.taskText,
      "Check every required communicative point separately. Return taskCompletion, missingTaskPoints, and evidence for every task point.",
      "Expected text type: " + next.textType + ". Expected register: " + next.register + ".",
      "A greeting, question mark, or closing only counts when it performs the communicative function required by the task.",
      "Topic relevance, fluent grammar, connectors, length, or vocabulary cannot compensate for missing required task points.",
      "Do not double-penalize the same issue as both genre and register when the student still wrote the requested correspondence genre.",
      "Never award 100% writing when a required task point is missing or the requested text type/register is materially wrong.",
    ].join(" "),
  };
}

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
  if (existing?.assignmentKey) return applyAuthoritativeWritingOverride(existing);

  const assignmentKey = assignmentKeyFromOptions(options);
  const level = levelFromOptions(options, assignmentKey);
  if (!assignmentKey || !["A2", "B1"].includes(level)) return null;

  const publishedTask = toQuestionAwareWritingTask(getCachedAssignmentRegistryEntry(assignmentKey) || {});
  if (publishedTask) return applyAuthoritativeWritingOverride(publishedTask);

  const slide = getTeachingSlideByAssignmentId(assignmentKey);
  const writingPart = writingPartFromSlide(slide || {});
  const taskText = clean(writingPart?.detailDe || writingPart?.detailEn || "");
  if (!taskText) return null;

  const register = inferWritingRegister(taskText, slide || {});
  const textType = inferExpectedWritingTextType(taskText, slide || {}, register);
  const taskPoints = assignmentKey === "B1-1.2" ? b1FriendshipTaskPoints() : extractWritingTaskPoints(taskText);

  return applyAuthoritativeWritingOverride({
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
  });
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

function a2Day1LocalMissing(source = "") {
  const missing = [];
  const hasReasonForWriting = /\bich\s+schreibe\s+(?:dir|ihnen|euch|felix)\b/i.test(source)
    && /\b(?:weil|denn|nachricht|erzählen|mitteilen|berichten|schreiben\s+möchte|schreiben\s+will)\b/i.test(source);
  const hasWorkOrStudy = /\b(?:ich\s+arbeite|arbeite\s+bei|meine?\s+arbeit|beruf|job|studier\w*|studium|schule|universit[aä]t|ausbildung)\b/i.test(source);
  const hasFamilyNews = /\b(?:familie|eltern|mutter|vater|bruder|schwester|geschwister|sohn|tochter|kind(?:er)?|ehemann|ehefrau|hund|katze)\b/i.test(source);
  const hasReasonConnector = /\b(?:weil|denn)\b/i.test(source);

  const signoffIndex = source.search(/(?:^|\n)\s*(?:viele|liebe|herzliche|beste)\s+gr(?:ü|u)(?:ß|ss)e\b/i);
  const body = signoffIndex >= 0 ? source.slice(0, signoffIndex) : source;
  const tail = body.slice(Math.floor(body.length * 0.55));
  const hasRelevantFinalQuestion = /\bwie\s+geht(?:\s+es|'?s)?\s+(?:dir|ihnen)\b|\bwas\s+(?:ist|gibt(?:\s+es)?)\s+(?:bei\s+(?:dir|ihnen)\s+)?(?:neu|neues)\b|\bund\s+(?:du|sie)\s*\?|\bwas\s+mach(?:st|en)\s+(?:du|sie)\b|\bwie\s+l[aä]uft(?:'s|\s+es)?\s+bei\s+(?:dir|ihnen)\b/i.test(tail);

  if (!hasReasonForWriting) missing.push("Explain why you are writing to Felix");
  if (!hasWorkOrStudy) missing.push("Write about your work or studies");
  if (!hasFamilyNews) missing.push("Tell Felix something new about your family");
  if (!hasReasonConnector) missing.push("Use at least one reason with weil or denn");
  if (!hasRelevantFinalQuestion) missing.push("At the end ask Felix a relevant personal question about how he is or what is new with him");
  return missing;
}

function a2Day1EndingAdvice(source = "") {
  const genericHelp = source.match(/\bK[oö]nnten\s+Sie\s+mir\s+helfen\s*\?/i);
  if (genericHelp) {
    return `“${genericHelp[0]}” is grammatically possible, but it does not answer the Felix task: no help request is explained, and the question is not about how Felix is or what is new with him. Ask a relevant personal question instead, for example “Wie geht es dir? Was ist bei dir neu?” Then close naturally with “Ich freue mich auf deine Antwort.” or “Schreib mir bald.” before “Viele Grüße”.`;
  }
  return "";
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

function hasConcreteCorrections(result = {}) {
  return (Array.isArray(result.corrections) ? result.corrections : []).some((correction) => {
    if (!correction) return false;
    if (typeof correction === "string") return clean(correction).length > 0;
    return clean(correction.from || correction.to || correction.reason).length > 0;
  });
}

function writingDimensions({
  writingScore,
  completed,
  total,
  wrongRegister,
  genreMismatch,
} = {}) {
  const taskFulfilment = total > 0 ? Math.round((Math.max(0, completed) / total) * 100) : null;
  return {
    taskFulfilment,
    languageControl: numericPercent(writingScore),
    coherence: numericPercent(writingScore),
    registerAndTextType: genreMismatch ? 40 : wrongRegister ? 60 : 100,
  };
}

function markingContradictions({
  result = {},
  task = {},
  currentWritingScore,
  completed,
  total,
  missingTaskPoints = [],
  wrongRegister = false,
} = {}) {
  const issues = [];
  const feedbackText = clean([result.feedback, result.improvementSummary].filter(Boolean).join(" ")).toLowerCase();
  if (currentWritingScore === 0 && completed > 0) {
    issues.push("Writing score is 0 although at least one required task point is completed.");
  }
  if (currentWritingScore >= 95 && missingTaskPoints.length > 0) {
    issues.push("Writing score is near-perfect although required task points are missing.");
  }
  const reportedCompleted = Number(result.taskCompletion?.completed);
  const reportedTotal = Number(result.taskCompletion?.total);
  if (Number.isFinite(reportedCompleted) && Number.isFinite(reportedTotal) && reportedTotal > 0
      && reportedCompleted >= reportedTotal && missingTaskPoints.length > 0) {
    issues.push("AI taskCompletion reports complete work while canonical task evidence shows missing points.");
  }
  if (task.register === "informal" && /(?:maintain|keep|use).{0,30}formal (?:tone|register)|formal tone/.test(feedbackText)) {
    issues.push("Feedback asks for a formal tone although this assignment requires informal register.");
  }
  if (wrongRegister && /register.{0,30}(?:correct|appropriate)|appropriate register/.test(feedbackText)) {
    issues.push("Feedback describes the register as appropriate although the deterministic register check disagrees.");
  }
  return [...new Set(issues)];
}

function calibratedCompleteWritingScore({
  result = {},
  task = {},
  structured = {},
  localMissing = [],
  detectedTextType = {},
  currentWritingScore,
  taskEvidence = [],
} = {}) {
  if (!Number.isFinite(currentWritingScore) || currentWritingScore < 85 || currentWritingScore >= 90) return currentWritingScore;
  if (hasConcreteCorrections(result)) return currentWritingScore;
  if (!writingTextTypesCompatible(task.textType, detectedTextType.detectedType)) return currentWritingScore;

  const configuredTotal = Array.isArray(task.taskPoints) ? task.taskPoints.length : 0;
  const structuredComplete = structured.total > 0
    && structured.completed === structured.total
    && (!configuredTotal || structured.total >= configuredTotal);
  const deterministicFriendshipComplete = task.assignmentKey === "B1-1.2"
    && configuredTotal === 3
    && localMissing.length === 0;
  // Semantic A2/B1 evidence validates task completion; it does not manufacture a higher language score.
  if (task.rubricVersion === A2_WRITING_RUBRIC_VERSION || task.rubricVersion === B1_WRITING_RUBRIC_VERSION) {
    return currentWritingScore;
  }
  if (!structuredComplete && !deterministicFriendshipComplete) return currentWritingScore;
  return 90;
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
  const taskPointEvidence = task.level === "A2"
    ? evaluateWritingTaskEvidence(task, source)
    : task.level === "B1" && task.rubricVersion === B1_WRITING_RUBRIC_VERSION
      ? evaluateB1WritingTaskEvidence(task, source)
      : [];
  const canonicalSemanticMissing = taskPointEvidence.length
    ? missingTaskPointsFromEvidence(taskPointEvidence)
    : [];
  const localMissing = task.level === "B1" && task.rubricVersion !== B1_WRITING_RUBRIC_VERSION && task.assignmentKey === "B1-1.2"
    ? b1FriendshipLocalMissing(source)
    : canonicalSemanticMissing;
  const configuredPointSet = new Set((task.taskPoints || []).map(clean));
  const structuredMissing = taskPointEvidence.length
    ? structured.missing.filter((item) => configuredPointSet.has(clean(item)))
    : structured.missing;
  const missingTaskPoints = [...new Set([...structuredMissing, ...localMissing])];
  const semanticTask = task.rubricVersion === A2_WRITING_RUBRIC_VERSION || task.rubricVersion === B1_WRITING_RUBRIC_VERSION;
  const total = semanticTask
    ? (task.taskPoints?.length || 0)
    : Math.max(structured.total || 0, task.taskPoints?.length || 0, missingTaskPoints.length ? 3 : 0);
  const detectedTextType = detectWritingTextType(source);
  const classifierMismatch = detectedTextType.confidence >= 0.72
    && !writingTextTypesCompatible(task.textType, detectedTextType.detectedType);
  const legacyEssayMismatch = /email|letter|message|invitation/.test(task.textType) && emailBodyLooksLikeOpinionEssay(source);
  const genreMismatch = classifierMismatch || legacyEssayMismatch;
  const wrongRegister = registerMismatch(task, source);
  const hasGuardIssue = missingTaskPoints.length > 0 || genreMismatch || wrongRegister;
  const wordCount = source.split(/\s+/).filter(Boolean).length;
  const suspiciousZeroWriting = currentWritingScore === 0
    && wordCount >= 20
    && Math.max(0, total - missingTaskPoints.length) >= 1
    && !legacyEssayMismatch;
  const localRecoveredWritingScore = suspiciousZeroWriting
    ? numericPercent(heuristicWritingMarker({ level: task.level, partId: "teil2", text: source })?.score)
    : null;
  const effectiveWritingScore = localRecoveredWritingScore && localRecoveredWritingScore > 0
    ? localRecoveredWritingScore
    : currentWritingScore;
  const recoveredSuspiciousZero = suspiciousZeroWriting && effectiveWritingScore > 0;

  if (!hasGuardIssue) {
    const calibratedWritingScore = calibratedCompleteWritingScore({
      result,
      task,
      structured,
      localMissing,
      detectedTextType,
      currentWritingScore: effectiveWritingScore,
      taskEvidence: taskPointEvidence,
    });

    if (calibratedWritingScore === currentWritingScore && !recoveredSuspiciousZero) {
      const completed = semanticTask ? total : (structured.completed ?? total);
      const contradictions = markingContradictions({ result, task, currentWritingScore, completed, total, missingTaskPoints: [], wrongRegister });
      const dimensions = writingDimensions({ writingScore: currentWritingScore, completed, total, wrongRegister, genreMismatch });
      return {
        ...result,
        taskCompletion: semanticTask ? { completed, total, missing: [] } : result.taskCompletion,
        taskPointEvidence,
        writingDimensions: dimensions,
        markingRubricVersion: task.rubricVersion || (task.level === "A2" ? A2_WRITING_RUBRIC_VERSION : task.level === "B1" ? B1_WRITING_RUBRIC_VERSION : "question-aware-v1"),
        status: suspiciousZeroWriting || contradictions.length ? "needs_review" : result.status,
        shouldSendAutomatically: suspiciousZeroWriting || contradictions.length ? false : result.shouldSendAutomatically,
        ai: {
          ...(result.ai || {}),
          questionAwareWritingTask: task,
          detectedWritingTextType: detectedTextType,
          ...(suspiciousZeroWriting ? { suspiciousWritingZero: true } : {}),
          ...(contradictions.length ? { markingContradictions: contradictions } : {}),
        },
      };
    }

    const weightedOutcome = recomputeOutcome(result, task, calibratedWritingScore);
    const completed = semanticTask ? total : (structured.completed ?? total);
    const contradictions = markingContradictions({ result, task, currentWritingScore, completed, total, missingTaskPoints: [], wrongRegister });
    const dimensions = writingDimensions({ writingScore: calibratedWritingScore, completed, total, wrongRegister, genreMismatch });
    return {
      ...result,
      score: weightedOutcome.finalScore,
      finalScore: weightedOutcome.finalScore,
      passed: weightedOutcome.passed,
      scoreBreakdown: weightedOutcome.scoreBreakdown || result.scoreBreakdown || null,
      writingMinimumMet: weightedOutcome.writingMinimumMet,
      markingPolicy: weightedOutcome.policy,
      writingScore: calibratedWritingScore,
      writingScorePercent: calibratedWritingScore,
      parts: updateWritingParts(result.parts, calibratedWritingScore),
      taskCompletion: { completed, total, missing: [] },
      missingTaskPoints: [],
      taskPointEvidence,
      writingDimensions: dimensions,
      markingRubricVersion: task.rubricVersion || (task.level === "A2" ? A2_WRITING_RUBRIC_VERSION : task.level === "B1" ? B1_WRITING_RUBRIC_VERSION : "question-aware-v1"),
      status: contradictions.length ? "needs_review" : result.status,
      shouldSendAutomatically: contradictions.length ? false : result.shouldSendAutomatically,
      ai: {
        ...(result.ai || {}),
        questionAwareWritingTask: task,
        detectedWritingTextType: detectedTextType,
        ...(contradictions.length ? { markingContradictions: contradictions } : {}),
        ...(!recoveredSuspiciousZero && suspiciousZeroWriting ? { suspiciousWritingZero: true } : {}),
        questionAwareWritingCalibration: {
          applied: true,
          originalWritingScore: currentWritingScore,
          ...(recoveredSuspiciousZero ? { recoveredWritingScore: effectiveWritingScore } : {}),
          calibratedWritingScore,
          reason: recoveredSuspiciousZero
            ? "A substantive task-complete response received an impossible zero, so Falowen recovered a local writing score before applying any calibration."
            : "Complete task, correct text type/register, and no concrete writing correction supported a B1/A2 top-band floor.",
        },
      },
    };
  }

  let cap = guardCapForMissing(missingTaskPoints.length, total);
  if (genreMismatch) cap = Math.min(cap, 65);
  if (wrongRegister) cap = Math.min(cap, missingTaskPoints.length ? 60 : 70);
  const guardedWritingScore = Math.min(effectiveWritingScore, cap);

  const completed = Math.max(0, total - missingTaskPoints.length);
  const weightedOutcome = recomputeOutcome(result, task, guardedWritingScore);
  const contradictions = markingContradictions({ result, task, currentWritingScore, completed, total, missingTaskPoints, wrongRegister });
  const dimensions = writingDimensions({ writingScore: guardedWritingScore, completed, total, wrongRegister, genreMismatch });
  const endingAdvice = task.assignmentKey === "A2-1.1" ? a2Day1EndingAdvice(source) : "";
  const issueText = [
    genreMismatch ? `detected ${detectedTextType.detectedType} instead of ${task.textType}` : "",
    wrongRegister ? `the register does not match the requested ${task.register} register` : "",
    missingTaskPoints.length ? `missing task points: ${missingTaskPoints.join("; ")}` : "",
  ].filter(Boolean).join("; ");
  const guardFeedback = [
    `Question-aware writing check: ${issueText}. The writing score is capped at ${guardedWritingScore}% because language quality cannot replace task fulfilment.`,
    endingAdvice,
  ].filter(Boolean).join(" ");

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
    taskPointEvidence,
    writingDimensions: dimensions,
    markingRubricVersion: task.rubricVersion || (task.level === "A2" ? A2_WRITING_RUBRIC_VERSION : task.level === "B1" ? B1_WRITING_RUBRIC_VERSION : "question-aware-v1"),
    feedback: [result.feedback, guardFeedback].filter(Boolean).join(" "),
    improvementSummary: [result.improvementSummary, guardFeedback].filter(Boolean).join(" "),
    status: "needs_review",
    shouldSendAutomatically: false,
    ai: {
      ...(result.ai || {}),
      ...(!recoveredSuspiciousZero && suspiciousZeroWriting ? { suspiciousWritingZero: true } : {}),
      questionAwareWritingTask: task,
      detectedWritingTextType: detectedTextType,
      ...(contradictions.length ? { markingContradictions: contradictions } : {}),
      questionAwareWritingGuard: {
        applied: true,
        suspiciousWritingZero: suspiciousZeroWriting,
        ...(recoveredSuspiciousZero ? { recoveredWritingScore: effectiveWritingScore } : {}),
        originalWritingScore: currentWritingScore,
        guardedWritingScore,
        genreMismatch,
        registerMismatch: wrongRegister,
        missingTaskPoints,
        taskEvidenceSummary: taskEvidenceSummary(taskPointEvidence),
        ...(endingAdvice ? { endingAdvice } : {}),
        detectedWritingTextType: detectedTextType,
      },
    },
  };
}
