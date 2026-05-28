const PART_ID_PATTERN = /teil\s*[1-4]|part\s*[1-4]|lesen|h[oö]ren|hoeren|schreiben|writing|reading|listening/i;
const ANSWER_KEY_PATTERN = /^(?:answer|antwort|frage|question|q|nr\.?)[\s_-]*\d{1,3}$/i;

export function safeRegistryId(value) {
  return String(value || "")
    .trim()
    .replace(/[/#?[\]]+/g, "_")
    .replace(/_{2,}/g, "_");
}

export function inferLevelFromAssignment(value = "") {
  const match = String(value || "").match(/\b(A1|A2|B1)\b/i);
  return match ? match[1].toUpperCase() : "";
}

export function inferPartId(value = "") {
  const normalized = String(value || "").toLowerCase().replace(/ö/g, "o");
  if (/teil\s*2|part\s*2|schreiben|writing/.test(normalized)) return "teil2";
  if (/teil\s*3|part\s*3|lesen|reading/.test(normalized)) return "teil3";
  if (/teil\s*4|part\s*4|horen|hoeren|listening/.test(normalized)) return "teil4";
  if (/teil\s*1|part\s*1/.test(normalized)) return "teil1";
  return "unknown";
}

function inferQuestionNumber(key = "", fallbackIndex = 0, value = "") {
  const fromValue = String(value || "").match(/(?:frage|answer|antwort|nr\.?|q)\s*(\d{1,3})\b/i);
  if (fromValue?.[1]) return fromValue[1];
  const fromKey = String(key || "").match(/(\d{1,3})/);
  if (fromKey?.[1]) return fromKey[1];
  return String(fallbackIndex + 1);
}

function stripLeadingQuestionLabel(value = "") {
  return String(value || "")
    .replace(/^\s*(?:frage|answer|antwort|nr\.?|q)\s*\d{1,3}\s*[).:-]?\s*/i, "")
    .replace(/^\s*anzeige\s*:\s*/i, "Anzeige ")
    .trim();
}

function parseLetterAndText(value = "") {
  const cleaned = stripLeadingQuestionLabel(value);
  const optionMatch = cleaned.match(/^([A-Z])\s*[).:-]?\s+(.+)$/i) || cleaned.match(/^([A-Z])\s*[).:-]?$/i);
  if (optionMatch) {
    return {
      correctLetter: optionMatch[1].toUpperCase(),
      correctText: String(optionMatch[2] || "").trim(),
    };
  }

  const AnzeigeMatch = cleaned.match(/^Anzeige\s+([A-Z])$/i);
  if (AnzeigeMatch) {
    return { correctLetter: AnzeigeMatch[1].toUpperCase(), correctText: `Anzeige ${AnzeigeMatch[1].toUpperCase()}` };
  }

  const booleanMap = {
    true: "Richtig",
    false: "Falsch",
    richtig: "Richtig",
    falsch: "Falsch",
    wahr: "Wahr",
  };
  const booleanKey = cleaned.toLowerCase();
  if (booleanMap[booleanKey]) {
    return { correctLetter: booleanKey === "false" || booleanKey === "falsch" ? "F" : "R", correctText: booleanMap[booleanKey] };
  }

  return { correctLetter: "", correctText: cleaned };
}

function uniq(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

export function normalizeSingleAnswer(key, value, index = 0) {
  const rawCorrectAnswer = String(value ?? "").trim();
  const questionKey = String(key || `Answer${index + 1}`);
  const questionNumber = inferQuestionNumber(questionKey, index, rawCorrectAnswer);
  const { correctLetter, correctText } = parseLetterAndText(rawCorrectAnswer);
  const acceptedAnswers = uniq([
    correctLetter,
    correctText,
    correctLetter && correctText ? `${correctLetter} ${correctText}` : "",
    rawCorrectAnswer.replace(/[)_:.-]+/g, " ").replace(/\s+/g, " "),
  ]);

  return {
    questionKey,
    questionNumber,
    rawCorrectAnswer,
    raw: rawCorrectAnswer,
    correctLetter,
    correctText,
    acceptedAnswers,
  };
}

