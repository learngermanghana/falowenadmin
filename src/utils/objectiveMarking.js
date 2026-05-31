export function normalizeAnswer(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Extract MCQ answers like "1. A", "2 B Anzeige B", or "9 . B Option B".
export function extractChoiceAnswers(text = "") {
  const answers = {};
  const regex = /(?:frage\s*)?(\d+)\s*\.?\s*(?:anzeige\s*)?([a-d])\b/gi;
  let match;
  while ((match = regex.exec(String(text)))) {
    const index = Number(match[1]);
    if (Number.isFinite(index)) {
      answers[index] = match[2].toUpperCase();
    }
  }
  return answers;
}

// Extract vocabulary answers like "Head – Kopf" or "Head: Kopf".
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

function splitSubmissionIntoSections(text = "") {
  const sections = [];
  const source = String(text || "");
  const markerRegex = /(?:^|\n)\s*(teil|part)\s*(\d+)\s*[:;]?\s*/gi;
  const markers = [];
  let match;

  while ((match = markerRegex.exec(source))) {
    markers.push({
      index: match.index,
      end: markerRegex.lastIndex,
      partNumber: Number(match[2]),
    });
  }

  if (!markers.length) {
    return [{ partNumber: null, text: source }];
  }

  markers.forEach((marker, index) => {
    const next = markers[index + 1];
    sections.push({
      partNumber: marker.partNumber,
      text: source.slice(marker.end, next ? next.index : source.length),
    });
  });

  return sections;
}

// Extract numbered German-only vocabulary answers like:
// Teil 3:
// 1. Kopf
// 2. Arm
// 8 Hand
// This is common when the reference is Head – Kopf but the student writes only the German answers.
export function extractNumberedVocabularyAnswers(text = "", preferredPartNumber = 3) {
  const sections = splitSubmissionIntoSections(text);
  const preferredSections = [
    ...sections.filter((section) => section.partNumber === preferredPartNumber),
    ...sections.filter((section) => section.partNumber !== preferredPartNumber && section.partNumber !== 2),
  ];

  for (const section of preferredSections) {
    const answers = [];
    for (const rawLine of String(section.text || "").split(/\r?\n/)) {
      const match = rawLine.trim().match(/^\s*(\d{1,2})\s*[).:-]?\s*([A-Za-zÄÖÜäöüß]+(?:\s*\/\s*[A-Za-zÄÖÜäöüß]+)?)\s*$/i);
      if (!match) continue;

      const answer = match[2].trim();
      const normalized = normalizeAnswer(answer);
      if (!normalized || /^[a-d]$/.test(normalized)) continue;

      answers.push({ number: Number(match[1]), answer: normalized });
    }

    if (answers.length) {
      return answers
        .sort((a, b) => a.number - b.number)
        .map((item) => item.answer);
    }
  }

  return [];
}

// Compare student answers to reference answers. Returns
// { correctCount, totalCount, details } where details maps each question index to
// { student: string, expected: string, correct: boolean }.
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

  return {
    correctCount,
    totalCount: keys.length,
    details,
  };
}

// Determine assignment reference answers for supported assignments.
// Extend this mapping as new assignments are added.
export function getReferenceAnswers(assignmentId) {
  const normalizedAssignmentId = String(assignmentId || "").trim().toUpperCase().replace(/_/g, ".");

  switch (normalizedAssignmentId) {
    case "A1-14.1":
      // Reference answers for A1-14.1 (general health/doctor vocabulary and Anzeige questions).
      return {
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
      };
    default:
      return null;
  }
}

// High-level function to compute objective score given the assignment ID and submission text.
export function computeObjectiveScore(assignmentId, submissionText) {
  const ref = getReferenceAnswers(assignmentId);
  if (!ref) {
    return { correctCount: 0, totalCount: 0, details: {} };
  }

  const choiceAns = extractChoiceAnswers(submissionText);
  const vocabAns = extractVocabularyAnswers(submissionText);
  const vocabValues = Object.values(vocabAns);
  const numberedVocabularyValues = extractNumberedVocabularyAnswers(submissionText);
  const combined = {};

  for (const key of Object.keys(ref)) {
    const numKey = Number(key);
    if (choiceAns[numKey]) {
      combined[key] = choiceAns[numKey];
    } else {
      const vocabularyIndex = numKey - 6;
      combined[key] = vocabValues[vocabularyIndex] ?? numberedVocabularyValues[vocabularyIndex] ?? "";
    }
  }

  return compareAnswers(ref, combined);
}
