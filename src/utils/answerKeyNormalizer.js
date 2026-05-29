const PART_ID_PATTERN = /teil\s*[1-4]|part\s*[1-4]|lesen|h[oö]ren|hoeren|schreiben|writing|reading|listening/i;
const ANSWER_KEY_PATTERN = /^(?:answer|antwort|frage|question|q|nr\.?)?[\s_-]*\d{1,3}$/i;
const VALID_PART_IDS = new Set(["main", "teil1", "teil2", "teil3", "teil4"]);

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

function normalizePartId(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (VALID_PART_IDS.has(raw)) return raw;
  if (/main|flat/.test(raw)) return "main";
  const inferred = inferPartId(raw);
  return VALID_PART_IDS.has(inferred) ? inferred : "";
}

function normalizePartList(value, fallback = []) {
  const explicit = Array.isArray(value)
    ? value.map(normalizePartId).filter((partId) => VALID_PART_IDS.has(partId))
    : [];
  if (explicit.length) return [...new Set(explicit)];
  return [...new Set((fallback || []).map(normalizePartId).filter(Boolean))];
}

export function normalizeExpectedParts(value, parts = {}) {
  const partIdsFromAnswers = Object.keys(parts || {}).filter((partId) => VALID_PART_IDS.has(partId));
  const explicit = normalizePartList(value);
  if (explicit.length) return explicit;
  return partIdsFromAnswers.length ? partIdsFromAnswers : ["main"];
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

function defaultPartGrading({ expectedParts = [], referenceAnswerParts = [], writingParts = [], excludedParts = [], sourcePartGrading = {} }) {
  const referenceSet = new Set(referenceAnswerParts);
  const writingSet = new Set(writingParts);
  const excludedSet = new Set(excludedParts);
  return expectedParts.reduce((grading, partId) => {
    if (excludedSet.has(partId)) return grading;
    const provided = sourcePartGrading?.[partId] || {};
    if (writingSet.has(partId)) {
      grading[partId] = {
        label: provided.label || "Teil 2 Schreiben",
        hasReferenceAnswers: false,
        gradingMode: provided.gradingMode || "ai_written_response",
        instruction: provided.instruction || "Teil 2 is a Schreiben/writing part. There is no fixed reference answer in the answer key. Do not mark the student wrong or give 0 because reference answers are missing. Grade with AI using the writing prompt, CEFR level, task completion, grammar, vocabulary, structure, and clarity.",
        ...provided,
      };
      return grading;
    }
    grading[partId] = {
      label: provided.label || partId,
      hasReferenceAnswers: provided.hasReferenceAnswers ?? referenceSet.has(partId),
      gradingMode: provided.gradingMode || "answer_key",
      instruction: provided.instruction || "Grade this part against the reference answers in answers.",
      ...provided,
    };
    return grading;
  }, {});
}

function normalizeSourcePartGrading(sourcePartGrading = {}) {
  if (!sourcePartGrading || typeof sourcePartGrading !== "object") return {};
  return Object.entries(sourcePartGrading).reduce((acc, [key, value]) => {
    const partId = normalizePartId(key);
    if (!partId || !value || typeof value !== "object") return acc;
    acc[partId] = value;
    return acc;
  }, {});
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
  const isA2OrB1 = /^(A2|B1)-/i.test(assignmentKey);
  const explicitWritingParts = normalizePartList(sourceEntry.writingParts || sourceEntry.writing_parts);
  const writingParts = explicitWritingParts.length ? explicitWritingParts : (isA2OrB1 ? ["teil2"] : []);
  const excludedParts = normalizePartList(sourceEntry.excludedParts || sourceEntry.excluded_parts);
  const referenceAnswerParts = normalizePartList(
    sourceEntry.referenceAnswerParts || sourceEntry.reference_answer_parts,
    Object.keys(parts || {}).filter((partId) => !writingParts.includes(partId) && !excludedParts.includes(partId)),
  );
  const expectedParts = normalizeExpectedParts(
    sourceEntry.expectedParts || sourceEntry.expected_parts,
    parts,
  );
  const normalizedExpectedParts = [...new Set([...expectedParts, ...writingParts, ...referenceAnswerParts].filter((partId) => !excludedParts.includes(partId)))];
  const aiGradedParts = normalizePartList(sourceEntry.aiGradedParts || sourceEntry.ai_graded_parts, writingParts);
  const sourcePartGrading = normalizeSourcePartGrading(sourceEntry.partGrading || sourceEntry.part_grading);
  const partGrading = defaultPartGrading({
    expectedParts: normalizedExpectedParts,
    referenceAnswerParts,
    writingParts,
    excludedParts,
    sourcePartGrading,
  });
  const answerLayout = String(
    sourceEntry.answerLayout ||
      sourceEntry.answer_layout ||
      (normalizedExpectedParts.includes("main") ? "flat" : "multipart"),
  ).trim();

  return {
    assignmentKey,
    title,
    level,
    format,
    answerUrl: sourceEntry.answerUrl || sourceEntry.answer_url || "",
    sheetUrl: sourceEntry.sheetUrl || sourceEntry.sheet_url || "",
    rawAnswers,
    parts,
    expectedParts: normalizedExpectedParts,
    excludedParts,
    writingParts,
    aiGradedParts,
    referenceAnswerParts,
    answerLayout,
    partGrading,
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