function isPlainAnswerValue(value) {
  return ["string", "number", "boolean"].includes(typeof value) || value == null;
}

function looksLikeFlatAnswerMap(value = {}) {
  const entries = Object.entries(value || {});
  if (!entries.length) return true;
  return entries.every(([key, nested]) => ANSWER_KEY_PATTERN.test(key) && isPlainAnswerValue(nested));
}

function flattenPlainAnswers(value, prefix = []) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [{ key: prefix.join("."), value: String(value) }];
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => flattenPlainAnswers(nested, [...prefix, key]));
}

function normalizePart(partId, answers = {}) {
  const entries = flattenPlainAnswers(answers).map((entry, index) => normalizeSingleAnswer(entry.key, entry.value, index));
  return {
    partId,
    answers: entries,
    answerCount: entries.length,
  };
}

function splitAnswersIntoParts(answers = {}) {
  if (!answers || typeof answers !== "object") return {};
  if (looksLikeFlatAnswerMap(answers)) {
    return { main: normalizePart("main", answers) };
  }

  const explicitPartKeys = Object.keys(answers).filter((key) => PART_ID_PATTERN.test(key));
  if (explicitPartKeys.length) {
    return explicitPartKeys.reduce((parts, key) => {
      const partId = inferPartId(key);
      parts[partId] = normalizePart(partId, answers[key]);
      return parts;
    }, {});
  }

  return { main: normalizePart("main", answers) };
}

function countPartAnswers(parts = {}) {
  return Object.values(parts).reduce((sum, part) => sum + Number(part?.answerCount || part?.answers?.length || 0), 0);
}

export function validateAnswerDictionary(dictionary = {}) {
  const rows = Array.isArray(dictionary)
    ? dictionary.map((entry, index) => [`entry-${index + 1}`, entry])
    : Object.entries(dictionary || {});

  return rows.reduce((summary, [sourceKey, sourceEntry]) => {
    const assignmentId = sourceEntry?.assignment_id || sourceEntry?.assignmentId || sourceEntry?.assignmentKey;
    if (!assignmentId) {
      summary.warnings.push(`Missing assignment_id for dictionary entry "${sourceKey}".`);
    }
    if (!sourceEntry?.answers || typeof sourceEntry.answers !== "object" || !flattenPlainAnswers(sourceEntry.answers).length) {
      summary.warnings.push(`Missing answers for dictionary entry "${sourceKey}"${assignmentId ? ` (${assignmentId})` : ""}.`);
    }
    return summary;
  }, { totalAssignments: rows.length, warnings: [] });
}

export function normalizeAnswerKeyEntry(sourceKey, sourceEntry = {}) {
  const assignmentKey = String(sourceEntry.assignment_id || sourceEntry.assignmentId || sourceEntry.assignmentKey || "").trim();
  const title = String(sourceEntry.title || sourceEntry.assignment || sourceKey || assignmentKey).trim();
  const level = inferLevelFromAssignment(assignmentKey);
  const format = String(sourceEntry.format || "objective").toLowerCase();
  const rawAnswers = sourceEntry.answers || {};
  const parts = splitAnswersIntoParts(rawAnswers);
  const totalAnswers = countPartAnswers(parts);

  return {
    assignmentKey,
    title,
    level,
    format,
    answerUrl: sourceEntry.answerUrl || sourceEntry.answer_url || "",
    sheetUrl: sourceEntry.sheetUrl || sourceEntry.sheet_url || "",
    rawAnswers,
    parts,
    totalAnswers,
  };
}

export function normalizeAnswerDictionary(dictionary = {}) {
  const entries = Array.isArray(dictionary)
    ? dictionary.map((entry, index) => [entry.assignment_id || entry.assignmentId || entry.assignmentKey || entry.assignment || `entry-${index + 1}`, entry])
    : Object.entries(dictionary || {});

  return entries
    .map(([key, value]) => normalizeAnswerKeyEntry(key, value))
    .filter((entry) => entry.assignmentKey && entry.totalAnswers > 0);
}
