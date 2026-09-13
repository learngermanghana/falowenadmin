import answersDictionary from "../data/answers_dictionary.json" with { type: "json" };
import { parseSubmissionSections } from "./submissionSections.js";

const OPTION_LETTERS = "ABCDEFX";
const GERMAN_ARTICLES = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines"]);
const ENGLISH_ARTICLES = new Set(["the", "a", "an"]);
const STOPWORDS = new Set([
  "ich", "du", "er", "sie", "es", "wir", "ihr", "ja", "nein", "gern", "gerne", "mag", "mochte", "moechte",
  "nicht", "spiele", "spielen", "kostet", "kosten", "ist", "sind", "bin", "ein", "eine", "der", "die", "das",
  "und", "oder", "zu", "in", "mit", "auf", "am", "im", "den", "dem", "des", "mein", "meine",
  "meinem", "meinen", "meiner", "meines", "sein", "seine", "seinen", "seinem", "seiner", "seines",
  "ihr", "ihre", "ihren", "ihrem", "ihrer", "ihres", "unser", "unsere", "unseren", "unserem", "unserer", "unseres",
  "euer", "eure", "euren", "eurem", "eurer", "eures",
]);

const NUMBER_WORDS = new Map([
  ["null", "0"], ["eins", "1"], ["ein", "1"], ["eine", "1"], ["einen", "1"],
  ["zwei", "2"], ["drei", "3"], ["vier", "4"], ["funf", "5"], ["fuenf", "5"],
  ["sechs", "6"], ["sieben", "7"], ["acht", "8"], ["neun", "9"], ["zehn", "10"],
]);

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

const HARDCODED_VOCABULARY_KEYS = {
  "A1-14.1": {
    6: "head",
    7: "arm",
    8: "leg",
    9: "eye",
    10: "nose",
    11: "ear",
    12: "mouth",
    13: "hand",
    14: "foot",
    15: "stomach",
  },
};

export function normalizeAnswer(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/(\d)(uhr)\b/g, "$1 $2")
    .trim();
}

function normalizeAssignmentId(value = "") {
  return String(value || "").trim().toUpperCase().replace(/_/g, ".");
}

function normalizePartId(value = "") {
  const normalized = normalizeAnswer(value).replace(/\s+/g, "");
  if (/teil(?:1|eins)|part(?:1|one)/.test(normalized)) return "teil1";
  if (/teil(?:2|zwei)|part(?:2|two)|schreiben|writing/.test(normalized)) return "teil2";
  if (/teil(?:3|drei)|part(?:3|three)|lesen|reading/.test(normalized)) return "teil3";
  if (/teil(?:4|vier)|part(?:4|four)|horen|hoeren|listening|audio/.test(normalized)) return "teil4";
  return "main";
}

function findReferenceEntryFromDictionary(assignmentId = "") {
  const normalizedAssignmentId = normalizeAssignmentId(assignmentId);
  if (!normalizedAssignmentId) return null;

  for (const [assignmentName, entry] of Object.entries(answersDictionary || {})) {
    const candidates = [assignmentName, entry?.assignment_id, entry?.assignmentId, entry?.assignmentKey, entry?.assignment].filter(Boolean);
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
  const rawAnswers = referenceEntry.rawAnswers || referenceEntry.answers || {};
  const answerValues = Object.values(rawAnswers).map((value) => String(value || "").trim().toLowerCase());
  const writingPlaceholder = answerValues.length > 0 && answerValues.every((value) => /^(read|see|check) (the )?(comment|comments|instructions?)( for (the )?answers?)?$/.test(value));
  if (normalizedPartId === "main" && writingPlaceholder) return true;
  const writingParts = referenceEntry.writingParts || referenceEntry.writing_parts || [];
  if (Array.isArray(writingParts) && writingParts.map(normalizePartId).includes(normalizedPartId)) return true;
  const grading = referenceEntry.partGrading?.[partId] || referenceEntry.partGrading?.[normalizedPartId];
  const gradingMode = normalizeAnswer(grading?.gradingMode || grading?.mode || grading?.instruction || "");
  if (/writing|schreiben|ai written response/.test(gradingMode)) return true;
  const aiGradedParts = referenceEntry.aiGradedParts || referenceEntry.ai_graded_parts || [];
  if (Array.isArray(aiGradedParts) && aiGradedParts.map(normalizePartId).includes(normalizedPartId)) return true;

  const referenceAnswerParts = referenceEntry.referenceAnswerParts || referenceEntry.reference_answer_parts || [];
  const normalizedReferenceAnswerParts = Array.isArray(referenceAnswerParts) ? referenceAnswerParts.map(normalizePartId) : [];
  if (grading?.hasReferenceAnswers === true || normalizedReferenceAnswerParts.includes(normalizedPartId)) return false;

  const expectedParts = referenceEntry.expectedParts || referenceEntry.expected_parts || [];
  const normalizedExpectedParts = Array.isArray(expectedParts) ? expectedParts.map(normalizePartId) : [];
  const level = String(referenceEntry.level || referenceEntry.assignmentKey || referenceEntry.assignment_id || referenceEntry.assignmentId || "").toUpperCase();
  const legacyWritingPart = /^(A2|B1)(?:\b|-)/.test(level)
    && normalizedPartId === "teil2"
    && normalizedExpectedParts.includes(normalizedPartId)
    && normalizedReferenceAnswerParts.length > 0
    && !normalizedReferenceAnswerParts.includes(normalizedPartId);

  return legacyWritingPart;
}

function stripQuestionLabel(value = "") {
  return String(value || "")
    .replace(/^\s*(?:answer|antwort|frage|aufgabe|task|exercise|nr\.?|q)\s*\d{1,3}\s*[).:-]?\s*/i, "")
    .replace(/^\s*[a-z]\s*[).]\s*/i, "")
    .trim();
}

