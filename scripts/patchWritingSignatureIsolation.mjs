import fs from "node:fs";

const target = new URL("../src/utils/autoMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

function replaceOnce(input, before, after, label) {
  if (input.includes(after)) return input;
  if (!input.includes(before)) throw new Error(`${label} anchor changed; update patchWritingSignatureIsolation.mjs`);
  return input.replace(before, after);
}

const signoffBefore = `function isWritingSignoffLine(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) return true;

  const normalizedCompare = normalizeForCompare(normalized);
  if (/^(viele|liebe|herzliche|beste) (grusse|gruesse|grusse,|gruesse,)|^(mit freundlichen|freundliche) (grussen|gruessen)/i.test(normalizedCompare)) return true;
  if (/^(regards|best wishes|kind regards|sincerely|yours sincerely|thank you)$/i.test(normalized)) return true;
  if (/^ich freue mich (?:im voraus )?auf deine antwort/i.test(normalizedCompare)) return true;

  const words = normalized.replace(/[.,!?;:]+$/g, "").split(/\\s+/).filter(Boolean);
  const hasSentencePunctuation = /[.!?]$/.test(normalized);
  const hasVerbLikeWord = /\\b(?:ist|bin|bist|sind|seid|war|hat|habe|hast|haben|geht|gehe|gehen|macht|machen|finde|denke|mochte|möchte|kann|können|werde|wird|schreibe|freue|hoffe|mag|liebe|bevorzuge|schmeckt)\\b/i.test(normalized);

  return words.length <= 2 && !hasSentencePunctuation && !hasVerbLikeWord;
}`;

const signoffAfter = `function writingEditDistance(left = "", right = "") {
  const a = String(left || "");
  const b = String(right || "");
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= b.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function fuzzyWritingWord(value = "", candidates = [], maximumDistance = 3) {
  const normalized = normalizeForCompare(value).replace(/\\s+/g, "");
  if (!normalized) return false;
  return candidates.some((candidate) => {
    const expected = normalizeForCompare(candidate).replace(/\\s+/g, "");
    return normalized === expected || writingEditDistance(normalized, expected) <= maximumDistance;
  });
}

function isWritingClosingPhrase(value = "") {
  const normalized = normalizeForCompare(value);
  if (!normalized) return false;
  if (/^(regards|best wishes|kind regards|sincerely|yours sincerely|thank you|bis bald|tschuss|auf wiedersehen)$/i.test(normalized)) return true;

  const words = normalized.split(/\\s+/).filter(Boolean);
  const hasGreetingLead = ["viele", "liebe", "herzliche", "beste"].includes(words[0]);
  const hasGreetingWord = words.some((word) => fuzzyWritingWord(word, ["grusse", "gruesse", "gruben", "grube"], 5));
  if (hasGreetingLead && hasGreetingWord) return true;

  const hasFriendlyWord = words.some((word) => fuzzyWritingWord(word, ["freundlich", "freundliche", "freundlichen"], 5));
  if ((words[0] === "mit" || hasFriendlyWord) && hasFriendlyWord && hasGreetingWord) return true;

  return false;
}

function writingBodyBeforeSignoff(text = "") {
  const lines = String(text || "").split(/\\r?\\n/);
  const closingIndex = lines.findIndex((line) => isWritingClosingPhrase(line));
  return (closingIndex >= 0 ? lines.slice(0, closingIndex) : lines).join("\\n").trim();
}

function isWritingSignoffLine(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) return true;

  const normalizedCompare = normalizeForCompare(normalized);
  if (isWritingClosingPhrase(normalized)) return true;
  if (/^ich freue mich (?:im voraus )?auf deine antwort/i.test(normalizedCompare)) return true;

  const words = normalized.replace(/[.,!?;:]+$/g, "").split(/\\s+/).filter(Boolean);
  const hasSentencePunctuation = /[.!?]$/.test(normalized);
  const hasVerbLikeWord = /\\b(?:ist|bin|bist|sind|seid|war|hat|habe|hast|haben|geht|gehe|gehen|macht|machen|finde|denke|mochte|möchte|kann|können|werde|wird|schreibe|freue|hoffe|mag|liebe|bevorzuge|schmeckt)\\b/i.test(normalized);

  return words.length <= 2 && !hasSentencePunctuation && !hasVerbLikeWord;
}`;

source = replaceOnce(source, signoffBefore, signoffAfter, "writing sign-off helpers");

const expansionBefore = `function findWritingExpansionTarget(text = "") {
  const sentences = extractWritingSentences(text);
  const candidates = sentences.filter((sentence) => !isWritingSignoffLine(sentence));
  if (!candidates.length) return sentences[sentences.length - 1] || text;

  return candidates[candidates.length - 1];
}`;

const expansionAfter = `function findWritingExpansionTarget(text = "") {
  const bodyText = writingBodyBeforeSignoff(text);
  const sentences = extractWritingSentences(bodyText);
  const candidates = sentences.filter((sentence) => !isWritingSignoffLine(sentence));
  if (!candidates.length) return sentences[sentences.length - 1] || bodyText || text;

  return candidates[candidates.length - 1];
}`;

source = replaceOnce(source, expansionBefore, expansionAfter, "writing expansion target");

source = replaceOnce(
  source,
  `function findWritingIssues(text = "") {
  const issues = [];
  const sourceText = String(text || "");`,
  `function findWritingIssues(text = "") {
  const issues = [];
  const sourceText = writingBodyBeforeSignoff(text);`,
  "writing issue source",
);

fs.writeFileSync(target, source);
console.log("Writing feedback now treats every line after a recognised German sign-off as signature or name text.");
