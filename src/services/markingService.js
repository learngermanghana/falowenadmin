import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import {
  buildTutorCalibrationEvent,
  compareExaminerResults,
  ensureExplicitWritingLabel,
  hasLikelyUnlabelledWritingBeforeObjective,
  hasWritingEvidence,
} from "../utils/markingIntelligence.js";
import * as base from "./markingServiceBase.js";

export * from "./markingServiceBase.js";

const BLOCKED_SCORE_MESSAGE = "Score save blocked because the final score is 0 or invalid. Please retry the marking before saving.";

function normalizeStudentCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function hasUsableStudentCode(row = {}) {
  const code = normalizeStudentCode(row.studentCode || row.studentcode || row.code);
  if (!code) return false;

  return !new Set([
    "nocode",
    "unknown",
    "unknownstudent",
    "undefined",
    "null",
    "missing",
  ]).has(code);
}

function normalizePercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function scoreValueFromResult(result = {}) {
  return result.finalScore ?? result.score ?? null;
}

function isBlockedScore(value) {
  if (value === "" || value === null || value === undefined) return true;
  const numeric = Number(value);
  return !Number.isFinite(numeric) || numeric <= 0;
}

function assertSavableScore(value) {
  if (!isBlockedScore(value)) return Number(value);
  const saveError = new Error(BLOCKED_SCORE_MESSAGE);
  saveError.code = "MARKING_SCORE_BLOCKED";
  saveError.score = value;
  throw saveError;
}

function savedScoreLabel(receipt = {}, fallbackScore) {
  const numeric = Number(receipt?.row?.score ?? fallbackScore);
  return Number.isFinite(numeric) ? `${Math.round(numeric)}/100` : "unknown score";
}

function withConfirmedScoreMessage(target = {}, scoreLabel) {
  if (!target || typeof target !== "object") return target;
  const prefix = target.success ? `Score saved: ${scoreLabel}.` : `Score attempted: ${scoreLabel}.`;
  const message = String(target.message || "").trim();
  return {
    ...target,
    message: message ? `${prefix} ${message}` : prefix,
  };
}

function stripBoldMarkdown(value = "") {
  return String(value || "").replace(/\*\*/g, "");
}

function cleanLegacyObjectiveTail(feedback = "") {
  let text = String(feedback || "");

  // The old browser-side fallback appended this after the new smart feedback:
  // "Objective score: ... Review these exact answers: ...". Keep the structured
  // 📌/📊/🛠 feedback and remove only the legacy tail.
  text = text.replace(
    /\s*Objective score:\s*\d+\s*\/\s*\d+\s*correct\s*\(\s*\d+\s*%\s*\)\.\s*Review these exact answers:[\s\S]*$/i,
    "",
  );
  text = text.replace(
    /\s*Objective score:\s*\d+\s*\/\s*\d+\s*correct\s*\(\s*\d+\s*%\s*\)\.\s*All objective answers were correct\.\s*$/i,
    "",
  );

  return text;
}

function cleanDuplicateWritingScores(feedback = "", result = {}) {
  let text = String(feedback || "");
  const writingPercent = normalizePercent(result.writingScorePercent ?? result.writingScore);

  if (writingPercent === null) {
    return text;
  }

  const hasWritingHeader = /✍️\s*Writing feedback/i.test(text);
  if (!hasWritingHeader) {
    return text;
  }

  // Remove every AI-generated "Writing score: NN%" phrase, then write one
  // trusted score from the structured marking result. This prevents cases like
  // "Writing score: 60% ... Writing score: 71%" appearing together.
  text = text.replace(/\bWriting score:\s*\d+\s*%\s*\.?/gi, "");
  text = text.replace(
    /✍️\s*Writing feedback\s*-?\s*/i,
    `✍️ Writing feedback - Writing score: ${writingPercent}% `,
  );

  return text;
}

