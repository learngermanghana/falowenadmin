import * as base from "./markingServiceBase.js";

export * from "./markingServiceBase.js";

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
  const result = await base.markSubmissionWithAI(options);
  return sanitizeMarkingResult(result);
}
