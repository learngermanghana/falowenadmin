// Feedback-only language checks. These never change deterministic objective correctness
// or the writing score; only a tutor can decide whether an error merits a deduction.
const A1_HOBBY_FORMS = [
  { concept: /\blesen\b/i, wrong: /\bich\s+(liese)\b/gi, corrected: "lese", reason: "Spelling: use the first-person form of lesen." },
  { concept: /\bkochen\b/i, wrong: /\bich\s+(Koche)\b/g, corrected: "koche", reason: "German verbs are lowercase within a sentence." },
  { concept: /\breisen\b/i, wrong: /\bich\s+(Reise)\b/g, corrected: "reise", reason: "German verbs are lowercase within a sentence." },
  { concept: /\bfahren\b/i, wrong: /\bich\s+(Fahre)\b/g, corrected: "fahre", reason: "German verbs are lowercase within a sentence." },
  { concept: /\bwandern\b/i, wrong: /\bich\s+(Wandere)\b/g, corrected: "wandere", reason: "German verbs are lowercase within a sentence." },
];

function originalMatches(source, pattern) {
  return [...String(source || "").matchAll(pattern)].map((match) => match[1]).filter(Boolean);
}

export function objectiveLanguageCorrections(objective = {}, { level = "" } = {}) {
  if (String(level).toUpperCase() !== "A1") return [];
  const found = [];
  for (const [question, row] of Object.entries(objective.details || {})) {
    if (row?.correct !== true || typeof row.student !== "string") continue;
    const expected = String(row.expectedDisplay || row.expected || row.rawExpected || "");
    for (const rule of A1_HOBBY_FORMS) {
      if (!rule.concept.test(expected)) continue;
      for (const from of originalMatches(row.student, rule.wrong)) {
        if (found.some((item) => item.question === question && item.from === from)) continue;
        found.push({ question, partId: row.partId || question.split(".")[0], from, to: rule.corrected, reason: rule.reason });
      }
    }
  }
  return found;
}

const A1_FAMILY_PATTERNS = [
  { pattern: /\b(Mein Mutter)\b/gi, to: "Meine Mutter", reason: "Mutter is feminine; use meine." },
  { pattern: /\b(zwei Bruder)\b/gi, to: "zwei Brüder", reason: "Use the plural Brüder." },
  { pattern: /\b(\d+|zwanzig|dreißig|sechzig|siebzig)\s+(Jahr alt)\b/gi, to: null, reason: "Use Jahre alt for ages." },
  { pattern: /\b(er spiele)\b/gi, to: "er spielt", reason: "Use the third-person ending -t." },
  { pattern: /\b(Der zweiter Bruder)\b/gi, to: "Der zweite Bruder", reason: "Use the weak adjective ending after der." },
];

function declaredA1WritingSection(submission = "") {
  const source = String(submission || "");
  // Only inspect the explicit writing part. Never mine objective responses for
  // writing corrections when a mixed submission has numbered answers.
  const match = source.match(/(?:^|\n)\s*teil\s*2\b[^\n]*\n([\s\S]*?)(?=\n\s*teil\s*[134]\b|$)/i);
  return match?.[1] || "";
}

export function groundedA1WritingCorrections(submission = "", { level = "" } = {}) {
  if (String(level).toUpperCase() !== "A1") return [];
  const source = declaredA1WritingSection(submission);
  if (!source) return [];
  const corrections = [];
  for (const rule of A1_FAMILY_PATTERNS) {
    for (const match of source.matchAll(rule.pattern)) {
      const from = match[1] ? (match[2] ? match[0] : match[1]) : "";
      const to = rule.to || from.replace(/\bJahr alt\b/i, "Jahre alt");
      if (from && to !== from && !corrections.some((item) => item.from.toLowerCase() === from.toLowerCase())) {
        corrections.push({ from, to, reason: rule.reason, partId: "teil2", source: "grounded_language_check" });
      }
    }
  }
  return corrections;
}

export function languageFeedbackSentence(correction, { objective = false } = {}) {
  const location = objective
    ? `${String(correction.partId || "Objective").replace(/^teil\s*(\d+)/i, "Teil $1")} question ${String(correction.question).split(".").at(-1)}`
    : "In your writing";
  return `${location}, write “${correction.to}” instead of “${correction.from}” (${correction.reason})`;
}
