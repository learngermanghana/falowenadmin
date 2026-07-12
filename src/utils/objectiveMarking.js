import answersDictionary from "../data/answers_dictionary.json" with { type: "json" };

const OPTION_LETTERS = "ABCDEFX";
const GERMAN_ARTICLES = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines"]);
const STOPWORDS = new Set([
  "ich", "du", "er", "sie", "es", "wir", "ihr", "ja", "nein", "gern", "gerne", "mag", "mochte", "moechte",
  "nicht", "spiele", "spielen", "kostet", "kosten", "ist", "sind", "bin", "ein", "eine", "der", "die", "das",
  "und", "oder", "zu", "in", "mit", "auf", "am", "im", "den", "dem", "des", "mein", "meine",
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
  const writingParts = referenceEntry.writingParts || referenceEntry.writing_parts || [];
  if (Array.isArray(writingParts) && writingParts.map(normalizePartId).includes(normalizedPartId)) return true;
  const grading = referenceEntry.partGrading?.[partId] || referenceEntry.partGrading?.[normalizedPartId];
  const gradingMode = normalizeAnswer(grading?.gradingMode || grading?.mode || grading?.instruction || "");
  if (/writing|schreiben|ai written response/.test(gradingMode)) return true;
  return normalizedPartId === "teil2" && Array.isArray(referenceEntry.expectedParts) && referenceEntry.expectedParts.length > 1;
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
  const explicit = raw.match(new RegExp(`^([${OPTION_LETTERS}])(?:\\s*[).:-]|\\s+|$)`, "i"));
  return explicit ? explicit[1].toUpperCase() : "";
}

function extractOptionText(value = "") {
  return stripQuestionLabel(value)
    .replace(new RegExp(`^([${OPTION_LETTERS}])(?:\\s*[).:-]|\\s+)`, "i"), "")
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
  for (const line of String(text || "").split(/\r?\n|[,;]+/)) {
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

function partMarkerToPartId(label = "", number = "") {
  if (number) return `teil${Number(number)}`;
  const normalized = normalizeAnswer(label).replace(/\s+/g, "");
  if (/lesen|reading/.test(normalized)) return "teil3";
  if (/horen|hoeren|listening/.test(normalized)) return "teil4";
  if (/schreiben|writing/.test(normalized)) return "teil2";
  return normalizePartId(label);
}

function splitSubmissionIntoSections(text = "") {
  const sections = [];
  const source = String(text || "");
  const markerRegex = /(?:^|\n)[ \t]*((?:teil|part)[ \t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \t]*(?:\([^\n)]*\))?[ \t]*[:;]?[ \t]*(?=\n|$)/gi;
  const markers = [];
  let match;
  while ((match = markerRegex.exec(source))) {
    const partId = partMarkerToPartId(match[1], match[2]);
    markers.push({ index: match.index, end: markerRegex.lastIndex, partId, partNumber: Number(partId.replace("teil", "")) || null });
  }
  if (!markers.length) return [{ partId: "main", partNumber: null, text: source }];
  markers.forEach((marker, index) => {
    const next = markers[index + 1];
    sections.push({ partId: marker.partId, partNumber: marker.partNumber, text: source.slice(marker.end, next ? next.index : source.length) });
  });
  return sections;
}

function splitIntoAnswerBlocks(text = "") {
  return String(text || "").split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean);
}

function parseNumberedEntriesFromChunk(chunk = "") {
  const source = String(chunk || "").trim();
  if (!source) return [];

  const compactPattern = /(?:^|\s)(\d{1,3})\s*[).:–-]?\s*(.*?)(?=\s+\d{1,3}\s*[).:–-]?|$)/g;
  const compactMatches = [...source.matchAll(compactPattern)]
    .map((match) => ({ number: Number(match[1]), answer: String(match[2] || "").trim() }))
    .filter((entry) => Number.isFinite(entry.number) && normalizeAnswer(entry.answer));

  if (compactMatches.length > 1) return compactMatches;

  const single = source.match(/^\s*(?:answer|antwort|frage|aufgabe|task|exercise|nr\.?|q)?\s*(\d{1,3})\s*[).:–-]?\s*(.+?)\s*$/i);
  if (single && normalizeAnswer(single[2])) return [{ number: Number(single[1]), answer: single[2].trim() }];

  return [];
}

