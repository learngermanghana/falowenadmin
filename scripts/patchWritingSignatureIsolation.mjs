import fs from "node:fs";

const target = new URL("../src/utils/autoMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const helperMarker = "function writingEditDistance";
if (!source.includes(helperMarker)) {
  const signoffAnchor = 'function isWritingSignoffLine(value = "") {';
  if (!source.includes(signoffAnchor)) {
    throw new Error("writing sign-off helper location changed; update patchWritingSignatureIsolation.mjs");
  }

  const helpers = `function writingEditDistance(left = "", right = "") {
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
  if (words[0] === "mit" && hasFriendlyWord && hasGreetingWord) return true;

  return false;
}

function writingBodyBeforeSignoff(text = "") {
  const lines = String(text || "").split(/\\r?\\n/);
  const closingIndex = lines.findIndex((line) => isWritingClosingPhrase(line));
  return (closingIndex >= 0 ? lines.slice(0, closingIndex) : lines).join("\\n").trim();
}`;

  source = source.replace(signoffAnchor, `${helpers}\n\n${signoffAnchor}`);
}

if (!source.includes("const bodyText = writingBodyBeforeSignoff(text);")) {
  const expansionPattern = /function findWritingExpansionTarget\(text = ""\) \{[\s\S]*?\n\}/;
  if (!expansionPattern.test(source)) {
    throw new Error("writing expansion target location changed; update patchWritingSignatureIsolation.mjs");
  }
  source = source.replace(expansionPattern, `function findWritingExpansionTarget(text = "") {
  const bodyText = writingBodyBeforeSignoff(text);
  const sentences = extractWritingSentences(bodyText);
  const candidates = sentences.filter((sentence) => !isWritingSignoffLine(sentence));
  if (!candidates.length) return sentences[sentences.length - 1] || bodyText || text;

  return candidates[candidates.length - 1];
}`);
}

if (!source.includes('const sourceText = writingBodyBeforeSignoff(text);')) {
  const issueSourcePattern = /(function findWritingIssues\(text = ""\) \{\s*\n\s*const issues = \[\];\s*\n\s*)const sourceText = [^;]+;/;
  if (!issueSourcePattern.test(source)) {
    throw new Error("writing issue source location changed; update patchWritingSignatureIsolation.mjs");
  }
  source = source.replace(issueSourcePattern, '$1const sourceText = writingBodyBeforeSignoff(text);');
}

fs.writeFileSync(target, source);
console.log("Writing feedback now treats lines after a recognised sign-off as signature text without truncating normal body sentences.");

await import("./patchB1GroundedFeedback.mjs");