function sanitizeFeedback(feedback = "", result = {}) {
  return cleanDuplicateWritingScores(cleanLegacyObjectiveTail(stripBoldMarkdown(feedback)), result)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeMarkingResult(result = {}) {
  const feedback = sanitizeFeedback(result.feedback || "", result);
  return {
    ...result,
    feedback,
    improvementSummary: stripBoldMarkdown(result.improvementSummary || feedback),
  };
}

function safeFirestoreId(value) {
  return String(value || "")
    .trim()
    .replace(/[/#?[\]]+/g, "_")
    .replace(/_{2,}/g, "_");
}

function primaryConfidence(result = {}) {
  const value = Number(result.confidence);
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.5;
}

function prepareMarkingOptions(options = {}) {
  const originalText = options.submissionText || options.submission?.text || "";
  const preparedText = ensureExplicitWritingLabel(originalText);
  if (preparedText === originalText) return options;

  return {
    ...options,
    submissionText: preparedText,
  };
}

function routeMissedWritingToReview(result = {}, submissionText = "") {
  if (!hasLikelyUnlabelledWritingBeforeObjective(submissionText) || hasWritingEvidence(result)) return result;

  const objectiveScore = normalizePercent(result.objectiveScore);
  const safeFinalScore = objectiveScore ?? normalizePercent(scoreValueFromResult(result)) ?? 0;
  const warning = "A writing section was detected before the objective parts, but no reliable writing score was returned. The writing score was not treated as zero; tutor review is required.";

  return sanitizeMarkingResult({
    ...result,
    score: safeFinalScore,
    finalScore: safeFinalScore,
    writingScore: null,
    writingScorePercent: null,
    status: "needs_review",
    shouldSendAutomatically: false,
    feedback: [result.feedback, warning].filter(Boolean).join(" "),
    improvementSummary: [result.improvementSummary, warning].filter(Boolean).join(" "),
    ai: {
      ...(result.ai || {}),
      unlabelledWritingDetected: true,
      writingScoreMissing: true,
    },
  });
}

async function requestSecondExaminer(options = {}) {
  const originalText = options.submissionText || options.submission?.text || "";
  const payload = {
    submission: options.submission || {},
    referenceEntry: options.referenceEntry || null,
    assignmentKey: options.referenceEntry?.assignmentKey || options.submission?.assignmentKey || options.submission?.assignmentId || "",
    level: options.referenceEntry?.level || options.submission?.level || "",
    submissionText: ensureExplicitWritingLabel(originalText),
    markingMode: "second_examiner",
    secondExaminerInstruction: "Act as an independent second German examiner. Re-mark the submission from scratch using the same answer key and rubric. Do not copy or assume the first examiner's score. Return your own evidence-based result.",
  };

  const response = await fetch("/api/marking/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.status === "error") {
    throw new Error(body?.message || "Second examiner request failed");
  }

  return sanitizeMarkingResult(body.result || body);
}

function mergeSecondExaminer(primary = {}, secondary = null, error = null) {
  const primaryScore = normalizePercent(scoreValueFromResult(primary));

  if (!secondary) {
    const secondExaminer = {
      enabled: true,
      status: "unavailable",
      primaryScore,
      secondaryScore: null,
      scoreDelta: null,
      agreement: "unknown",
      requiresTutorReview: true,
      error: String(error?.message || error || "Second examiner unavailable"),
    };
    return {
      ...primary,
      verifiedAiScore: primaryScore,
      status: "needs_review",
      shouldSendAutomatically: false,
      secondExaminer,
      ai: { ...(primary.ai || {}), secondExaminer },
    };
  }

  const comparison = compareExaminerResults(primary, secondary);
  const agreementConfidence = comparison.scoreDelta === null
    ? 0.5
    : Math.max(0.35, Math.min(1, 1 - (comparison.scoreDelta / 50)));
  const confidence = Math.min(primaryConfidence(primary), primaryConfidence(secondary), agreementConfidence);
  const secondExaminer = {
    ...comparison,
    status: comparison.requiresTutorReview ? "disagreed" : "agreed",
  };

  return {
    ...primary,
    verifiedAiScore: primaryScore,
    confidence: Number(confidence.toFixed(2)),
    status: comparison.requiresTutorReview ? "needs_review" : primary.status,
    shouldSendAutomatically: comparison.requiresTutorReview ? false : Boolean(primary.shouldSendAutomatically),
    secondExaminer,
    ai: { ...(primary.ai || {}), secondExaminer },
  };
}

function hasTutorDecisionMarker(result = {}) {
  return Object.prototype.hasOwnProperty.call(result, "manualOverride");
}

function enrichTutorCalibration(result = {}) {
  if (!hasTutorDecisionMarker(result)) return result;

  const aiScore = result.secondExaminer?.primaryScore ?? result.verifiedAiScore ?? result.aiOriginalScore ?? null;
  const calibration = buildTutorCalibrationEvent({
    aiScore,
    tutorScore: scoreValueFromResult(result),
    aiFeedback: result.aiOriginalFeedback || "",
    tutorFeedback: result.feedback || "",
    secondExaminer: result.secondExaminer || null,
    source: result.tutorCalibration?.source || "marking_page",
  });

  return {
    ...result,
    manualOverride: calibration.manualOverride,
    tutorCalibration: calibration,
  };
}

async function syncIntelligenceAudit({ submissionId, submissionPath, result = {} } = {}) {
  if (!result.secondExaminer && !result.tutorCalibration) return;
  const safeId = safeFirestoreId(submissionId || submissionPath || "");
  if (!safeId) return;

  const patch = {
    updatedAt: new Date().toISOString(),
  };
  if (result.secondExaminer) {
    patch.secondExaminer = result.secondExaminer;
    patch.examinerAgreement = result.secondExaminer.agreement || null;
    patch.secondExaminerRequiresTutorReview = Boolean(result.secondExaminer.requiresTutorReview);
  }
  if (result.tutorCalibration) {
    patch.tutorCalibration = result.tutorCalibration;
    patch.manualOverride = Boolean(result.tutorCalibration.manualOverride);
  }

  await setDoc(doc(db, "aiMarkingAudit", safeId), patch, { merge: true });
}

export async function loadSubmissions(options = {}) {
  const rows = await base.loadSubmissions(options);
  return rows.filter(hasUsableStudentCode);
}

export async function markSubmissionWithAI(options = {}) {
  const originalSubmissionText = options.submissionText || options.submission?.text || "";
  const preparedOptions = prepareMarkingOptions(options);

  let primary = sanitizeMarkingResult(await base.markSubmissionWithAI(preparedOptions));
  if (isBlockedScore(scoreValueFromResult(primary))) {
    console.warn("AI marking returned a zero/invalid score. Retrying once before allowing any save.", {
      score: scoreValueFromResult(primary),
      assignment: options?.submission?.assignment || options?.submission?.assignmentId || options?.submission?.assignmentKey || "",
    });
    primary = sanitizeMarkingResult(await base.markSubmissionWithAI(preparedOptions));
  }

  primary = routeMissedWritingToReview(primary, originalSubmissionText);

  if (isBlockedScore(scoreValueFromResult(primary)) || !hasWritingEvidence(primary)) {
    return primary;
  }

  try {
    const secondary = await requestSecondExaminer(preparedOptions);
    return mergeSecondExaminer(primary, secondary);
  } catch (error) {
    console.warn("Second examiner unavailable; routing writing submission to tutor review.", {
      assignment: options?.submission?.assignment || options?.submission?.assignmentId || options?.submission?.assignmentKey || "",
      message: error?.message || String(error),
    });
    return mergeSecondExaminer(primary, null, error);
  }
}

export async function saveMarkingResult(options = {}) {
  const result = enrichTutorCalibration(options.result || {});
  assertSavableScore(scoreValueFromResult(result));
  const response = await base.saveMarkingResult({ ...options, result });

  try {
    await syncIntelligenceAudit({
      submissionId: options.submissionId,
      submissionPath: options.submissionPath,
      result,
    });
  } catch (error) {
    console.warn("Could not sync second-examiner/calibration metadata into AI audit.", error);
  }

  return response;
}

export async function saveScoreRow(options = {}) {
  assertSavableScore(options.score);
  const receipt = await base.saveScoreRow(options);
  const scoreLabel = savedScoreLabel(receipt, options.score);

  return {
    ...receipt,
    savedScore: Number(receipt?.row?.score ?? options.score),
    savedScoreLabel: scoreLabel,
    sheet: withConfirmedScoreMessage(receipt.sheet, scoreLabel),
    firestore: withConfirmedScoreMessage(receipt.firestore, scoreLabel),
  };
}