function extractNumberedTextEntries(text = "") {
  const entries = [];
  let pendingQuestionNumber = null;
  for (const rawLine of String(text || "").split(/\r?\n|[,;]+/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const questionLabel = line.match(/^\s*(?:frage|answer|antwort|aufgabe|task|exercise|nr\.?|q)\s*(\d{1,3})\s*[).:-]?\s*$/i);
    if (questionLabel) {
      pendingQuestionNumber = Number(questionLabel[1]);
      continue;
    }
    const parsed = parseNumberedEntriesFromChunk(line);
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
  return entries.sort((a, b) => a.number - b.number);
}

function extractLeadingUnnumberedAnswer(text = "") {
  for (const rawLine of String(text || "").split(/\r?\n|[,;]+/)) {
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
  for (const line of String(text).split(/\n|\r/)) {
    const parts = line.split(/[-–:=]/);
    if (parts.length < 2) continue;
    const left = normalizeAnswer(parts[0]);
    const right = normalizeAnswer(parts.slice(1).join(" "));
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
  const ref = HARDCODED_REFERENCE_ANSWERS[normalizeAssignmentId(assignmentId)];
  if (!ref) return [];
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
    vocabularyKey: "",
  }));
}

function rootToken(token = "") {
  return normalizeAnswer(token).replace(/(chen|ern|en|er|em|es|e|n|s)$/i, "");
}

function meaningfulRoots(value = "") {
  return normalizeAnswer(value).split(/\s+/).map(rootToken).filter((token) => token && token.length > 1 && !STOPWORDS.has(token));
}

function textMatches(expectedRaw = "", studentRaw = "") {
  const expected = normalizeAnswer(expectedRaw);
  const student = normalizeAnswer(studentRaw);
  if (!expected || !student) return false;
  if (expected === student || expected.includes(student) || student.includes(expected)) return true;
  const expectedRoots = meaningfulRoots(expectedRaw);
  const studentRoots = new Set(meaningfulRoots(studentRaw));
  if (expectedRoots.length && expectedRoots.every((root) => studentRoots.has(root))) return true;
  const expectedStem = rootToken(expected);
  const studentStem = rootToken(student);
  return expectedStem.length >= 4 && studentStem.length >= 4 && (expectedStem.includes(studentStem) || studentStem.includes(expectedStem));
}

function normalizeVocabularyAnswer(value = "") {
  const tokens = normalizeAnswer(value).split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && GERMAN_ARTICLES.has(tokens[0])) tokens.shift();
  return tokens.join(" ");
}

function isCorrectAnswer(item, student) {
  const expectedLetter = item.type === "choice" ? String(item.expected || "").toUpperCase() : extractOptionLetter(item.expectedRaw) || extractOptionLetter(item.expected);
  const studentLetter = extractOptionLetter(student);
  if (expectedLetter && studentLetter) return expectedLetter === studentLetter;
  if (expectedLetter && normalizeAnswer(student) === normalizeAnswer(expectedLetter)) return true;
  if (item.type === "choice" && item.expectedText) return textMatches(item.expectedText, student);
  const accepted = item.accepted?.length ? item.accepted : [item.expected, item.expectedText, item.expectedRaw].filter(Boolean);
  if (item.type === "vocabulary") return accepted.some((expected) => normalizeVocabularyAnswer(expected) === normalizeVocabularyAnswer(student));
  return accepted.some((expected) => textMatches(expected, student));
}

function isLikelyWritingBlock(entries = []) {
  if (!entries.length) return false;
  const longSentenceCount = entries.filter((entry) => normalizeAnswer(entry.answer).split(/\s+/).length >= 5 || /[.!?]/.test(entry.answer)).length;
  const optionCount = entries.filter((entry) => extractOptionLetter(entry.answer)).length;
  return longSentenceCount >= Math.max(2, entries.length * 0.7) && optionCount === 0;
}

