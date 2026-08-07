import * as base from "./autoMarkingBase.js";

export * from "./autoMarkingBase.js";

const VOCABULARY_WORDS = "head|arm|leg|eye|nose|ear|mouth|hand|foot|stomach|belly";
const VOCABULARY_EQUALS_LINE = new RegExp(
  `^(\\s*[a-j]\\s*[.)]\\s*(?:${VOCABULARY_WORDS})(?:\\s*\\/\\s*(?:${VOCABULARY_WORDS}))?\\s*)=\\s*(?:(?:der|die|das)\\s+)?([A-Za-zÄÖÜäöüß]+)\\s*$`,
  "i",
);

function normalizeVocabularyEqualsAnswers(text = "") {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(VOCABULARY_EQUALS_LINE);
      if (!match) return line;
      return `${match[1]} – ${match[2]}`;
    })
    .join("\n");
}

export function checkDeterministicObjectiveAnswers(args = {}) {
  return base.checkDeterministicObjectiveAnswers({
    ...args,
    submissionText: normalizeVocabularyEqualsAnswers(args.submissionText),
  });
}