function getQuestionNumber(key = "", fallbackIndex = 0, value = "") {
  const fromValue = String(value || "").match(/(?:frage|answer|antwort|aufgabe|task|exercise|nr\.?|q)\s*(\d{1,3})\b/i);
  if (fromValue?.[1]) return Number(fromValue[1]);
  const fromKey = String(key || "").match(/(\d{1,3})/);
  if (fromKey?.[1]) return Number(fromKey[1]);
  return fallbackIndex + 1;
}

function stripAnswerQuestionLabel(value = "") {
  return String(value || "")
    .replace(/^\s*(?:answer|antwort|frage|aufgabe|task|exercise|nr\.?|q)\s*\d{1,3}\s*[).:-]?\s*/i, "")
    .replace(/^\s*anzeige\s*:\s*/i, "Anzeige ")
    .trim();
}

function extractOptionLetter(value = "") {
  const raw = stripAnswerQuestionLabel(value);
  const anzeige = raw.match(new RegExp(`\\banzeige\\s*([${OPTION_LETTERS}])\\b`, "i"));
  if (anzeige) return anzeige[1].toUpperCase();
  const explicit = raw.match(new RegExp(`^([${OPTION_LETTERS}])(?:\\s*[().:/-]|\\s+|$)`, "i"));
  return explicit ? explicit[1].toUpperCase() : "";
}

function extractOptionText(value = "") {
  return stripQuestionLabel(value)
    .replace(new RegExp(`^([${OPTION_LETTERS}])(?:\\s*[().:/-]|\\s+)`, "i"), "")
    .trim();
}

function findVocabularyKey(value = "") {
  const normalized = normalizeAnswer(value);
  return Object.entries(VOCABULARY_ALIASES).find(([, aliases]) => aliases.some((alias) => normalized.includes(alias)))?.[0] || "";
}

function extractExpectedVocabulary(value = "") {
  const raw = stripQuestionLabel(value);
  const parts = raw.split(/[-–:=]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const leftKey = findVocabularyKey(parts[0]);
  if (leftKey) return { expected: normalizeAnswer(parts.slice(1).join(" ").split("/")[0]), vocabularyKey: leftKey };
  const rightKey = findVocabularyKey(parts.slice(1).join(" "));
  if (rightKey) return { expected: normalizeAnswer(parts[0].split("/")[0]), vocabularyKey: rightKey };
  return null;
}

function splitAlternatives(value = "") {
  return String(value || "").split(/\s*\/\s*/).map((item) => item.trim()).filter(Boolean);
}

function expectedFromReferenceValue(value = "") {
  const acceptedAnswers = Array.isArray(value?.acceptedAnswers) ? value.acceptedAnswers : [];
  const rawCandidates = value && typeof value === "object"
    ? [value.rawCorrectAnswer, value.raw, value.correctLetter, value.correctText, ...acceptedAnswers].filter(Boolean)
    : [String(value ?? "")];
  const raw = rawCandidates.find((candidate) => String(candidate).trim()) || "";

  const vocabulary = rawCandidates.map(extractExpectedVocabulary).find(Boolean);
  if (vocabulary) {
    return {
      ...vocabulary,
      type: "vocabulary",
      raw,
      expectedDisplay: raw,
      accepted: [vocabulary.expected],
    };
  }

  const choice = value && typeof value === "object"
    ? String(value.correctLetter || "").toUpperCase() || rawCandidates.map(extractOptionLetter).find(Boolean)
    : extractOptionLetter(raw);

  if (choice) {
    const textCandidate = value?.correctText || rawCandidates.find((candidate) => extractOptionText(candidate)) || raw;
    const expectedText = extractOptionText(textCandidate);
    return {
      expected: choice.toUpperCase(),
      expectedText,
      type: "choice",
      raw: textCandidate,
      expectedDisplay: expectedText ? `${choice.toUpperCase()}) ${expectedText}` : choice.toUpperCase(),
      accepted: [choice.toUpperCase(), expectedText, ...acceptedAnswers].filter(Boolean),
    };
  }

  const accepted = rawCandidates.flatMap(splitAlternatives).map(normalizeAnswer).filter(Boolean);
  return {
    expected: normalizeAnswer(raw),
    expectedText: normalizeAnswer(raw),
    type: "text",
    raw,
    expectedDisplay: raw,
    accepted,
  };
}

function flattenAnswerObject(value = {}, path = []) {
  if (Array.isArray(value)) {
    return value.flatMap((nested, index) => flattenAnswerObject(nested, [...path, String(index + 1)]));
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return [{ key: path.join("."), value: String(value) }];
  if (!value || typeof value !== "object") return [];
  if (value.correctLetter || value.correctText || value.rawCorrectAnswer || value.raw || value.acceptedAnswers) return [{ key: path.join("."), value }];
  return Object.entries(value).flatMap(([key, nested]) => flattenAnswerObject(nested, [...path, key]));
}

function parseReferenceText(text = "", partId = "main") {
  const entries = [];
  let orderedQuestion = 0;
  for (const line of String(text || "").split(/\r?\n|,(?=\s*\d{1,3}\s*[A-FX](?:\b|[).,:;–-]))/i)) {
    const trimmed = line.trim();
    if (!trimmed || /^(teil|part)\s*\d+\s*:?$/i.test(trimmed)) continue;
    const numbered = trimmed.match(/^(?:answer|antwort|frage|aufgabe|task|exercise|nr\.?|q)?\s*(\d{1,3})\s*[).:-]?\s*(.+)$/i);
    if (numbered) {
      entries.push({ key: `Answer${Number(numbered[1])}`, value: numbered[2].trim(), partId });
      orderedQuestion = Math.max(orderedQuestion, Number(numbered[1]));
    } else {
      orderedQuestion += 1;
      entries.push({ key: `Answer${orderedQuestion}`, value: trimmed, partId });
    }
  }
  return entries;
}