function getFlatAnswerCandidateSequences(submissionText = "") {
  const sections = splitSubmissionIntoSections(submissionText);
  const sectionGroups = sections
    .map((section) => extractRestartedNumberingEntries(section.text))
    .filter((entries) => entries.length && !isLikelyWritingBlock(entries));

  const blockGroups = splitIntoAnswerBlocks(submissionText)
    .map((block) => extractRestartedNumberingEntries(block))
    .filter((entries) => entries.length && !isLikelyWritingBlock(entries));

  const groups = sectionGroups.length > 1 ? sectionGroups : blockGroups.length > 1 ? blockGroups : sectionGroups.length ? sectionGroups : blockGroups;
  if (!groups.length) return [];

  const candidates = [];
  for (let start = 0; start < groups.length; start += 1) {
    const selectedGroups = groups.slice(start);
    const answers = selectedGroups.flatMap((entries) => entries.sort((a, b) => a.number - b.number).map((entry) => entry.answer));
    if (answers.length) candidates.push(answers);
  }

  candidates.push(groups.flatMap((entries) => entries.sort((a, b) => a.number - b.number).map((entry) => entry.answer)));
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

function chooseBestFlatAnswers(referenceItems = [], submissionText = "") {
  const candidates = getFlatAnswerCandidateSequences(submissionText);
  if (!candidates.length) return [];
  return candidates
    .map((answers) => scoreFlatCandidate(referenceItems, answers))
    .sort((a, b) => b.correct - a.correct || a.missing - b.missing || b.answers.length - a.answers.length)[0]?.answers || [];
}

function buildSequentialPartAnswerMap(referenceItems = [], submissionText = "", hasMatchingPartSections = false) {
  if (hasMatchingPartSections) return new Map();
  const groups = [];
  const seen = new Set();
  for (const item of referenceItems) {
    if (item.partId === "main") continue;
    if (!seen.has(item.partId)) {
      seen.add(item.partId);
      groups.push({ partId: item.partId, items: [] });
    }
    groups[groups.length - 1].items.push(item);
  }
  if (!groups.length) return new Map();

  const blocks = splitIntoAnswerBlocks(submissionText).map(extractNumberedTextEntries).filter((entries) => entries.length && !isLikelyWritingBlock(entries));
  if (!blocks.length) return new Map();
  const map = new Map();

  if (blocks.length === 1) {
    let offset = 0;
    for (const group of groups) {
      group.items.forEach((item, index) => {
        const entry = blocks[0][offset + index];
        if (entry) map.set(`${item.partId}.${item.questionNumber}`, entry.answer);
      });
      offset += group.items.length;
    }
    return map;
  }

  groups.forEach((group, groupIndex) => {
    const block = blocks[groupIndex] || [];
    group.items.forEach((item, index) => {
      const entry = block[index];
      if (entry) map.set(`${item.partId}.${item.questionNumber}`, entry.answer);
    });
  });

  return map;
}

function getStudentAnswerForItem({ item, index, submissionText, sections, flatAnswers, sequentialPartAnswers }) {
  if (item.type === "vocabulary") {
    const vocabularyPairs = extractVocabularyAnswers(submissionText);
    if (item.vocabularyKey && vocabularyPairs[item.vocabularyKey]) return vocabularyPairs[item.vocabularyKey];
    const pairedVocabularyValues = Object.values(vocabularyPairs);
    const pairedVocabularyIndex = Math.max(0, index - 5);
    if (pairedVocabularyValues[pairedVocabularyIndex]) return pairedVocabularyValues[pairedVocabularyIndex];
    const vocabularyValues = extractNumberedVocabularyAnswers(submissionText);
    const vocabularyIndex = Math.max(0, index - 5);
    if (vocabularyValues[vocabularyIndex]) return vocabularyValues[vocabularyIndex];
  }

  if (item.partId === "main") return flatAnswers[index] || "";

  const sequentialPartAnswer = sequentialPartAnswers.get(`${item.partId}.${item.questionNumber}`);
  if (sequentialPartAnswer !== undefined) return sequentialPartAnswer;

  const sectionText = sections.find((section) => section.partId === item.partId)?.text || submissionText;
  const numberedAnswers = extractNumberedTextAnswers(sectionText);
  if (numberedAnswers[item.questionNumber] !== undefined) return numberedAnswers[item.questionNumber];

  if (item.type === "vocabulary") {
    const vocabularyPairs = extractVocabularyAnswers(submissionText);
    if (item.vocabularyKey && vocabularyPairs[item.vocabularyKey]) return vocabularyPairs[item.vocabularyKey];
    const pairedVocabularyValues = Object.values(vocabularyPairs);
    const pairedVocabularyIndex = Math.max(0, index - 5);
    if (pairedVocabularyValues[pairedVocabularyIndex]) return pairedVocabularyValues[pairedVocabularyIndex];
    const vocabularyValues = extractNumberedVocabularyAnswers(submissionText);
    const vocabularyIndex = Math.max(0, index - sections.length);
    if (vocabularyValues[vocabularyIndex]) return vocabularyValues[vocabularyIndex];
  }

  return extractNumberedTextAnswers(submissionText)[item.questionNumber] || "";
}

export function computeObjectiveScore(assignmentIdOrReferenceEntry, submissionText, referenceEntry = null) {
  const source = typeof assignmentIdOrReferenceEntry === "object" ? assignmentIdOrReferenceEntry : referenceEntry || findReferenceEntryFromDictionary(assignmentIdOrReferenceEntry);
  const assignmentId = typeof assignmentIdOrReferenceEntry === "string"
    ? assignmentIdOrReferenceEntry
    : assignmentIdOrReferenceEntry?.assignmentKey || assignmentIdOrReferenceEntry?.assignmentId || assignmentIdOrReferenceEntry?.assignment_id || "";

  const hardcodedItems = buildHardcodedReferenceItems(assignmentId);
  const items = buildReferenceItems(source || {});
  const referenceItems = hardcodedItems.length ? hardcodedItems : items;
  if (!referenceItems.length) return { correctCount: 0, totalCount: 0, details: {} };

  const sections = splitSubmissionIntoSections(submissionText);
  const partIds = new Set(referenceItems.map((item) => item.partId));
  const flatMainReference = referenceItems.every((item) => item.partId === "main");
  const referencePartIds = [...partIds].filter((partId) => partId !== "main");
  const sectionPartIds = new Set(sections.filter((section) => section.partId !== "main").map((section) => section.partId));
  const hasMatchingPartSections = Boolean(referencePartIds.length) && referencePartIds.every((partId) => sectionPartIds.has(partId));
  let flatAnswers = flatMainReference ? chooseBestFlatAnswers(referenceItems, submissionText) : [];
  if (flatMainReference) {
    const sectionAnswers = sections
      .filter((section) => section.partId !== "main")
      .flatMap((section) => extractRestartedNumberingEntries(section.text).sort((a, b) => a.number - b.number).map((entry) => entry.answer));
    if (scoreFlatCandidate(referenceItems, sectionAnswers).correct > scoreFlatCandidate(referenceItems, flatAnswers).correct) flatAnswers = sectionAnswers;
  }
  const sequentialPartAnswers = buildSequentialPartAnswerMap(referenceItems, submissionText, hasMatchingPartSections);

  const details = {};
  let correctCount = 0;

  referenceItems.forEach((item, index) => {
    const student = getStudentAnswerForItem({ item, index, submissionText, sections, flatAnswers, sequentialPartAnswers });
    const correct = isCorrectAnswer(item, student);
    if (correct) correctCount += 1;
    const detailKey = item.partId === "main" ? String(item.questionNumber || index + 1) : `${item.partId}.${item.questionNumber || index + 1}`;
    details[detailKey] = {
      student,
      expected: item.expected,
      expectedDisplay: item.expectedDisplay || item.expectedRaw || item.expected,
      rawExpected: item.expectedRaw,
      correct,
      partId: item.partId,
    };
  });

  return { correctCount, totalCount: referenceItems.length, details };
}
