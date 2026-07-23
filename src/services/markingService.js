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

export async function loadSubmissions(options = {}) {
  const rows = await base.loadSubmissions(options);
  return rows.filter(hasUsableStudentCode);
}

export async function markSubmissionWithAI(options = {}) {
  const firstResult = sanitizeMarkingResult(await base.markSubmissionWithAI(options));
  if (!isBlockedScore(scoreValueFromResult(firstResult))) return firstResult;

  console.warn("AI marking returned a zero/invalid score. Retrying once before allowing any save.", {
    score: scoreValueFromResult(firstResult),
    assignment: options?.submission?.assignment || options?.submission?.assignmentId || options?.submission?.assignmentKey || "",
  });

  return sanitizeMarkingResult(await base.markSubmissionWithAI(options));
}

export async function saveMarkingResult(options = {}) {
  assertSavableScore(scoreValueFromResult(options.result || {}));
  return base.saveMarkingResult(options);
}

export async function saveScoreRow(options = {}) {
  assertSavableScore(options.score);
  return base.saveScoreRow(options);
}
