import answersDictionary from "../data/answers_dictionary.json" with { type: "json" };

const OPTION_LETTERS = "ABCDEFX";
const VOCABULARY_ALIASES = {
  head: ["head"],
  arm: ["arm"],
  leg: ["leg"],
  eye: ["eye"],
  nose: ["nose"],
  ear: ["ear"],
  mouth: ["mouth"],
  hand: ["hand"],
  foot: ["foot"],
  stomach: ["stomach", "belly"],
};

const HARDCODED_REFERENCE_ANSWERS = {
  "A1-14.1": {
    1: "A",
    2: "B",
    3: "B",
    4: "A",
    5: "A",
    6: "kopf",
    7: "arm",
    8: "bein",
    9: "auge",
    10: "nase",
    11: "ohr",
    12: "mund",
    13: "hand",
    14: "fuss",
    15: "bauch",
  },
};

export function normalizeAnswer(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeAssignmentId(value = "") {
  return String(value || "").trim().toUpperCase().replace(/_/g, ".");
}

function normalizePartId(value = "") {
  const normalized = normalizeAnswer(value).replace(/\s+/g, "");
  if (/teil1|part1/.test(normalized)) return "teil1";
  if (/teil2|part2|schreiben|writing/.test(normalized)) return "teil2";
  if (/teil3|part3|lesen|reading/.test(normalized)) return "teil3";
  if (/teil4|part4|horen|hoeren|listening|audio/.test(normalized)) return "teil4";
  if (/main|flat/.test(normalized)) return "main";
  return "main";
}

function findReferenceEntryFromDictionary(assignmentId = "") {
  const normalizedAssignmentId = normalizeAssignmentId(assignmentId);
  if (!normalizedAssignmentId) return null;

  for (const [assignmentName, entry] of Object.entries(answersDictionary || {})) {
    const candidates = [
      assignmentName,
      entry?.assignment_id,
      entry?.assignmentId,
      entry?.assignmentKey,
      entry?.assignment,
    ].filter(Boolean);

    if (candidates.some((candidate) => normalizeAssignmentId(candidate) === normalizedAssignmentId)) {
      return {
        assignment: entry?.assignment || assignmentName,
        assignmentKey: entry?.assignmentKey || entry?.assignment_id || entry?.assignmentId || normalizedAssignmentId,
        ...entry,
      };
    }
  }

  return null;
}

function isWritingPart(referenceEntry = {}, partId = "main") {
  const normalizedPartId = normalizePartId(partId);
  const writingParts = referenceEntry.writingParts || referenceEntry.writing_parts || [];
  if (Array.isArray(writingParts) && writingParts.map(normalizePartId).includes(normalizedPartId)) return true;

  const grading = referenceEntry.partGrading?.[partId] || referenceEntry.partGrading?.[normalizedPartId];
  const gradingMode = normalizeAnswer(grading?.gradingMode || grading?.mode || grading?.instruction || "");
  if (/writing|schreiben|ai written response/.test(gradingMode)) return true;

  return normalizedPartId === "teil2" && Array.isArray(referenceEntry.expectedParts) && referenceEntry.expectedParts.length > 1;
}

function stripQuestionLabel(value = "") {
  return String(value || "")
    .replace(/^\s*(?:answer|antwort|frage|nr\.?|q)\s*\d{1,3}\s*[).:-]?\s*/i, "")
    .replace(/^\s*[a-z]\s*[).]\s*/i, "")
    .trim();
}

function getQuestionNumber(key = "", fallbackIndex = 0, value = "") {
  const fromValue = String(value || "").match(/(?:frage|answer|antwort|nr\.?|q)\s*(\d{1,3})\b/i);
  if (fromValue?.[1]) return Number(fromValue[1]);
  const fromKey = String(key || "").match(/(\d{1,3})/);
  if (fromKey?.[1]) return Number(fromKey[1]);
  return fallbackIndex + 1;
}

function extractExpectedChoice(value = "") {
  const raw = stripQuestionLabel(value);
  const anzeigen = raw.match(new RegExp(`\\banzeige\\s*([${OPTION_LETTERS}])\\b`, "i"));
  if (anzeigen) return anzeigen[1].toUpperCase();

  const option = raw.match(new RegExp(`^([${OPTION_LETTERS}])(?:\\b|\\s|[).:-]|$)`, "i"));
  return option ? option[1].toUpperCase() : "";
}

