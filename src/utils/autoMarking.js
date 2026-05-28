const PART_IDS = ["teil1", "teil2", "teil3", "teil4", "unknown"];
const WRITING_CONFIDENCE_THRESHOLD = 0.75;

const WRITING_RUBRICS = {
  A1: ["task completion", "greeting/closing", "simple grammar", "word order", "vocabulary", "spelling"],
  A2: ["task completion", "structure", "connectors", "grammar", "sentence variety", "vocabulary"],
  B1: ["task completion", "argument/clarity", "structure", "grammar control", "vocabulary", "coherence"],
};

function normalizeForCompare(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLevel(value) {
  const match = String(value || "").match(/\b(A1|A2|B1)\b/i);
  return match ? match[1].toUpperCase() : "";
}

export function normalizeTextForAnswerMatching(value) {
  return normalizeForCompare(value);
}

function normalizeAnswer(value) {
  const normalized = normalizeForCompare(value);
  if (["true", "r", "richtig", "wahr", "yes", "ja"].includes(normalized)) return "R";
  if (["false", "f", "falsch", "nein", "no"].includes(normalized)) return "F";

  const option = String(value || "").trim().match(/^([A-D])\s*[).:-]?$/i);
  if (option) return option[1].toUpperCase();

  return normalized;
}

function extractOptionLetter(value) {
  const trimmed = String(value || "").trim();
  const match = trimmed.match(/^([A-Z])(?:\s*[).:-]|\s+|$)/i);
  return match ? match[1].toUpperCase() : "";
}

function extractOptionText(value) {
  return String(value || "")
    .replace(/^\s*[A-Z](?:\s*[).:-]|\s+)\s*/i, "")
    .trim();
}

function getQuestionIndex(key) {
  const match = String(key || "").match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function detectLevel({ submission = {}, referenceEntry = {}, submissionText = "" } = {}) {
  return normalizeLevel(submission.level)
    || normalizeLevel(referenceEntry.level)
    || normalizeLevel(submission.assignmentKey)
    || normalizeLevel(submission.assignmentId)
    || normalizeLevel(referenceEntry.assignmentKey)
    || normalizeLevel(referenceEntry.assignmentId)
    || normalizeLevel(submission.assignment)
    || normalizeLevel(referenceEntry.assignment)
    || normalizeLevel(submissionText)
    || "";
}

function detectAssignmentKey({ submission = {}, referenceEntry = {} } = {}) {
  return String(
    submission.assignmentKey
      || submission.assignment_key
      || submission.assignmentId
      || submission.assignment_id
      || referenceEntry.assignmentKey
      || referenceEntry.assignment_key
      || referenceEntry.assignmentId
      || referenceEntry.assignment_id
      || referenceEntry.assignment
      || submission.assignment
      || "",
  ).trim();
}

function findPartId(value = "") {
  const normalized = normalizeForCompare(value).replace(/\s+/g, "");
  if (/teil1|part1/.test(normalized)) return "teil1";
  if (/teil2|part2|schreiben|writing/.test(normalized)) return "teil2";
  if (/teil3|part3|lesen|reading/.test(normalized)) return "teil3";
  if (/teil4|part4|horen|hoeren|listening/.test(normalized)) return "teil4";
  return "unknown";
}

function splitSubmissionIntoParts(submissionText = "") {
  const text = String(submissionText || "").trim();
  if (!text) return [{ partId: "unknown", title: "Unknown", text: "", confidence: 0 }];

  const markerRegex = /(?:^|\n)\s*((?:teil|part)\s*[1-4]\b[^\n]*|(?:schreiben|lesen|h[oö]ren|hoeren|writing|reading|listening)\b[^\n]*)\s*:?\s*(?=\n|$)/gi;
  const markers = [];
  let match;
  while ((match = markerRegex.exec(text))) {
    markers.push({ index: match.index, end: markerRegex.lastIndex, title: match[1].trim(), partId: findPartId(match[1]) });
  }

  if (!markers.length) {
    return [{ partId: "unknown", title: "Unlabelled submission", text, confidence: 0.45 }];
  }

  return markers.map((marker, index) => {
    const next = markers[index + 1];
    return {
      partId: marker.partId,
      title: marker.title,
      text: text.slice(marker.end, next ? next.index : text.length).trim(),
      confidence: marker.partId === "unknown" ? 0.5 : 0.9,
    };
  }).filter((part) => part.text || part.partId !== "unknown");
}

function looksLikeWritingTask(text = "") {
  const normalized = normalizeForCompare(text);
  const wordCount = normalized ? normalized.split(" ").length : 0;
  const hasGreeting = /\b(lieber|liebe|hallo|guten tag|sehr geehrte|dear|hello|hi)\b/i.test(text);
  const hasClosing = /\b(viele grusse|viele gruesse|mit freundlichen grussen|mit freundlichen gruessen|tschuss|bis bald|regards|sincerely|best wishes)\b/i.test(text);
  const firstPerson = /\bich|mir|mich|mein|meine|wir|uns\b/i.test(text);
  const sentenceCount = (String(text).match(/[.!?]/g) || []).length;
  return (hasGreeting && (hasClosing || wordCount >= 25)) || (firstPerson && sentenceCount >= 3 && wordCount >= 30);
}

function detectPartType({ level, partId, text, referenceEntry = {} } = {}) {
  const format = String(referenceEntry?.format || "").toLowerCase();
  if (partId === "teil2") return "writing";
  if (["teil3", "teil4"].includes(partId)) return "objective";
  if (format === "objective") return "objective";
  if (format === "writing") return "writing";
  if (level === "A1" && looksLikeWritingTask(text)) return "writing";
  if (looksLikeWritingTask(text) && partId === "unknown") return "writing";
  return "objective";
}

function parseStudentObjectiveAnswers(submissionText = "") {
  const text = String(submissionText || "");
  const map = new Map();

  const explicitRegex = /(?:^|\n|\r)\s*(?:answer|antwort|frage|nr\.?|q)?\s*(\d{1,3})\s*[).:-]\s*([^\n\r]+)/gi;
  let explicitMatch;
  while ((explicitMatch = explicitRegex.exec(text))) {
    map.set(Number.parseInt(explicitMatch[1], 10), explicitMatch[2].trim());
  }

  if (!map.size) {
    text.split(/[\n,;]+/).forEach((chunk, index) => {
      const trimmed = chunk.trim();
      if (/^[A-DRFrf]$/i.test(trimmed) || /^(richtig|falsch|true|false)$/i.test(trimmed)) {
        map.set(index + 1, trimmed);
      }
    });
  }

  return map;
}

