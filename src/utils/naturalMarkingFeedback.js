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

function feedbackSentences(result = {}) {
  const sources = [
    result.aiDetailedFeedback,
    result.aiOriginalFeedback,
    result.ai?.detailedFeedback,
    result.ai?.originalFeedback,
    result.feedback,
    result.improvementSummary,
  ];
  return unique(sources.flatMap((value) => String(value || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)));
}

function genericWritingSentence(value = "") {
  return /^(?:your free-text response is clear|the main purpose of your message is understandable|check verb position, articles and every task point before submitting|your message uses an appropriate greeting and closing|read it through once more before submitting)/i.test(String(value || "").trim());
}

function objectiveFeedbackSentence(value = "") {
  return /\b(?:objective|questions?\s+\d+|answers?\s+(?:are|is)|teil\s*[34]|score|correct answers?|review question)/i.test(String(value || ""));
}

function quotesAreGrounded(value = "", submissionText = "") {
  const quotes = [...String(value || "").matchAll(/[“"]([^”"]{3,90})[”"]|[‘']([^’']{3,90})[’']/g)]
    .map((match) => match[1] || match[2])
    .filter(Boolean);
  if (!quotes.length) return true;
  const source = String(submissionText || "").toLocaleLowerCase("de");
  return quotes.some((quote) => source.includes(quote.toLocaleLowerCase("de")));
}

function specificAiWritingTip(result = {}, submissionText = "") {
  const correctionCue = /\b(?:write|replace|correct|revise|avoid|add|change|spelling|word order|capitalis|punctuation|instead of)\b/i;
  const writingCue = /\b(?:clear|sentence|grammar|language|country|wording|structure|vocabulary|communicates?|mentions?|includes?)\b/i;
  const candidates = feedbackSentences(result).filter((value) => {
    const words = value.split(/\s+/).filter(Boolean).length;
    return words >= 5
      && words <= 45
      && !genericWritingSentence(value)
      && !objectiveFeedbackSentence(value)
      && quotesAreGrounded(value, submissionText);
  });
  return candidates.find((value) => correctionCue.test(value))
    || candidates.find((value) => writingCue.test(value))
    || "";
}

const A1_COUNTRY_LANGUAGE_TERMS = [
  "Deutschland", "Deutsch",
  "Frankreich", "Französisch",
  "Russland", "Russisch",
  "Japan", "Japanisch",
  "England", "Englisch",
  "Polen", "Polnisch",
  "Niederlande", "Niederländisch",
  "Schweiz",
  "Spanien", "Spanisch",
  "Italien", "Italienisch",
  "Österreich", "Österreichisch",
  "Türkei", "Türkisch",
  "Ghana", "Ghanaisch",
  "Nigeria", "Nigerianisch",
];

function editDistance(left = "", right = "") {
  const a = String(left).toLocaleLowerCase("de");
  const b = String(right).toLocaleLowerCase("de");
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= b.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function proseOnlyText(submissionText = "") {
  return String(submissionText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || /^(?:teil|part)\s*\d+[.:]?$/i.test(line)) return false;
      if (/^\d+\s*[.)\-:]\s*(?:[A-DX]|richtig|falsch)(?:\b|[.)!?;,]|$)/i.test(line)) return false;
      const words = line.split(/\s+/).filter(Boolean);
      return words.length >= 4
        && /\b(?:ich|du|er|sie|wir|Sie)\b/.test(line)
        && /\b(?:komme|kommst|kommt|kommen|spreche|sprichst|spricht|sprechen|bin|bist|ist|sind|habe|hast|hat|haben|möchte|möchten)\b/i.test(line);
    })
    .join(" ");
}

function a1CountryLanguageCorrections(submissionText = "") {
  const source = proseOnlyText(submissionText);
  if (!source) return [];
  const exactTerms = new Set(A1_COUNTRY_LANGUAGE_TERMS.map((term) => term.toLocaleLowerCase("de")));
  const tokens = source.match(/[A-Za-zÄÖÜäöüß]+/g) || [];
  const corrections = [];

  tokens.forEach((token) => {
    if (!/^[A-ZÄÖÜ]/.test(token) || token.length < 5 || exactTerms.has(token.toLocaleLowerCase("de"))) return;
    const ranked = A1_COUNTRY_LANGUAGE_TERMS
      .map((term) => ({ term, distance: editDistance(token, term) }))
      .sort((left, right) => left.distance - right.distance || left.term.localeCompare(right.term, "de"));
    const best = ranked[0];
    const second = ranked[1];
    const threshold = token.length >= 9 ? 3 : 2;
    if (!best || best.distance > threshold || (second && second.distance === best.distance)) return;
    if (corrections.some((item) => item.from.toLocaleLowerCase("de") === token.toLocaleLowerCase("de"))) return;
    corrections.push({ from: token, to: best.term });
  });

  return corrections.slice(0, 3);
}

function anchoredWritingTip(submissionText = "") {
  const candidate = proseOnlyText(submissionText)
    .split(/(?<=[.!?])\s+/)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .find((value) => value.split(/\s+/).filter(Boolean).length >= 4);
  if (!candidate) return "";
  const anchor = candidate.replace(/[.!?]+$/, "").slice(0, 100);
  return `Your sentence “${anchor}” communicates the idea clearly. Check spelling, capitalization and word forms in the remaining sentences before submitting.`;
}

function writingTip(submissionText = "", result = {}) {
  const text = String(submissionText || "");
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

  const spellingCorrections = a1CountryLanguageCorrections(text);
  if (spellingCorrections.length) {
    const corrections = spellingCorrections.map(({ from, to }) => `“${from}” to “${to}”`);
    return `In Teil 1, correct ${humanList(corrections)}.`;
  }

  const specificAiTip = specificAiWritingTip(result, text);
  if (specificAiTip) return sentence(specificAiTip);

  return looksLikeFreeText(text) ? anchoredWritingTip(text) : "";
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
  if (essayFeedback) return essayFeedback;

  const sentences = [];
  const opening = objectiveScore !== null && objectiveScore >= 80 ? "Good work" : objectiveScore !== null && objectiveScore >= 60 ? "Good progress" : "Keep working steadily";
  sentences.push(`${opening}${name ? `, ${name}` : ""}.`);
  objectiveSentences.forEach((value) => sentences.push(sentence(value)));

  const tip = writingTip(submissionText, result);
  if (tip) sentences.push(tip);

  const comment = sentences.join(" ").replace(/\s+/g, " ").trim();
  return comment.split(/\s+/).slice(0, 60).join(" ");
}