function leadingOptionLetter(value = "") {
  const match = normalizeAnswer(value).match(new RegExp(`^([${OPTION_LETTERS.toLowerCase()}])(?:\\s|$)`, "i"));
  return match ? match[1].toUpperCase() : "";
}

function extractOptionLetter(value = "") {
  return extractExpectedChoice(value) || leadingOptionLetter(value) || "";
}

function extractOptionText(value = "") {
  return stripQuestionLabel(value).replace(new RegExp(`^([${OPTION_LETTERS}])(?:\\s*[).:-]|\\s+)`, "i"), "").trim();
}

function findVocabularyKey(value = "") {
  const normalized = normalizeAnswer(value);
  return Object.entries(VOCABULARY_ALIASES).find(([, aliases]) => aliases.some((alias) => normalized.includes(alias)))?.[0] || "";
}

function extractExpectedVocabulary(value = "") {
  const raw = stripQuestionLabel(value);
  const parts = raw.split(/[-–:]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const leftKey = findVocabularyKey(parts[0]);
  if (leftKey) return { expected: normalizeAnswer(parts.slice(1).join(" ").split("/")[0]), vocabularyKey: leftKey };

  const rightKey = findVocabularyKey(parts.slice(1).join(" "));
  if (rightKey) return { expected: normalizeAnswer(parts[0].split("/")[0]), vocabularyKey: rightKey };

  return null;
}

function expectedFromReferenceValue(value = "") {
  const acceptedAnswers = Array.isArray(value?.acceptedAnswers) ? value.acceptedAnswers : [];
  const rawCandidates = value && typeof value === "object"
    ? [value.correctLetter, value.rawCorrectAnswer, value.raw, value.correctText, ...acceptedAnswers].filter(Boolean)
    : [String(value ?? "")];
  const raw = rawCandidates.find((candidate) => String(candidate).trim()) || "";

  const vocabulary = rawCandidates.map(extractExpectedVocabulary).find(Boolean);
  if (vocabulary) return { ...vocabulary, type: "vocabulary", raw };

  const choice = value && typeof value === "object"
    ? String(value.correctLetter || "").toUpperCase() || rawCandidates.map(extractExpectedChoice).find(Boolean) || rawCandidates.map(leadingOptionLetter).find(Boolean)
    : extractExpectedChoice(raw) || leadingOptionLetter(raw);
  if (choice) {
    const textCandidate = value?.correctText || rawCandidates.find((candidate) => extractExpectedChoice(candidate) || leadingOptionLetter(candidate)) || raw;
    return { expected: choice.toUpperCase(), expectedText: extractOptionText(textCandidate), type: "choice", raw: textCandidate };
  }

  return { expected: normalizeAnswer(raw), expectedText: normalizeAnswer(raw), type: "text", raw };
}

function flattenAnswerObject(value = {}, path = []) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return [{ key: path.join("."), value: String(value) }];
  if (!value || typeof value !== "object") return [];
  if (value.correctLetter || value.correctText || value.rawCorrectAnswer || value.raw || value.acceptedAnswers) return [{ key: path.join("."), value }];
  return Object.entries(value).flatMap(([key, nested]) => flattenAnswerObject(nested, [...path, key]));
}

function parseReferenceText(text = "", partId = "main") {
  const entries = [];
  let orderedQuestion = 0;

  for (const line of String(text || "").split(/\r?\n|[,;]+/)) {
    const trimmed = line.trim();
    if (!trimmed || /^(teil|part)\s*\d+\s*:?$/i.test(trimmed)) continue;

    const numbered = trimmed.match(/^(?:answer|antwort|frage|nr\.?|q)?\s*(\d{1,3})\s*[).:-]?\s*(.+)$/i);
    if (numbered) {
      entries.push({ key: `Answer${Number(numbered[1])}`, value: numbered[2].trim(), partId });
      orderedQuestion = Math.max(orderedQuestion, Number(numbered[1]));
      continue;
    }

    orderedQuestion += 1;
    entries.push({ key: `Answer${orderedQuestion}`, value: trimmed, partId });
  }

  return entries;
}