function flattenAnswerEntries(referenceAnswers = {}, path = []) {
  if (typeof referenceAnswers === "string" || typeof referenceAnswers === "number" || typeof referenceAnswers === "boolean") {
    return [{ key: path.join("."), value: String(referenceAnswers) }];
  }
  if (!referenceAnswers || typeof referenceAnswers !== "object") return [];
  return Object.entries(referenceAnswers).flatMap(([key, value]) => flattenAnswerEntries(value, [...path, key]));
}

function getObjectiveAnswerKey(referenceEntry = {}, partId = "unknown") {
  if (referenceEntry.parts?.[partId]?.answers) return referenceEntry.parts[partId].answers;
  if (partId !== "unknown") {
    const matchingPartKey = Object.keys(referenceEntry.parts || {}).find((key) => findPartId(key) === partId);
    if (matchingPartKey && referenceEntry.parts[matchingPartKey]?.answers) return referenceEntry.parts[matchingPartKey].answers;
  }

  const candidates = [
    referenceEntry.answerKeys,
    referenceEntry.answer_key,
    referenceEntry.answers,
    referenceEntry.key,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate?.[partId]) return candidate[partId];
    if (partId !== "unknown") {
      const matchingKey = Object.keys(candidate || {}).find((key) => findPartId(key) === partId);
      if (matchingKey) return candidate[matchingKey];
    }
  }

  if (partId === "unknown" || String(referenceEntry.format || "").toLowerCase() === "objective") {
    if (referenceEntry.parts?.unknown?.answers) return referenceEntry.parts.unknown.answers;
    return referenceEntry.answers || referenceEntry.answerKeys || referenceEntry.key || {};
  }

  return {};
}

