var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/a1FamilyRecordingReference.js
var a1FamilyRecordingReference_exports = {};
__export(a1FamilyRecordingReference_exports, {
  GRAMMAR_REVISION: () => GRAMMAR_REVISION,
  REVISION: () => REVISION,
  familyGrading: () => familyGrading,
  familyRecordingReference: () => familyRecordingReference
});
module.exports = __toCommonJS(a1FamilyRecordingReference_exports);

// src/utils/answerKeyNormalizer.js
var PART_ID_PATTERN = /teil\s*[1-4]|part\s*[1-4]|lesen|h[oö]ren|hoeren|schreiben|writing|reading|listening/i;
var ANSWER_KEY_PATTERN = /^(?:answer|antwort|frage|aufgabe|task|exercise|question|q|nr\.?)?[\s_-]*\d{1,3}$/i;
var VALID_PART_IDS = /* @__PURE__ */ new Set(["main", "teil1", "teil2", "teil3", "teil4"]);
function inferLevelFromAssignment(value = "") {
  const match = String(value || "").match(/\b(A1|A2|B1)\b/i);
  return match ? match[1].toUpperCase() : "";
}
function inferPartId(value = "") {
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
  const explicit = Array.isArray(value) ? value.map(normalizePartId).filter((partId) => VALID_PART_IDS.has(partId)) : [];
  if (explicit.length) return [...new Set(explicit)];
  return [...new Set((fallback || []).map(normalizePartId).filter(Boolean))];
}
function normalizeExpectedParts(value, parts = {}) {
  const partIdsFromAnswers = Object.keys(parts || {}).filter((partId) => VALID_PART_IDS.has(partId));
  const explicit = normalizePartList(value);
  if (explicit.length) return explicit;
  return partIdsFromAnswers.length ? partIdsFromAnswers : ["main"];
}
function inferQuestionNumber(key = "", fallbackIndex = 0, value = "") {
  const fromValue = String(value || "").match(/(?:frage|answer|antwort|aufgabe|task|exercise|nr\.?|q)\s*(\d{1,3})\b/i);
  if (fromValue?.[1]) return fromValue[1];
  const fromKey = String(key || "").match(/(\d{1,3})/);
  if (fromKey?.[1]) return fromKey[1];
  return String(fallbackIndex + 1);
}
function stripLeadingQuestionLabel(value = "") {
  return String(value || "").replace(/^\s*(?:frage|answer|antwort|aufgabe|task|exercise|nr\.?|q)\s*\d{1,3}\s*[).:-]?\s*/i, "").replace(/^\s*anzeige\s*:\s*/i, "Anzeige ").trim();
}
function parseLetterAndText(value = "") {
  const cleaned = stripLeadingQuestionLabel(value);
  const optionMatch = cleaned.match(/^([A-Z])\s*[).:-]?\s+(.+)$/i) || cleaned.match(/^([A-Z])\s*[).:-]?$/i);
  if (optionMatch) {
    return {
      correctLetter: optionMatch[1].toUpperCase(),
      correctText: String(optionMatch[2] || "").trim()
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
    wahr: "Wahr"
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
function normalizeSingleAnswer(key, value, index = 0) {
  const rawCorrectAnswer = String(value ?? "").trim();
  const questionKey = String(key || `Answer${index + 1}`);
  const questionNumber = inferQuestionNumber(questionKey, index, rawCorrectAnswer);
  const { correctLetter, correctText } = parseLetterAndText(rawCorrectAnswer);
  const acceptedAnswers = uniq([
    correctLetter,
    correctText,
    correctLetter && correctText ? `${correctLetter} ${correctText}` : "",
    rawCorrectAnswer.replace(/[)_:.-]+/g, " ").replace(/\s+/g, " ")
  ]);
  return {
    questionKey,
    questionNumber,
    rawCorrectAnswer,
    raw: rawCorrectAnswer,
    correctLetter,
    correctText,
    acceptedAnswers
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
    answerCount: entries.length
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
        ...provided
      };
      return grading;
    }
    grading[partId] = {
      label: provided.label || partId,
      hasReferenceAnswers: provided.hasReferenceAnswers ?? referenceSet.has(partId),
      gradingMode: provided.gradingMode || "answer_key",
      instruction: provided.instruction || "Grade this part against the reference answers in answers.",
      ...provided
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
function normalizeAnswerKeyEntry(sourceKey, sourceEntry = {}) {
  const assignmentKey = String(sourceEntry.assignment_id || sourceEntry.assignmentId || sourceEntry.assignmentKey || "").trim();
  const title = String(sourceEntry.title || sourceEntry.assignment || sourceKey || assignmentKey).trim();
  const level = inferLevelFromAssignment(assignmentKey);
  const rawAnswers = sourceEntry.answers || {};
  const placeholderValues = flattenPlainAnswers(rawAnswers).map((entry) => String(entry.value || "").trim().toLowerCase());
  const placeholderWriting = placeholderValues.length > 0 && placeholderValues.every((value) => /^(read|see|check) (the )?(comment|comments|instructions?)( for (the )?answers?)?$/.test(value));
  const format = String(sourceEntry.format || (placeholderWriting ? "writing" : "objective")).toLowerCase();
  const parts = splitAnswersIntoParts(rawAnswers);
  const totalAnswers = countPartAnswers(parts);
  const isA2OrB1 = /^(A2|B1)-/i.test(assignmentKey);
  const hasWritingPartsDeclaration = Array.isArray(sourceEntry.writingParts) || Array.isArray(sourceEntry.writing_parts);
  const explicitWritingParts = normalizePartList(sourceEntry.writingParts || sourceEntry.writing_parts);
  const writingParts = hasWritingPartsDeclaration ? explicitWritingParts : placeholderWriting ? ["main"] : isA2OrB1 ? ["teil2"] : [];
  const excludedParts = normalizePartList(sourceEntry.excludedParts || sourceEntry.excluded_parts);
  const referenceAnswerParts = normalizePartList(
    sourceEntry.referenceAnswerParts || sourceEntry.reference_answer_parts,
    Object.keys(parts || {}).filter((partId) => !writingParts.includes(partId) && !excludedParts.includes(partId))
  );
  const expectedParts = normalizeExpectedParts(
    sourceEntry.expectedParts || sourceEntry.expected_parts,
    parts
  );
  const normalizedExpectedParts = [...new Set([...expectedParts, ...writingParts, ...referenceAnswerParts].filter((partId) => !excludedParts.includes(partId)))];
  const aiGradedParts = normalizePartList(sourceEntry.aiGradedParts || sourceEntry.ai_graded_parts, writingParts);
  const sourcePartGrading = normalizeSourcePartGrading(sourceEntry.partGrading || sourceEntry.part_grading);
  const partGrading = defaultPartGrading({
    expectedParts: normalizedExpectedParts,
    referenceAnswerParts,
    writingParts,
    excludedParts,
    sourcePartGrading
  });
  const answerLayout = String(
    sourceEntry.answerLayout || sourceEntry.answer_layout || (normalizedExpectedParts.includes("main") ? "flat" : "multipart")
  ).trim();
  return {
    assignmentKey,
    title,
    level,
    format,
    answerUrl: sourceEntry.answerUrl || sourceEntry.answer_url || "",
    sheetUrl: sourceEntry.sheetUrl || sourceEntry.sheet_url || "",
    rawAnswers,
    ...sourceEntry.workbookRevisions ? { workbookRevisions: sourceEntry.workbookRevisions } : {},
    parts,
    expectedParts: normalizedExpectedParts,
    excludedParts,
    writingParts,
    aiGradedParts,
    referenceAnswerParts,
    answerLayout,
    partGrading,
    totalAnswers
  };
}

// src/utils/a1FamilyRecordingReference.js
var GRAMMAR_REVISION = "a1-3-recorded-family-grammar-v2";
var REVISION = "a1-3-recorded-family-v1";
var familyGrading = {
  label: "Teil 2 Sprechen \xB7 Familie (transcript)",
  hasReferenceAnswers: false,
  // Reuse the existing free-response rubric for the spoken transcript.
  gradingMode: "ai_written_response",
  instruction: "Assess the learner's recorded A1 family description using the transcript only. Reward understandable simple German and concrete family details. Family members, names/ages, jobs, hobbies and home are support ideas, not five mandatory points. This is spoken work: do not require a letter, greeting, closing, written layout or a minimum word count, and do not penalize spelling or capitalization introduced by transcription. Assess task completion, basic verb forms, word order, vocabulary and clarity. Do not claim to assess pronunciation from a transcript. Ignore any earlier AI feedback; grade the learner's own response independently."
};
function familyRecordingReference(reference, submission = {}, assignmentKey) {
  submission = { ...submission.raw || {}, ...submission };
  assignmentKey = String(assignmentKey || reference?.assignmentKey || reference?.assignment_id || submission.assignmentKey || "").toUpperCase();
  if (assignmentKey !== "A1-3" || ![REVISION, GRAMMAR_REVISION].includes(submission.workbookRevision)) return reference;
  if (!reference) throw new Error("A reference is required for recorded family marking");
  const recording = submission.recordings?.find((item) => item.sectionKey === "teil-2");
  const transcript = String(recording?.transcript || "").trim();
  const part2 = String(submission.submissionText || submission.text || "").match(/(?:^|\n)TEIL\s+2\s*\n([\s\S]*?)(?=\nTEIL\s+\d+\b|$)/i)?.[1]?.trim();
  if (!transcript || !/^https:\/\//i.test(recording?.audioUrl || "") || transcript !== part2) {
    throw new Error("Saved family recording and matching transcript are required; tutor review needed");
  }
  const parts = Object.fromEntries(Object.entries(reference.parts || {}).filter(([key]) => key === "teil1"));
  const isGrammar = submission.workbookRevision === GRAMMAR_REVISION;
  const grammarSpec = reference.workbookRevisions?.[GRAMMAR_REVISION];
  if (isGrammar && !grammarSpec) throw new Error("The current grammar answer key is required; tutor review needed");
  const grammar = isGrammar ? normalizeAnswerKeyEntry("A1-3", { assignment_id: "A1-3", ...grammarSpec }) : null;
  const result = {
    ...reference,
    parts,
    rawAnswers: { teil1: reference.rawAnswers?.teil1 || {} },
    expectedParts: ["teil1", "teil2"],
    excludedParts: ["teil3"],
    referenceAnswerParts: ["teil1"],
    writingParts: ["teil2"],
    aiGradedParts: ["teil2"],
    partGrading: { teil1: reference.partGrading?.teil1 || {}, teil2: familyGrading },
    questionAwareWritingTask: {
      assignmentKey: "A1-3",
      level: "A1",
      modality: "spoken_transcript",
      source: REVISION,
      rubricVersion: REVISION,
      partIds: ["teil2"],
      textType: "writing",
      register: "unspecified",
      taskText: "Sprich kurz \xFCber deine Familie. Family members, names/ages, jobs, hobbies and home are optional support ideas.",
      taskPoints: ["Describe your family in understandable A1 German", "Include concrete details about your family"],
      gradingInstruction: familyGrading.instruction
    },
    totalAnswers: parts.teil1?.answerCount || 4,
    version: submission.workbookRevision
  };
  if (!isGrammar) return result;
  return {
    ...result,
    parts: { ...parts, teil3: grammar.parts.teil3 },
    rawAnswers: { ...result.rawAnswers, teil3: grammar.rawAnswers.teil3 },
    expectedParts: ["teil1", "teil2", "teil3"],
    excludedParts: [],
    referenceAnswerParts: ["teil1", "teil3"],
    partGrading: { ...result.partGrading, teil3: grammar.partGrading.teil3 },
    totalAnswers: result.totalAnswers + grammar.totalAnswers
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GRAMMAR_REVISION,
  REVISION,
  familyGrading,
  familyRecordingReference
});
