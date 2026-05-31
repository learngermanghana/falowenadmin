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
  const combined = {};

  for (const key of Object.keys(ref)) {
    const numKey = Number(key);
    if (choiceAns[numKey]) {
      combined[key] = choiceAns[numKey];
    } else {
      combined[key] = vocabValues[numKey - 6] ?? "";
    }
  }

  return compareAnswers(ref, combined);
}