function levenshteinDistance(a = "", b = "") {
  const left = String(a);
  const right = String(b);
  if (!left) return right.length;
  if (!right) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 0; i < left.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < right.length; j += 1) {
      current[j + 1] = left[i] === right[j]
        ? previous[j]
        : Math.min(previous[j] + 1, current[j] + 1, previous[j + 1] + 1);
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function stripGermanStem(value = "") {
  return normalizeForCompare(value).replace(/(en|ern|er|em|es|e|n|s)$/i, "");
}

function expectedMetadata(expectedRaw) {
  if (expectedRaw && typeof expectedRaw === "object") {
    return {
      raw: expectedRaw.raw || expectedRaw.correctText || expectedRaw.correctLetter || "",
      correctLetter: String(expectedRaw.correctLetter || "").toUpperCase(),
      correctText: expectedRaw.correctText || extractOptionText(expectedRaw.raw || ""),
      acceptedAnswers: expectedRaw.acceptedAnswers || [],
      questionNumber: expectedRaw.questionNumber,
    };
  }
  const raw = String(expectedRaw ?? "");
  const letter = extractOptionLetter(raw);
  return { raw, correctLetter: letter, correctText: extractOptionText(raw), acceptedAnswers: [], questionNumber: "" };
}

function textMatches(expectedTextRaw, studentTextRaw) {
  const expectedText = normalizeForCompare(expectedTextRaw);
  const studentText = normalizeForCompare(studentTextRaw);
  if (!expectedText || !studentText) return false;
  if (expectedText === studentText) return true;
  if (expectedText.includes(studentText) || studentText.includes(expectedText)) return true;
  const expectedStem = stripGermanStem(expectedText);
  const studentStem = stripGermanStem(studentText);
  if (expectedStem.length >= 4 && studentStem.length >= 4 && (expectedStem.includes(studentStem) || studentStem.includes(expectedStem))) return true;
  const maxLength = Math.max(expectedText.length, studentText.length);
  const distance = levenshteinDistance(expectedText, studentText);
  return maxLength >= 5 && distance <= Math.max(1, Math.floor(maxLength * 0.25));
}

function valuesMatch(expectedRaw, studentRaw) {
  const meta = expectedMetadata(expectedRaw);
  const expected = normalizeAnswer(meta.raw);
  const student = normalizeAnswer(studentRaw);
  if (!expected || !student) return { status: "wrong" };
  if (expected === student) return { status: "correct", reason: "Exact answer match" };

  const expectedLetter = meta.correctLetter || extractOptionLetter(meta.raw);
  const studentLetter = extractOptionLetter(studentRaw);
  const studentText = extractOptionText(studentRaw);
  const expectedText = meta.correctText || extractOptionText(meta.raw);

  if (expectedLetter && studentLetter) {
    if (expectedLetter === studentLetter) return { status: "correct", reason: "Correct option letter" };
    if (textMatches(expectedText, studentText || studentRaw)) {
      return { status: "needs_review", reason: "Conflicting option letter and answer text" };
    }
    return { status: "wrong" };
  }

  if (expectedLetter && normalizeForCompare(studentRaw) === normalizeForCompare(expectedLetter)) {
    return { status: "correct", reason: "Correct option letter" };
  }

  const acceptedTextMatch = meta.acceptedAnswers.some((answer) => textMatches(answer, studentRaw));
  if (acceptedTextMatch || textMatches(expectedText || meta.raw, studentText || studentRaw)) {
    return { status: "correct", reason: "Correct answer text" };
  }

  return { status: "wrong" };
}

function objectiveMarker(referenceAnswers = {}, submissionText = "", { partId = "unknown" } = {}) {
  const studentAnswers = parseStudentObjectiveAnswers(submissionText);
  const entries = Array.isArray(referenceAnswers)
    ? referenceAnswers.map((entry, index) => ({ key: entry.questionNumber || entry.sourceKey || `Answer${index + 1}`, value: entry }))
    : flattenAnswerEntries(referenceAnswers);
  const total = entries.length;

  if (!total) {
    return {
      correct: [],
      wrong: [],
      missing: [],
      score: 0,
      percentage: 0,
      total: 0,
      needsReview: partId === "teil4" ? [] : [{ reason: "No answer key found for this assignment" }],
      status: partId === "teil4" ? "info" : "needs_review",
      feedback: partId === "teil4" ? "No Teil 4 answer key found" : "No answer key found for this assignment",
      confidence: partId === "teil4" ? 0.9 : 0.25,
    };
  }

  const correct = [];
  const wrong = [];
  const missing = [];
  const needsReview = [];

  for (const [entryIndex, entry] of entries.entries()) {
    const questionIndex = getQuestionIndex(entry.key) || entryIndex + 1;
    const studentRaw = studentAnswers.get(questionIndex) || "";
    const item = { question: questionIndex, expected: String(entry.value?.raw || entry.value), submitted: String(studentRaw || "") };

    if (!studentRaw) {
      missing.push(item);
    } else {
      const match = valuesMatch(entry.value, studentRaw);
      if (match.status === "correct") {
        correct.push({ ...item, reason: match.reason });
      } else if (match.status === "needs_review") {
        needsReview.push({ ...item, reason: match.reason });
      } else {
        wrong.push(item);
      }
    }
  }

  const percentage = Math.round((correct.length / total) * 100);
  return {
    correct,
    wrong,
    missing,
    needsReview,
    score: correct.length,
    total,
    percentage,
    status: needsReview.length ? "needs_review" : "marked",
    feedback: needsReview.length
      ? `Objective score: ${correct.length}/${total} correct (${percentage}%). ${needsReview.length} answer(s) need review.`
      : `Objective score: ${correct.length}/${total} correct (${percentage}%).`,
    confidence: needsReview.length ? 0.55 : missing.length === total ? 0.45 : 0.95,
  };
}

function tokenize(value) {
  return normalizeForCompare(value).split(" ").filter(Boolean);
}

function estimateGrammarSignal(text = "") {
  const sentences = String(text).split(/[.!?\n]+/).map((line) => line.trim()).filter(Boolean);
  if (!sentences.length) return 0.25;
  const capitalized = sentences.filter((sentence) => /^[A-ZÄÖÜ]/.test(sentence)).length / sentences.length;
  const verbLike = sentences.filter((sentence) => /\b(bin|bist|ist|sind|seid|habe|hat|haben|möchte|mochte|will|kann|gehe|komme|wohne|lerne|arbeite)\b/i.test(sentence)).length / sentences.length;
  return Math.min(1, (capitalized + verbLike) / 2);
}

function heuristicWritingMarker({ level = "", partId = "unknown", text = "" } = {}) {
  const words = tokenize(text);
  const wordCount = words.length;
  const hasGreeting = /\b(lieber|liebe|hallo|guten tag|sehr geehrte|dear|hello|hi)\b/i.test(text);
  const hasClosing = /\b(viele grusse|viele gruesse|mit freundlichen grussen|mit freundlichen gruessen|tschuss|bis bald|regards|sincerely|best wishes)\b/i.test(text);
  const connectors = (normalizeForCompare(text).match(/\b(und|aber|denn|weil|dass|deshalb|trotzdem|zuerst|danach|außerdem|ausserdem)\b/g) || []).length;
  const grammarSignal = estimateGrammarSignal(text);
  const targetWords = level === "B1" ? 85 : level === "A2" ? 55 : 30;
  const completion = Math.min(1, wordCount / targetWords);
  const structure = Math.min(1, ((hasGreeting ? 0.35 : 0) + (hasClosing ? 0.35 : 0) + (String(text).split(/\n+/).filter((line) => line.trim()).length > 1 ? 0.3 : 0.15)));
  const connectorScore = Math.min(1, connectors / (level === "B1" ? 4 : level === "A2" ? 3 : 1));
  const lexicalRange = Math.min(1, new Set(words).size / Math.max(8, wordCount * 0.7));

  const score = Math.round((completion * 0.3 + structure * 0.2 + grammarSignal * 0.25 + connectorScore * 0.1 + lexicalRange * 0.15) * 100);
  const confidence = Math.max(0.45, Math.min(0.9, 0.45 + completion * 0.25 + (hasGreeting || hasClosing ? 0.1 : 0) + (wordCount > 15 ? 0.1 : 0)));
  const rubric = WRITING_RUBRICS[level] || WRITING_RUBRICS.A1;

  return {
    score,
    passed: score >= 60,
    level: level || "UNKNOWN",
    partId,
    feedback: `Writing marked with ${level || "default"} rubric (${rubric.join(", ")}). Score: ${score}%.`,
    corrections: [],
    improvementSummary: score >= 75
      ? "Good structure. Keep improving accuracy and range."
      : "Improve task completion, sentence accuracy, structure, and level-appropriate vocabulary.",
    confidence: Number(confidence.toFixed(2)),
    rubric,
  };
}

function aggregatePartResults(parts = []) {
  const objectiveResults = parts.filter((part) => part.partType === "objective" && part.result);
  const writingResults = parts.filter((part) => part.partType === "writing" && part.result);

  const objectiveCorrect = objectiveResults.reduce((sum, part) => sum + (part.result.correct?.length || 0), 0);
  const objectiveTotal = objectiveResults.reduce((sum, part) => sum + (part.result.total || 0), 0);
  const objectivePercentage = objectiveTotal ? Math.round((objectiveCorrect / objectiveTotal) * 100) : null;
  const writingScore = writingResults.length
    ? Math.round(writingResults.reduce((sum, part) => sum + Number(part.result.score || 0), 0) / writingResults.length)
    : null;

  const availableScores = [objectivePercentage, writingScore].filter((value) => value !== null);
  const finalScore = availableScores.length ? Math.round(availableScores.reduce((sum, value) => sum + value, 0) / availableScores.length) : 0;
  const confidenceValues = parts.map((part) => Number(part.confidence || part.result?.confidence || 0)).filter(Boolean);
  const confidence = confidenceValues.length
    ? Number((confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length).toFixed(2))
    : 0;

  return { objectiveCorrect, objectiveTotal, objectivePercentage, writingScore, finalScore, confidence };
}

function routeAndMarkSubmission({ referenceEntry = {}, submission = {}, submissionText = "", aiWritingMarker = heuristicWritingMarker } = {}) {
  const level = detectLevel({ submission, referenceEntry, submissionText });
  const assignmentKey = detectAssignmentKey({ submission, referenceEntry });
  const rawParts = splitSubmissionIntoParts(submissionText);

  const parts = rawParts.map((part) => {
    const partType = detectPartType({ level, partId: part.partId, text: part.text, referenceEntry });
    if (partType === "writing") {
      const writingResult = aiWritingMarker({ level, partId: part.partId, text: part.text, rubric: WRITING_RUBRICS[level] || WRITING_RUBRICS.A1 });
      return { ...part, partType, result: writingResult, confidence: Math.min(part.confidence || 0.5, writingResult.confidence || 0.5) };
    }

    const answerKey = getObjectiveAnswerKey(referenceEntry, part.partId);
    const objectiveResult = objectiveMarker(answerKey, part.text, { partId: part.partId });
    return { ...part, partType, result: objectiveResult, confidence: objectiveResult.confidence || part.confidence || 0.5 };
  });

  const aggregate = aggregatePartResults(parts);
  const hasWriting = parts.some((part) => part.partType === "writing");
  const isObjectiveAssignment = String(referenceEntry?.format || "").toLowerCase() === "objective";
  const unclearStructure = !level || !assignmentKey || (!isObjectiveAssignment && parts.some((part) => part.partId === "unknown" && !looksLikeWritingTask(part.text)));
  const objectiveNeedsReview = parts.some((part) => part.partType === "objective" && (part.result?.status === "needs_review" || part.result?.needsReview?.length));
  const missingRequiredObjectiveKey = parts.some((part) => part.partType === "objective" && !part.result?.total && part.partId !== "teil4");
  const needsReview = unclearStructure || aggregate.confidence < WRITING_CONFIDENCE_THRESHOLD || missingRequiredObjectiveKey || objectiveNeedsReview;
  const status = needsReview ? "needs_review" : "marked";
  const shouldSendAutomatically = !hasWriting || aggregate.confidence >= WRITING_CONFIDENCE_THRESHOLD;

  return {
    score: aggregate.finalScore,
    passed: aggregate.finalScore >= 60,
    level: level || "UNKNOWN",
    assignmentKey,
    detectedParts: parts.map(({ partId, title, partType, confidence }) => ({ partId, title, partType, confidence })),
    parts,
    objectiveScore: aggregate.objectivePercentage,
    objectiveCorrect: aggregate.objectiveCorrect,
    objectiveTotal: aggregate.objectiveTotal,
    writingScore: aggregate.writingScore,
    finalScore: aggregate.finalScore,
    feedback: parts.map((part) => part.result?.feedback).filter(Boolean).join("\n"),
    corrections: parts.flatMap((part) => part.result?.corrections || []),
    improvementSummary: parts.map((part) => part.result?.improvementSummary).filter(Boolean).join("\n"),
    confidence: aggregate.confidence,
    status,
    shouldSendAutomatically,
    dataModel: {
      markingProfilePath: assignmentKey ? `markingProfiles/${assignmentKey}` : "markingProfiles/{assignmentKey}",
      answerKeyPath: assignmentKey ? `answerKeyRegistry/${assignmentKey}` : "answerKeyRegistry/{assignmentKey}",
      submissionPath: submission.id ? `submissions/${submission.id}` : "submissions/{submissionId}",
      markingResultPath: submission.id ? `markingResults/${submission.id}` : "markingResults/{submissionId}",
      markingJobPath: "markingJobs/{jobId}",
    },
  };
}

export function autoMarkSubmission({ referenceEntry = {}, submission = {}, submissionText = "", aiWritingMarker } = {}) {
  return routeAndMarkSubmission({ referenceEntry, submission, submissionText, aiWritingMarker });
}

export {
  WRITING_CONFIDENCE_THRESHOLD,
  WRITING_RUBRICS,
  detectAssignmentKey,
  detectLevel,
  detectPartType,
  getObjectiveAnswerKey,
  heuristicWritingMarker,
  looksLikeWritingTask,
  normalizeAnswer,
  objectiveMarker,
  routeAndMarkSubmission,
  splitSubmissionIntoParts,
};

export const __testing__ = {
  normalizeForCompare,
  extractOptionLetter,
  extractOptionText,
  parseStudentObjectiveAnswers,
  objectiveMarker,
  splitSubmissionIntoParts,
  detectPartType,
  looksLikeWritingTask,
};
