import { buildEvidenceEssayFeedback } from "./essayFeedbackEvidence.js";

function clampPercent(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizePartId(value = "") {
  const raw = String(value || "").trim().toLowerCase().replace(/ö/g, "o");
  const numbered = raw.match(/^(?:teil|part)\s*([1-4])$/);
  if (numbered) return `teil${numbered[1]}`;
  if (/^(?:schreiben|writing)$/.test(raw)) return "teil2";
  if (/^(?:lesen|reading)$/.test(raw)) return "teil3";
  if (/^(?:horen|hoeren|listening)$/.test(raw)) return "teil4";
  return raw;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function humanList(values = []) {
  const items = unique(values.map((value) => String(value || "").trim()).filter(Boolean));
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function sentence(value = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function partLabel(partId = "") {
  const match = normalizePartId(partId).match(/^teil\s*([1-4])$/i) || normalizePartId(partId).match(/^teil([1-4])$/i);
  return match ? `Teil ${match[1]}` : "";
}

function readQuestionIdentity(key = "", detail = {}) {
  const rawKey = String(key || detail.question || detail.questionNumber || detail.key || "").trim();
  const partFromDetail = partLabel(detail.partId || detail.part || "");
  const dotted = rawKey.match(/^(teil\s*[1-4]|teil[1-4])[._\s-]*(\d+)$/i);
  if (dotted) return { part: partLabel(dotted[1]), question: dotted[2] };
  const question = rawKey.match(/(\d+)/)?.[1] || String(detail.questionNumber || detail.question || "").match(/(\d+)/)?.[1] || "";
  return { part: partFromDetail, question };
}

function objectiveDetailRows(result = {}) {
  const rows = [];
  if (result.objectiveDetails && typeof result.objectiveDetails === "object" && !Array.isArray(result.objectiveDetails)) {
    Object.entries(result.objectiveDetails).forEach(([key, detail]) => {
      if (!detail || typeof detail !== "object") return;
      const identity = readQuestionIdentity(key, detail);
      rows.push({ ...identity, correct: detail.correct === true });
    });
  }

  if (Array.isArray(result.wrongAnswers)) {
    result.wrongAnswers.forEach((detail, index) => {
      const identity = readQuestionIdentity(detail?.question || detail?.questionNumber || `${index + 1}`, detail || {});
      rows.push({ ...identity, correct: false });
    });
  }
  return rows;
}

function uniqueObjectiveRows(result = {}) {
  const rowsByIdentity = new Map();
  objectiveDetailRows(result).forEach((row, index) => {
    const key = row.question ? `${row.part || "main"}:${row.question}` : `row:${index}`;
    const previous = rowsByIdentity.get(key);
    if (!previous || row.correct === false) rowsByIdentity.set(key, row);
  });
  return [...rowsByIdentity.values()];
}

function authoritativeWrongRows(result = {}) {
  if (Array.isArray(result.wrongAnswers)) {
    const rowsByIdentity = new Map();
    result.wrongAnswers.forEach((detail, index) => {
      const identity = readQuestionIdentity(detail?.question || detail?.questionNumber || `${index + 1}`, detail || {});
      if (!identity.question) return;
      const key = `${identity.part || "main"}:${identity.question}`;
      rowsByIdentity.set(key, { ...identity, correct: false });
    });
    return [...rowsByIdentity.values()];
  }

  return uniqueObjectiveRows(result).filter((row) => !row.correct && row.question);
}

function groupedWrongQuestions(result = {}) {
  const groups = new Map();
  authoritativeWrongRows(result).forEach((row) => {
    const key = row.part || "main";
    const current = groups.get(key) || [];
    current.push(row.question);
    groups.set(key, current);
  });
  return groups;
}

function perfectObjectiveParts(result = {}) {
  const rows = uniqueObjectiveRows(result);
  const wrongRows = authoritativeWrongRows(result);
  const groups = new Map();
  rows.filter((row) => row.part).forEach((row) => {
    const current = groups.get(row.part) || [];
    current.push(row.correct);
    groups.set(row.part, current);
  });
  return [...groups.entries()]
    .filter(([part, statuses]) => statuses.length && statuses.every(Boolean) && !wrongRows.some((row) => row.part === part))
    .map(([part]) => part);
}

function resolveObjectiveCorrect(result = {}, objectiveTotal = 0, objectiveScore = null) {
  const total = Number(objectiveTotal || 0);
  if (total > 0 && objectiveScore !== null) {
    return Math.max(0, Math.min(total, Math.round((objectiveScore / 100) * total)));
  }

  const rawStatedCorrect = result.objectiveCorrect;
  if (rawStatedCorrect !== null && rawStatedCorrect !== undefined && rawStatedCorrect !== "") {
    const statedCorrect = Number(rawStatedCorrect);
    if (Number.isFinite(statedCorrect)) {
      return Math.max(0, total > 0 ? Math.min(total, statedCorrect) : statedCorrect);
    }
  }

  const rows = uniqueObjectiveRows(result);
  if (total > 0 && rows.length) {
    return Math.max(0, Math.min(total, total - authoritativeWrongRows(result).length));
  }
  return 0;
}

function looksLikeFreeText(submissionText = "") {
  const text = String(submissionText || "");
  const sentenceCount = (text.match(/[.!?]/g) || []).length;
  const firstPerson = /\b(?:ich|mir|mich|mein|meine|wir|uns)\b/i.test(text);
  const greeting = /\b(?:hallo|lieber|liebe|sehr geehrte|guten tag)\b/i.test(text);
  return sentenceCount >= 2 && (firstPerson || greeting);
}

function looksLikeObjectiveAnswerList(submissionText = "") {
  const lines = String(submissionText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) return false;

  const objectiveLines = lines.filter((line) => {
    if (!/^\d{1,3}\s*[.)-]?\s*/.test(line)) return false;
    return /(?:\/\s*)?[A-FX]\s*$/i.test(line)
      || /^\d{1,3}\s*[.)-]?\s*[A-FX]\s*$/i.test(line);
  });

  return objectiveLines.length / lines.length >= 0.8;
}

function followsCommaSalutation(submissionText = "", snippet = "") {
  const lines = String(submissionText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const target = String(snippet || "").replace(/[…]+$/, "").replace(/[.!?]+$/, "").trim().toLocaleLowerCase("de");
  if (!target) return false;

  for (let index = 1; index < lines.length; index += 1) {
    const current = lines[index].replace(/[.!?]+$/, "").trim().toLocaleLowerCase("de");
    const previous = lines[index - 1];
    const isSalutation = /^(?:lieber|liebe|sehr geehrte(?:r|n)?|hallo)\b.*,$/i.test(previous);
    if (isSalutation && (current === target || current.startsWith(target) || target.startsWith(current))) return true;
  }
  return false;
}

function sanitizeFalseWritingFeedback(feedback = "", submissionText = "") {
  let text = String(feedback || "");

  text = text.replace(
    /\s*(?:Next step:\s*)?add one more (?:clear )?detail to\s*[“"]([^”"]+)[”"]\.?/gi,
    "",
  );

  text = text.replace(
    /\s*(?:Review exact wording:\s*)?Start this sentence with a capital letter:\s*[“"]([^”"]+)[”"]\.?/gi,
    (match, snippet) => (followsCommaSalutation(submissionText, snippet) ? "" : match),
  );

  return text
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim();
}

function writingCorrection(result = {}) {
  const candidates = [
    ...(Array.isArray(result.corrections) ? result.corrections : []),
    ...(Array.isArray(result.writingCorrections) ? result.writingCorrections : []),
  ];
  return candidates.find((item) => {
    if (!item || typeof item !== "object") return false;
    const part = normalizePartId(item.partId || item.part || "");
    if (item.question || item.questionNumber || item.key || part === "teil3" || part === "teil4") return false;
    return Boolean(item.from || item.original || item.student || item.error) && Boolean(item.to || item.corrected || item.improved || item.correction);
  }) || null;
}

function writingTip(submissionText = "", result = {}) {
  const text = String(submissionText || "");
  if (looksLikeObjectiveAnswerList(text)) return "";

  if (/vorfreue\s+mich/i.test(text) || /freue\s+mich[^.!?]{0,35}freue\s+mich/i.test(text)) {
    return "Also check your writing before submitting to avoid repeated wording such as “vorfreue mich.”";
  }
  if (/\bjahre\b/.test(text)) {
    return "Your short introduction is clear and easy to understand. Remember that German nouns are capitalized, so write “Ich bin 37 Jahre alt.”";
  }

  const correction = writingCorrection(result);
  if (correction) {
    const from = String(correction.from || correction.original || correction.student || correction.error || "").trim();
    const to = String(correction.to || correction.corrected || correction.improved || correction.correction || "").trim();
    if (from && to && from.length <= 90 && to.length <= 120) return `Also check this writing point: write “${to}” instead of “${from}.”`;
  }

  return looksLikeFreeText(text) ? "Your free-text response is clear; read it through once more before submitting to catch small language mistakes." : "";
}

export function assignmentHasScoredWriting(referenceEntry = {}) {
  const writingParts = [
    ...(Array.isArray(referenceEntry.writingParts) ? referenceEntry.writingParts : []),
    ...(Array.isArray(referenceEntry.aiGradedParts) ? referenceEntry.aiGradedParts : []),
  ].map(normalizePartId);
  if (writingParts.includes("teil2")) return true;

  const grading = Object.entries(referenceEntry.partGrading || {})
    .find(([partId]) => normalizePartId(partId) === "teil2")?.[1] || null;
  if (String(grading?.gradingMode || "").toLowerCase() === "ai_written_response") return true;

  const assignmentKey = String(referenceEntry.assignmentKey || referenceEntry.assignmentId || referenceEntry.assignment_id || "").trim().toUpperCase();
  const level = String(referenceEntry.level || "").trim().toUpperCase();
  const isA2OrB1 = /^(A2|B1)(?:[-_.]|$)/.test(assignmentKey) || /^(A2|B1)$/.test(level);
  const expectedParts = Array.isArray(referenceEntry.expectedParts)
    ? referenceEntry.expectedParts.map(normalizePartId)
    : [];
  return isA2OrB1 && expectedParts.includes("teil2");
}

export function enforceRegisteredWritingScore(result = {}, referenceEntry = {}) {
  if (assignmentHasScoredWriting(referenceEntry)) return result;

  const objectiveTotal = Number(result.objectiveTotal || 0);
  const objectiveScore = clampPercent(result.objectiveScore);
  if (!objectiveTotal || objectiveScore === null) return result;

  const ignoredWritingScore = result.writingScorePercent ?? result.writingScore ?? null;
  return {
    ...result,
    score: objectiveScore,
    finalScore: objectiveScore,
    passed: objectiveScore >= 60,
    writingScore: null,
    writingScorePercent: null,
    maxWritingScore: null,
    status: "marked",
    shouldSendAutomatically: false,
    ai: {
      ...(result.ai || {}),
      ignoredUnregisteredWritingScore: ignoredWritingScore !== null,
      ignoredWritingScore,
      scoringRule: "Objective-only assignment: unregistered free text cannot lower the final score.",
    },
  };
}

export function buildNaturalStudentFeedback(result = {}, submissionText = "") {
  const name = String(result.studentName || result.name || "").trim();
  const objectiveTotal = Number(result.objectiveTotal || 0);
  const objectiveScore = clampPercent(result.objectiveScore);
  const objectiveCorrect = resolveObjectiveCorrect(result, objectiveTotal, objectiveScore);
  const wrongGroups = groupedWrongQuestions(result);
  const perfectParts = perfectObjectiveParts(result);
  const objectiveSentences = [];

  const strongestPart = perfectParts.includes("Teil 4") ? "Teil 4" : perfectParts[0];
  if (strongestPart) {
    objectiveSentences.push(`${strongestPart} is excellent, with all answers correct`);
  } else if (objectiveTotal > 0) {
    objectiveSentences.push(`You answered ${objectiveCorrect} of ${objectiveTotal} objective questions correctly`);
  }

  const groupedEntries = [...wrongGroups.entries()];
  if (groupedEntries.length === 1) {
    const [part, questions] = groupedEntries[0];
    const prefix = part === "main" ? "" : `In ${part}, `;
    objectiveSentences.push(`${prefix}${part === "main" ? "Review" : "review"} question${questions.length === 1 ? "" : "s"} ${humanList(questions)} carefully`);
  } else if (groupedEntries.length > 1) {
    const descriptions = groupedEntries.map(([part, questions]) => `${part === "main" ? "questions" : part} ${humanList(questions)}`);
    objectiveSentences.push(`Review ${humanList(descriptions)} carefully`);
  }

  const essayFeedback = buildEvidenceEssayFeedback({ result, submissionText, objectiveSentences });
  if (essayFeedback) return sanitizeFalseWritingFeedback(essayFeedback, submissionText);

  const sentences = [];
  const opening = objectiveScore !== null && objectiveScore >= 80 ? "Good work" : objectiveScore !== null && objectiveScore >= 60 ? "Good progress" : "Keep working steadily";
  sentences.push(`${opening}${name ? `, ${name}` : ""}.`);
  objectiveSentences.forEach((value) => sentences.push(sentence(value)));

  const tip = writingTip(submissionText, result);
  if (tip) sentences.push(tip);

  const comment = sentences.join(" ").replace(/\s+/g, " ").trim();
  return sanitizeFalseWritingFeedback(comment.split(/\s+/).slice(0, 60).join(" "), submissionText);
}