function addReferenceItems(items, entries, partId = "main", referenceEntry = {}) {
  if (isWritingPart(referenceEntry, partId)) return;

  entries.forEach((entry, index) => {
    const meta = expectedFromReferenceValue(entry.value);
    if (!meta.expected) return;

    items.push({
      key: entry.key || `Answer${index + 1}`,
      partId: normalizePartId(entry.partId || partId),
      questionNumber: getQuestionNumber(entry.key, index, meta.raw),
      expected: meta.expected,
      expectedText: meta.expectedText || "",
      expectedRaw: meta.raw || entry.value,
      type: meta.type,
      vocabularyKey: meta.vocabularyKey || "",
    });
  });
}

function buildReferenceItems(referenceEntry = {}) {
  if (!referenceEntry || typeof referenceEntry !== "object") return [];
  const items = [];

  for (const [partId, part] of Object.entries(referenceEntry.parts || {})) {
    const entries = Array.isArray(part?.answers)
      ? part.answers.map((answer, index) => ({ key: answer.questionKey || answer.key || `Answer${index + 1}`, value: answer, partId }))
      : flattenAnswerObject(part?.answers || {}).map((entry) => ({ ...entry, partId }));
    addReferenceItems(items, entries, partId, referenceEntry);
  }

  const rawSources = [referenceEntry.rawAnswers, referenceEntry.answers, referenceEntry.answerKeys, referenceEntry.answer_key, referenceEntry.key].filter(Boolean);

  for (const source of rawSources) {
    if (typeof source === "string") {
      addReferenceItems(items, parseReferenceText(source), "main", referenceEntry);
      continue;
    }

    if (!source || typeof source !== "object") continue;

    const entries = Object.entries(source);
    const hasPartKeys = entries.some(([key]) => /teil\s*[1-4]|part\s*[1-4]|lesen|h[oö]ren|hoeren|schreiben|writing|reading|listening/i.test(key));
    if (hasPartKeys) {
      for (const [key, nested] of entries) {
        const partId = normalizePartId(key);
        const partEntries = typeof nested === "string"
          ? parseReferenceText(nested, partId)
          : flattenAnswerObject(nested).map((entry) => ({ ...entry, partId }));
        addReferenceItems(items, partEntries, partId, referenceEntry);
      }
    } else {
      addReferenceItems(items, flattenAnswerObject(source), "main", referenceEntry);
    }
  }

  const seen = new Set();
  return items.filter((item) => {
    const dedupeKey = `${item.partId}:${item.questionNumber}:${item.expected}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}

function splitSubmissionIntoSections(text = "") {
  const sections = [];
  const source = String(text || "");
  const markerRegex = /(?:^|\n)\s*(teil|part)\s*(\d+)\s*[:;]?\s*/gi;
  const markers = [];
  let match;

  while ((match = markerRegex.exec(source))) markers.push({ index: match.index, end: markerRegex.lastIndex, partId: `teil${Number(match[2])}`, partNumber: Number(match[2]) });
  if (!markers.length) return [{ partId: "main", partNumber: null, text: source }];

  markers.forEach((marker, index) => {
    const next = markers[index + 1];
    sections.push({ partId: marker.partId, partNumber: marker.partNumber, text: source.slice(marker.end, next ? next.index : source.length) });
  });

  return sections;
}

function sectionTextForPart(sections = [], partId = "main", fullText = "") {
  const normalizedPartId = normalizePartId(partId);
  if (normalizedPartId === "main") return fullText;
  return sections.find((section) => section.partId === normalizedPartId)?.text || fullText;
}

export function extractChoiceAnswers(text = "") {
  const answers = {};
  const regex = /(?:frage\s*)?(\d+)\s*\.?\s*(?:anzeige\s*)?([a-fx])\b/gi;
  let match;
  while ((match = regex.exec(String(text)))) {
    const index = Number(match[1]);
    if (Number.isFinite(index)) answers[index] = match[2].toUpperCase();
  }
  return answers;
}

export function extractVocabularyAnswers(text = "") {
  const vocab = {};
  const lines = String(text).split(/\n|\r/);
  for (const line of lines) {
    const parts = line.split(/[-–:]/);
    if (parts.length < 2) continue;
    const left = normalizeAnswer(parts[0]);
    const right = normalizeAnswer(parts.slice(1).join(" "));
    if (!left || !right) continue;
    vocab[left] = right;
  }
  return vocab;
}

function extractNumberedTextEntries(text = "") {
  const entries = [];
  for (const rawLine of String(text || "").split(/\r?\n|[,;]+/)) {
    const match = rawLine.trim().match(/^\s*(\d{1,3})\s*[).:-]?\s*(.+?)\s*$/i);
    if (!match) continue;
    const answer = match[2].trim();
    if (!answer) continue;
    entries.push({ number: Number(match[1]), answer });
  }
  return entries.sort((a, b) => a.number - b.number);
}

function extractNumberedTextAnswers(text = "") {
  return Object.fromEntries(extractNumberedTextEntries(text).map((entry) => [entry.number, entry.answer]));
}

function looksLikeOptionAnswer(value = "") {
  return Boolean(extractOptionLetter(value));
}

function extractSequentialObjectiveAnswers(text = "") {
  const answers = [];
  for (const section of splitSubmissionIntoSections(text)) {
    const entries = extractNumberedTextEntries(section.text);
    if (!entries.length) continue;
    const hasOptionAnswer = entries.some((entry) => looksLikeOptionAnswer(entry.answer));
    if (!hasOptionAnswer) continue;
    entries.forEach((entry) => answers.push(entry.answer));
  }
  return answers;
}

export function extractNumberedVocabularyAnswers(text = "", preferredPartNumber = 3) {
  const sections = splitSubmissionIntoSections(text);
  const preferredSections = [
    ...sections.filter((section) => section.partNumber === preferredPartNumber),
    ...sections.filter((section) => section.partNumber !== preferredPartNumber && section.partNumber !== 2),
  ];

  for (const section of preferredSections) {
    const answers = extractNumberedTextEntries(section.text)
      .map((entry) => ({ number: entry.number, answer: normalizeAnswer(entry.answer) }))
      .filter((entry) => entry.answer && !/^[a-fx]$/.test(entry.answer));

    if (answers.length) return answers.sort((a, b) => a.number - b.number).map((item) => item.answer);
  }

  return [];
}

export function compareAnswers(refAnswers = {}, stuAnswers = {}) {
  const details = {};
  let correctCount = 0;
  const keys = Object.keys(refAnswers);

  for (const key of keys) {
    const expected = normalizeAnswer(refAnswers[key]);
    const student = normalizeAnswer(stuAnswers[key] ?? "");
    const correct = Boolean(expected && student && expected === student);
    if (correct) correctCount += 1;
    details[key] = { student: stuAnswers[key] ?? "", expected: refAnswers[key], correct };
  }

  return { correctCount, totalCount: keys.length, details };
}

export function getReferenceAnswers(assignmentIdOrReferenceEntry, referenceEntry = null) {
  const source = typeof assignmentIdOrReferenceEntry === "object"
    ? assignmentIdOrReferenceEntry
    : referenceEntry || findReferenceEntryFromDictionary(assignmentIdOrReferenceEntry);
  const dynamicItems = buildReferenceItems(source || {});
  if (dynamicItems.length) return Object.fromEntries(dynamicItems.map((item, index) => [index + 1, item.expected]));

  const normalizedAssignmentId = normalizeAssignmentId(assignmentIdOrReferenceEntry);
  return HARDCODED_REFERENCE_ANSWERS[normalizedAssignmentId] || null;
}

function buildHardcodedReferenceItems(assignmentId = "") {
  const ref = HARDCODED_REFERENCE_ANSWERS[normalizeAssignmentId(assignmentId)];
  if (!ref) return [];
  return Object.entries(ref).map(([key, expected]) => ({
    key,
    partId: "main",
    questionNumber: Number(key),
    expected,
    expectedText: "",
    expectedRaw: expected,
    type: /^[A-FX]$/i.test(String(expected)) ? "choice" : "vocabulary",
    vocabularyKey: "",
  }));
}

function getStudentAnswerForItem({ item, index, submissionText, sections, vocabularyIndexes, sequentialObjectiveAnswers, useSequentialChoices }) {
  const sectionText = sectionTextForPart(sections, item.partId, submissionText);

  if (item.type === "choice") {
    if (useSequentialChoices && sequentialObjectiveAnswers[index] !== undefined) return sequentialObjectiveAnswers[index];
    return extractChoiceAnswers(sectionText)[item.questionNumber] || extractChoiceAnswers(submissionText)[item.questionNumber] || "";
  }

  const vocabularyPairs = extractVocabularyAnswers(submissionText);
  if (item.vocabularyKey && vocabularyPairs[item.vocabularyKey]) return vocabularyPairs[item.vocabularyKey];

  const numberedVocabularyValues = extractNumberedVocabularyAnswers(submissionText);
  if (item.type === "vocabulary" && numberedVocabularyValues[vocabularyIndexes.get(item) ?? -1]) return numberedVocabularyValues[vocabularyIndexes.get(item)];

  return extractNumberedTextAnswers(sectionText)[item.questionNumber] || extractNumberedTextAnswers(submissionText)[item.questionNumber] || "";
}

function isCorrectAnswer(item, student) {
  const expectedLetter = item.type === "choice"
    ? extractOptionLetter(item.expected)
    : extractOptionLetter(item.expectedRaw) || leadingOptionLetter(item.expected);
  const studentLetter = extractOptionLetter(student);

  if (expectedLetter && studentLetter) return expectedLetter === studentLetter;
  if (expectedLetter && normalizeAnswer(student) === normalizeAnswer(expectedLetter)) return true;

  if (item.type === "choice" && item.expectedText) return normalizeAnswer(student) === normalizeAnswer(item.expectedText);
  return Boolean(normalizeAnswer(item.expected) && normalizeAnswer(student) && normalizeAnswer(item.expected) === normalizeAnswer(student));
}

export function computeObjectiveScore(assignmentIdOrReferenceEntry, submissionText, referenceEntry = null) {
  const source = typeof assignmentIdOrReferenceEntry === "object"
    ? assignmentIdOrReferenceEntry
    : referenceEntry || findReferenceEntryFromDictionary(assignmentIdOrReferenceEntry);
  const assignmentId = typeof assignmentIdOrReferenceEntry === "string"
    ? assignmentIdOrReferenceEntry
    : assignmentIdOrReferenceEntry?.assignmentKey || assignmentIdOrReferenceEntry?.assignmentId || assignmentIdOrReferenceEntry?.assignment_id || "";

  const items = buildReferenceItems(source || {});
  const referenceItems = items.length ? items : buildHardcodedReferenceItems(assignmentId);
  if (!referenceItems.length) return { correctCount: 0, totalCount: 0, details: {} };

  const sections = splitSubmissionIntoSections(submissionText);
  const sequentialObjectiveAnswers = extractSequentialObjectiveAnswers(submissionText);
  const partIds = new Set(referenceItems.map((item) => item.partId));
  const flatMainReference = referenceItems.every((item) => item.partId === "main");
  const hasMultipartReference = partIds.size > 1 || referenceItems.some((item) => item.partId !== "main");
  const hasMatchingPartSections = sections.some((section) => section.partId !== "main" && referenceItems.some((item) => item.partId === section.partId));
  const choiceCount = referenceItems.filter((item) => item.type === "choice").length;
  const useSequentialChoices = (flatMainReference || (hasMultipartReference && !hasMatchingPartSections)) && choiceCount > 1 && sequentialObjectiveAnswers.length >= choiceCount;

  const vocabularyIndexes = new Map();
  let vocabularyIndex = 0;
  referenceItems.forEach((item) => {
    if (item.type === "vocabulary") {
      vocabularyIndexes.set(item, vocabularyIndex);
      vocabularyIndex += 1;
    }
  });

  const details = {};
  let correctCount = 0;

  referenceItems.forEach((item, index) => {
    const student = getStudentAnswerForItem({ item, index, submissionText, sections, vocabularyIndexes, sequentialObjectiveAnswers, useSequentialChoices });
    const correct = isCorrectAnswer(item, student);
    if (correct) correctCount += 1;
    const detailKey = item.partId === "main" ? String(item.questionNumber || index + 1) : `${item.partId}.${item.questionNumber || index + 1}`;
    details[detailKey] = {
      student,
      expected: item.expected,
      rawExpected: item.expectedRaw,
      correct,
      partId: item.partId,
    };
  });

  return { correctCount, totalCount: referenceItems.length, details };
}