function addReferenceItems(items, entries, partId = "main", referenceEntry = {}) {
  if (isWritingPart(referenceEntry, partId)) return;
  entries.forEach((entry, index) => {
    const meta = expectedFromReferenceValue(entry.value);
    if (!meta.expected) return;
    const normalizedPartId = normalizePartId(entry.partId || partId);
    items.push({
      key: entry.key || `Answer${index + 1}`,
      partId: normalizedPartId,
      questionNumber: getQuestionNumber(entry.key, index, meta.raw),
      expected: meta.expected,
      expectedText: meta.expectedText || "",
      expectedRaw: meta.raw || entry.value,
      expectedDisplay: meta.expectedDisplay || meta.raw || entry.value,
      accepted: meta.accepted || [],
      type: meta.type,
      vocabularyKey: meta.vocabularyKey || "",
      matchingMode: String(
        referenceEntry.answerMatchingMode
          || referenceEntry.textMatchingMode
          || referenceEntry.partGrading?.[partId]?.answerMatchingMode
          || referenceEntry.partGrading?.[normalizedPartId]?.answerMatchingMode
          || "",
      ).trim().toLowerCase(),
    });
  });
}

function buildReferenceItems(referenceEntry = {}) {
  if (!referenceEntry || typeof referenceEntry !== "object") return [];
  const items = [];

  for (const [partId, part] of Object.entries(referenceEntry.parts || {})) {
    const entries = Array.isArray(part?.answers)
      ? part.answers.map((answer, index) => ({ key: answer.questionKey || answer.key || `Answer${index + 1}`, value: answer, partId }))
      : flattenAnswerObject(part?.answers || part).map((entry) => ({ ...entry, partId }));
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
        const partEntries = typeof nested === "string" ? parseReferenceText(nested, partId) : flattenAnswerObject(nested).map((entry) => ({ ...entry, partId }));
        addReferenceItems(items, partEntries, partId, referenceEntry);
      }
    } else {
      addReferenceItems(items, flattenAnswerObject(source), "main", referenceEntry);
    }
  }

  const seen = new Set();
  return items.filter((item) => {
    const dedupeKey = `${item.partId}:${item.questionNumber}:${item.expected}:${item.expectedText}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}

const splitSubmissionIntoSections = parseSubmissionSections;

function splitIntoAnswerBlocks(text = "") {
  return String(text || "").split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean);
}

function leadingUnlabelledSubmissionText(text = "") {
  const sourceText = String(text || "");
  const markerRegex = /(?:^|\n)[ \t]*((?:teil|part)[ \t]*[1-4]\b[^\n]*|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \t]*(?=\n|$)/i;
  const marker = markerRegex.exec(sourceText);
  return marker ? sourceText.slice(0, marker.index).trim() : sourceText.trim();
}

function parseNumberedEntriesFromChunk(chunk = "") {
  const trimmed = String(chunk || "").trim();
  if (!trimmed) return [];

  const compactChoiceSequence = /^(?:\d{1,3}\s*[A-FX](?:\s*[).,:–-])?)(?:\s+\d{1,3}\s*[A-FX](?:\s*[).,:–-])?)+$/i;
  const source = compactChoiceSequence.test(trimmed)
    ? trimmed.replace(/(^|\s)(\d{1,3})(?=[A-FX](?:\s*[).,:–-]|\s|$))/gi, "$1$2.")
    : trimmed;

  const cleanParsedAnswer = (value = "") => String(value || "")
    .replace(/^[).,:;–-]+\s*/, "")
    .trim();

  const labelled = source.match(/^\s*(?:answer|antwort|frage|question|aufgabe|task|exercise|nr\.?|q)\s*(\d{1,3})\s*[).:–-]?\s*(.+?)\s*$/i);
  if (labelled && normalizeAnswer(labelled[2])) {
    return [{ number: Number(labelled[1]), answer: labelled[2].trim() }];
  }

  const compactPattern = /(?:^|\s)(\d{1,3})(?:\s*[)–-]\s*|\s*[.,:](?!\d)\s*|\s+(?=[A-FX](?:\s*[).,:–-]|\s|$)))(.*?)(?=\s+\d{1,3}(?:\s*[)–-]\s*|\s*[.,:](?!\d)\s*|\s+(?=[A-FX](?:\s*[).,:–-]|\s|$)))|$)/g;
  const compactMatches = [...source.matchAll(compactPattern)]
    .map((match) => ({ number: Number(match[1]), answer: cleanParsedAnswer(match[2]) }))
    .filter((entry) => Number.isFinite(entry.number) && normalizeAnswer(entry.answer));

  if (compactMatches.length > 1) return compactMatches;

  const single = source.match(/^\s*(?:answer|antwort|frage|question|aufgabe|task|exercise|nr\.?|q)?\s*(\d{1,3})\s*[).:–-]?\s*(.+?)\s*$/i);
  if (single && normalizeAnswer(single[2])) return [{ number: Number(single[1]), answer: cleanParsedAnswer(single[2]) }];

  return [];
}

function extractNumberedTextEntries(text = "") {
  const entries = [];
  let pendingQuestionNumber = null;
  let pendingNumberedQuestion = null;
  for (const rawLine of String(text || "").split(/\r?\n|,(?=\s*\d{1,3}\s*[A-FX](?:\b|[).,:;–-]))/i)) {
    const line = rawLine.trim();
    if (!line) continue;
    const questionLabel = line.match(/^\s*(?:frage|answer|antwort|aufgabe|task|exercise|nr\.?|q)\s*(\d{1,3})\s*[).:-]?\s*$/i);
    if (questionLabel) {
      pendingQuestionNumber = Number(questionLabel[1]);
      continue;
    }
    const parsed = parseNumberedEntriesFromChunk(line);
    const numberedQuestionPrompt = parsed.length === 1
      && /\?\s*$/.test(parsed[0].answer)
      && !extractOptionLetter(parsed[0].answer);
    if (numberedQuestionPrompt) {
      if (pendingNumberedQuestion) entries.push(pendingNumberedQuestion);
      pendingNumberedQuestion = { number: parsed[0].number, answer: parsed[0].answer };
      pendingQuestionNumber = null;
      continue;
    }
    if (pendingNumberedQuestion) {
      if (!parsed.length && normalizeAnswer(line)) {
        entries.push({ number: pendingNumberedQuestion.number, answer: line });
        pendingNumberedQuestion = null;
        continue;
      }
      entries.push(pendingNumberedQuestion);
      pendingNumberedQuestion = null;
    }
    if (pendingQuestionNumber && parsed.length === 1) {
      entries.push({ number: pendingQuestionNumber, answer: parsed[0].answer });
      pendingQuestionNumber = null;
      continue;
    }
    if (parsed.length) {
      entries.push(...parsed);
      pendingQuestionNumber = null;
    } else if (pendingQuestionNumber && normalizeAnswer(line)) {
      entries.push({ number: pendingQuestionNumber, answer: line });
      pendingQuestionNumber = null;
    }
  }
  if (pendingNumberedQuestion) entries.push(pendingNumberedQuestion);
  return entries.sort((a, b) => a.number - b.number);
}

function extractLeadingUnnumberedAnswer(text = "") {
  for (const rawLine of String(text || "").split(/\r?\n|,(?=\s*\d{1,3}\s*[A-FX](?:\b|[).,:;–-]))/i)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^\s*(?:answer|antwort|frage|aufgabe|task|exercise|nr\.?|q)?\s*[12]\s*[).:-]?\s*.+/i.test(line)) return "";
    return line;
  }
  return "";
}

function extractRestartedNumberingEntries(text = "") {
  const entries = extractNumberedTextEntries(text);
  if (entries[0]?.number === 2 && !entries.some((entry) => entry.number === 1)) {
    const leadingAnswer = extractLeadingUnnumberedAnswer(text);
    if (leadingAnswer) return [{ number: 1, answer: leadingAnswer }, ...entries];
  }
  return entries;
}

function extractNumberedTextAnswers(text = "") {
  return Object.fromEntries(extractNumberedTextEntries(text).map((entry) => [entry.number, entry.answer]));
}

export function extractChoiceAnswers(text = "") {
  const answers = {};
  extractNumberedTextEntries(text).forEach((entry) => {
    const letter = extractOptionLetter(entry.answer);
    if (letter) answers[entry.number] = letter;
  });
  return answers;
}

export function extractVocabularyAnswers(text = "") {
  const vocab = {};
  for (const rawLine of String(text).split(/\n|\r/)) {
    const line = String(rawLine || "").trim();
    if (!line) continue;

    const parts = line.split(/[-–:=]/);
    let leftRaw = "";
    let rightRaw = "";

    if (parts.length >= 2) {
      leftRaw = parts[0];
      rightRaw = parts.slice(1).join(" ");
    } else {
      const whitespacePair = line.match(/^(head|arm|leg|eye|nose|ear|mouth|hand|foot|stomach(?:\s*\/\s*belly)?|belly)\s+(.+)$/i);
      if (!whitespacePair) continue;
      leftRaw = whitespacePair[1];
      rightRaw = whitespacePair[2];
    }

    const left = normalizeAnswer(leftRaw);
    const right = normalizeAnswer(rightRaw);
    const canonicalKey = findVocabularyKey(left) || left;
    if (canonicalKey && right) vocab[canonicalKey] = right;
  }
  return vocab;
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
  const source = typeof assignmentIdOrReferenceEntry === "object" ? assignmentIdOrReferenceEntry : referenceEntry || findReferenceEntryFromDictionary(assignmentIdOrReferenceEntry);
  const dynamicItems = buildReferenceItems(source || {});
  if (dynamicItems.length) return Object.fromEntries(dynamicItems.map((item, index) => [index + 1, item.expected]));
  return HARDCODED_REFERENCE_ANSWERS[normalizeAssignmentId(assignmentIdOrReferenceEntry)] || null;
}

function buildHardcodedReferenceItems(assignmentId = "") {
  const normalizedAssignmentId = normalizeAssignmentId(assignmentId);
  const ref = HARDCODED_REFERENCE_ANSWERS[normalizedAssignmentId];
  if (!ref) return [];
  const vocabularyKeys = HARDCODED_VOCABULARY_KEYS[normalizedAssignmentId] || {};
  return Object.entries(ref).map(([key, expected]) => ({
    key,
    partId: "main",
    questionNumber: Number(key),
    expected: String(expected).toUpperCase() === String(expected) && /^[A-FX]$/.test(String(expected)) ? String(expected).toUpperCase() : normalizeAnswer(expected),
    expectedText: "",
    expectedRaw: expected,
    expectedDisplay: expected,
    accepted: [expected],
    type: /^[A-FX]$/i.test(String(expected)) ? "choice" : "vocabulary",
    vocabularyKey: vocabularyKeys[Number(key)] || "",
    preserveFlatPosition: normalizedAssignmentId === "A1-14.1",
  }));
}

function canonicalSemanticToken(token = "") {
  const normalized = normalizeAnswer(token);
  return NUMBER_WORDS.get(normalized) || normalized;
}

function rootToken(token = "") {
  const canonical = canonicalSemanticToken(token);
  if (/^\d+$/.test(canonical)) return canonical;
  return canonical.replace(/(chen|ern|en|er|em|es|e|n|s)$/i, "");
}

function meaningfulRoots(value = "") {
  return normalizeAnswer(value)
    .split(/\s+/)
    .map(canonicalSemanticToken)
    .filter((token) => token && !STOPWORDS.has(token))
    .map(rootToken)
    .filter((token) => token && (/^\d+$/.test(token) || token.length > 1));
}

function editDistance(left = "", right = "") {
  const a = String(left || "");
  const b = String(right || "");
  if (!a) return b.length;
  if (!b) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < b.length; j += 1) {
      current[j + 1] = a[i] === b[j]
        ? previous[j]
        : Math.min(previous[j] + 1, current[j] + 1, previous[j + 1] + 1);
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
}

function rootsApproximatelyMatch(expectedRoot = "", studentRoot = "") {
  if (!expectedRoot || !studentRoot) return false;
  if (expectedRoot === studentRoot || expectedRoot.includes(studentRoot) || studentRoot.includes(expectedRoot)) return true;
  const length = Math.max(expectedRoot.length, studentRoot.length);
  const allowance = length >= 4 ? Math.min(3, Math.max(1, Math.floor(length * 0.25))) : 0;
  return allowance > 0 && editDistance(expectedRoot, studentRoot) <= allowance;
}

function textMatches(expectedRaw = "", studentRaw = "") {
  const expected = normalizeAnswer(expectedRaw);
  const student = normalizeAnswer(studentRaw);
  if (!expected || !student) return false;
  if (expected === student || expected.includes(student) || student.includes(expected)) return true;
  const expectedRoots = meaningfulRoots(expectedRaw);
  const studentRoots = meaningfulRoots(studentRaw);
  if (expectedRoots.length && expectedRoots.every((root) => studentRoots.some((candidate) => rootsApproximatelyMatch(root, candidate)))) return true;
  const expectedStem = rootToken(expected);
  const studentStem = rootToken(student);
  return expectedStem.length >= 4 && studentStem.length >= 4 && rootsApproximatelyMatch(expectedStem, studentStem);
}

function normalizeVocabularyAnswer(value = "") {
  const tokens = normalizeAnswer(value).split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && GERMAN_ARTICLES.has(tokens[0])) tokens.shift();
  return tokens
    .filter((token, index) => {
      if (ENGLISH_ARTICLES.has(token)) return false;
      const isEmbeddedMatchingLetter = /^[b-j]$/.test(token) && ENGLISH_ARTICLES.has(tokens[index + 1]);
      return !isEmbeddedMatchingLetter;
    })
    .join(" ");
}

function normalizeStrictGrammarToken(value = "") {
  return normalizeAnswer(value)
    .replace(/\bhei(?:b|ß)e\b/g, "heisse")
    .replace(/\bhei(?:b|ß)t\b/g, "heisst");
}

function strictGrammarStudentVariants(value = "") {
  const source = String(value || "")
    .replace(/\s+\bSie\s*\([^)]*\)\s*$/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const variants = [source];
  const compactVerbAlternative = source.match(/^(.*?\s)([A-Za-zÄÖÜäöüß]+)\s*\/\s*([A-Za-zÄÖÜäöüß]+)(\s+.*)$/);
  if (compactVerbAlternative) {
    const [, prefix, firstVerb, secondVerb, suffix] = compactVerbAlternative;
    variants.push(`${prefix}${firstVerb}${suffix}`, `${prefix}${secondVerb}${suffix}`);
  }
  return [...new Set(variants.map(normalizeStrictGrammarToken).filter(Boolean))];
}

function strictGrammarTextMatches(expectedRaw = "", studentRaw = "") {
  const expected = normalizeStrictGrammarToken(expectedRaw);
  const student = normalizeStrictGrammarToken(studentRaw);
  return Boolean(expected && student && expected === student);
}

function subjectVerbGrammarMatches(expectedRaw = "", studentRaw = "") {
  const expectedTokens = normalizeStrictGrammarToken(expectedRaw).split(/\s+/).filter(Boolean);
  const studentVariants = strictGrammarStudentVariants(studentRaw);
  if (!expectedTokens.length || !studentVariants.length) return false;
  if (studentVariants.length === 1 && studentVariants[0].split(/\s+/).length === 1 && expectedTokens.length > 1) {
    const expectedVerbForms = String(expectedRaw || "")
      .split(/\s*\/\s*/)
      .map((alternative) => normalizeStrictGrammarToken(alternative).split(/\s+/).filter(Boolean)[1])
      .filter(Boolean);
    return expectedVerbForms.includes(studentVariants[0]);
  }
  const expectedSentence = expectedTokens.join(" ");
  if (studentVariants.includes(expectedSentence)) return true;
  if (expectedTokens.length < 2) return false;
  return studentVariants.some((variant) => {
    const studentTokens = variant.split(/\s+/).filter(Boolean);
    return studentTokens[0] === expectedTokens[0] && studentTokens[1] === expectedTokens[1];
  });
}

function isCorrectAnswer(item, student) {
  const expectedLetter = item.type === "choice" ? String(item.expected || "").toUpperCase() : extractOptionLetter(item.expectedRaw) || extractOptionLetter(item.expected);
  const studentLetter = extractOptionLetter(student);
  if (expectedLetter && studentLetter) return expectedLetter === studentLetter;
  if (expectedLetter && normalizeAnswer(student) === normalizeAnswer(expectedLetter)) return true;
  if (item.type === "choice" && item.expectedText) return textMatches(item.expectedText, student);
  const accepted = item.accepted?.length ? item.accepted : [item.expected, item.expectedText, item.expectedRaw].filter(Boolean);
  if (item.type === "text" && item.matchingMode === "strict_grammar") {
    return accepted.some((expected) => strictGrammarTextMatches(expected, student));
  }
  if (item.type === "text" && item.matchingMode === "subject_verb") {
    return accepted.some((expected) => subjectVerbGrammarMatches(expected, student));
  }
  if (item.type === "vocabulary") return accepted.some((expected) => normalizeVocabularyAnswer(expected) === normalizeVocabularyAnswer(student));
  return accepted.some((expected) => textMatches(expected, student));
}

function isLikelyWritingBlock(entries = []) {
  if (!entries.length) return false;
  const bilingualVocabularyCount = entries.filter((entry) => /^(?:der|die|das)\b.*[-–:=]\s*(?:[a-j][.)]?\s*)?(?:the|a|an)\b/i.test(entry.answer)).length;
  if (bilingualVocabularyCount >= Math.max(2, entries.length * 0.7)) return false;
  const longSentenceCount = entries.filter((entry) => normalizeAnswer(entry.answer).split(/\s+/).length >= 5 || /[.!?]/.test(entry.answer)).length;
  const optionCount = entries.filter((entry) => extractOptionLetter(entry.answer)).length;
  return longSentenceCount >= Math.max(2, entries.length * 0.7) && optionCount === 0;
}

function splitNumberResetAnswerGroups(text = "") {
  const groups = [];
  let current = [];

  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const entries = parseNumberedEntriesFromChunk(rawLine);
    for (const entry of entries) {
      const previousNumber = current[current.length - 1]?.number || 0;
      if (current.length && entry.number <= previousNumber) {
        groups.push(current);
        current = [];
      }
      current.push(entry);
    }
  }

  if (current.length) groups.push(current);
  const alphabetListening = ["wasser", "kaffee", "blume", "schule"];
  const matchesAlphabetWorkbook = groups.length === 2
    && groups[0].length === 7
    && groups[1].length === 5
    && alphabetListening.every((answer, index) => normalizeAnswer(groups[1][index]?.answer) === answer)
    && normalizeAnswer(groups[1][4]?.answer).startsWith("tis");
  return matchesAlphabetWorkbook ? groups : [];
}

function splitQuestionGroupBlocks(text = "") {
  const sourceText = String(text || "");
  const markerRegex = /(?:^|\n)[ \t]*q([1-9])\s*[).:–-]\s*/gi;
  const markers = [];
  let match;

  while ((match = markerRegex.exec(sourceText))) {
    markers.push({
      index: match.index,
      end: markerRegex.lastIndex,
      number: Number(match[1]),
    });
  }

  if (markers.length < 2 || markers.length > 5) return [];
  if (!markers.every((marker, index) => marker.number === index + 1)) return [];

  const groups = markers.map((marker, index) => {
    const next = markers[index + 1];
    const block = sourceText.slice(marker.end, next ? next.index : sourceText.length).trim();
    return extractRestartedNumberingEntries(block);
  });

  return groups.every((entries) => entries.length >= 2) ? groups : [];
}

function permuteAnswerGroups(groups = []) {
  if (groups.length <= 1) return [groups];
  if (groups.length > 5) return [groups];

  const permutations = [];
  groups.forEach((group, index) => {
    const remaining = groups.filter((_, candidateIndex) => candidateIndex !== index);
    permuteAnswerGroups(remaining).forEach((tail) => permutations.push([group, ...tail]));
  });
  return permutations;
}

function flattenAnswerGroups(groups = []) {
  return groups.flatMap((entries) => [...entries]
    .sort((a, b) => a.number - b.number)
    .map((entry) => entry.answer));
}

function extractSectionAnswerEntries(text = "") {
  const numberedEntries = extractRestartedNumberingEntries(text);
  if (numberedEntries.length) return numberedEntries;

  const pairedEntries = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || /^\s*\d{1,3}\s*[).:–-]/.test(line)) return false;
      const parts = line.split(/\s+[-–:=]\s+/);
      return parts.length >= 2 && parts.every((part) => normalizeAnswer(part));
    })
    .map((answer, index) => ({ number: index + 1, answer }));

  return pairedEntries.length >= 2 ? pairedEntries : [];
}

function getFlatAnswerCandidateSequences(submissionText = "") {
  const sections = splitSubmissionIntoSections(submissionText);
  const sectionGroups = sections
    .map((section) => extractSectionAnswerEntries(section.text))
    .filter((entries) => entries.length && !isLikelyWritingBlock(entries));

  const blockGroups = splitIntoAnswerBlocks(submissionText)
    .map((block) => extractRestartedNumberingEntries(block))
    .filter((entries) => entries.length && !isLikelyWritingBlock(entries));

  const questionGroups = splitQuestionGroupBlocks(submissionText);
  const groups = questionGroups.length > 1
    ? questionGroups
    : sectionGroups.length > 1
      ? sectionGroups
      : blockGroups.length > 1
        ? blockGroups
        : sectionGroups.length
          ? sectionGroups
          : blockGroups;
  const numberResetGroups = splitNumberResetAnswerGroups(submissionText);
  if (!groups.length) return [];

  const candidates = [];
  const seen = new Set();
  const addCandidate = (answers) => {
    if (!answers.length) return;
    const key = JSON.stringify(answers);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(answers);
  };

  for (let start = 0; start < groups.length; start += 1) {
    addCandidate(flattenAnswerGroups(groups.slice(start)));
  }

  if (numberResetGroups.length > 1) addCandidate(flattenAnswerGroups(numberResetGroups));

  permuteAnswerGroups(groups).forEach((orderedGroups) => addCandidate(flattenAnswerGroups(orderedGroups)));
  return candidates;
}

function scoreFlatCandidate(referenceItems = [], answers = []) {
  let correct = 0;
  referenceItems.forEach((item, index) => {
    if (isCorrectAnswer(item, answers[index] || "")) correct += 1;
  });
  const missing = Math.max(0, referenceItems.length - answers.length);
  return { correct, missing, answers };
}

function alignRestartedGroups(referenceItems = [], groups = []) {
  if (!groups.length || !referenceItems.length) return [];
  if (groups.length === 1 && groups[0].length >= referenceItems.length) return [];
  let candidates = [{ answers: Array(referenceItems.length).fill(""), nextStart: 0 }];
  for (const group of groups) {
    const ordered = [...group].sort((left, right) => left.number - right.number);
    const nextCandidates = [];
    for (const candidate of candidates) {
      for (let start = candidate.nextStart; start <= referenceItems.length - ordered.length; start += 1) {
        const answers = [...candidate.answers];
        ordered.forEach((entry, offset) => {
          answers[start + offset] = entry.answer;
        });
        nextCandidates.push({ answers, nextStart: start + ordered.length });
      }
    }
    candidates = nextCandidates;
  }
  if (!candidates.length) return [];
  return candidates
    .map((candidate) => scoreFlatCandidate(referenceItems, candidate.answers))
    .sort((left, right) => right.correct - left.correct || left.missing - right.missing)[0]?.answers || [];
}

function buildSequentialPartAnswerMap(referenceItems = [], submissionText = "", hasMatchingPartSections = false) {
  if (!referenceItems.length || hasMatchingPartSections) return new Map();
  const groups = splitIntoAnswerBlocks(submissionText)
    .map((block) => extractRestartedNumberingEntries(block))
    .filter((entries) => entries.length && !isLikelyWritingBlock(entries));
  const alignedAnswers = alignRestartedGroups(referenceItems, groups);
  if (!alignedAnswers.length) return new Map();
  return new Map(referenceItems.map((item, index) => [`${item.partId}.${item.questionNumber}`, alignedAnswers[index] || ""]));
}

function getStudentAnswerForItem({ item, index, submissionText, sections, vocabularyIndexes, sequentialObjectiveAnswers, sequentialPartAnswers, useSequentialChoices }) {
  if (item.type === "vocabulary" && item.vocabularyKey) {
    const vocab = extractVocabularyAnswers(submissionText);
    if (vocab[item.vocabularyKey]) return vocab[item.vocabularyKey];
    const numbered = vocabularyIndexes.get(index);
    if (numbered) return numbered;
  }

  const partSection = sections.find((section) => section.partId === item.partId);
  if (partSection) {
    const byNumber = extractNumberedTextAnswers(partSection.text)[item.questionNumber];
    if (byNumber) return byNumber;
  }

  const sequentialPartAnswer = sequentialPartAnswers.get(`${item.partId}.${item.questionNumber}`);
  if (sequentialPartAnswer !== undefined) return sequentialPartAnswer;

  if (useSequentialChoices && item.type === "choice") {
    const choiceIndex = sequentialObjectiveAnswers[item.choiceIndex];
    if (choiceIndex) return choiceIndex;
  }

  return extractNumberedTextAnswers(submissionText)[item.questionNumber] || "";
}

export function computeObjectiveScore(assignmentIdOrReferenceEntry, submissionText, referenceEntry = null) {
  const source = typeof assignmentIdOrReferenceEntry === "object" ? assignmentIdOrReferenceEntry : referenceEntry || findReferenceEntryFromDictionary(assignmentIdOrReferenceEntry);
  const assignmentId = typeof assignmentIdOrReferenceEntry === "string"
    ? assignmentIdOrReferenceEntry
    : source?.assignmentKey || source?.assignment_id || source?.assignmentId || source?.assignment || "";
  let referenceItems = buildReferenceItems(source || {});
  if (!referenceItems.length) referenceItems = buildHardcodedReferenceItems(assignmentId);
  if (!referenceItems.length) return { correctCount: 0, totalCount: 0, score: 0, details: {} };

  let choiceIndex = 0;
  referenceItems = referenceItems.map((item) => item.type === "choice" ? { ...item, choiceIndex: choiceIndex++ } : item);
  const sections = splitSubmissionIntoSections(submissionText);
  const multipartReference = new Set(referenceItems.map((item) => item.partId)).size > 1;
  const flatMainReference = referenceItems.every((item) => item.partId === "main");
  const hasMatchingPartSections = multipartReference && referenceItems.some((item) => sections.some((section) => section.partId === item.partId));
  const sequentialObjectiveAnswers = extractChoiceAnswers(submissionText);
  const choiceCount = referenceItems.filter((item) => item.type === "choice").length;
  const useSequentialChoices = (flatMainReference || (multipartReference && !hasMatchingPartSections)) && choiceCount > 1 && Object.keys(sequentialObjectiveAnswers).length >= choiceCount;
  const sequentialChoiceValues = Object.values(sequentialObjectiveAnswers);
  const sequentialPartAnswers = buildSequentialPartAnswerMap(referenceItems, submissionText, hasMatchingPartSections);
  const vocabularyValues = extractNumberedVocabularyAnswers(submissionText);
  const vocabularyIndexes = new Map();
  referenceItems.forEach((item, index) => {
    if (item.type === "vocabulary" && vocabularyValues.length) {
      vocabularyIndexes.set(index, vocabularyValues.shift());
    }
  });

  const details = {};
  let correctCount = 0;
  referenceItems.forEach((item, index) => {
    const student = getStudentAnswerForItem({
      item,
      index,
      submissionText,
      sections,
      vocabularyIndexes,
      sequentialObjectiveAnswers: sequentialChoiceValues,
      sequentialPartAnswers,
      useSequentialChoices,
    });
    const correct = isCorrectAnswer(item, student);
    if (correct) correctCount += 1;
    const key = multipartReference ? `${item.partId}.${item.questionNumber}` : String(item.questionNumber);
    details[key] = {
      student,
      expected: item.expectedDisplay || item.expectedRaw || item.expected,
      correct,
    };
  });

  return {
    correctCount,
    totalCount: referenceItems.length,
    score: referenceItems.length ? Math.round((correctCount / referenceItems.length) * 100) : 0,
    details,
  };
}
