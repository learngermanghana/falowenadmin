import fs from "node:fs";

const target = new URL("../src/utils/essayFeedbackEvidence.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

function replaceOnce(input, before, after, label) {
  if (input.includes(after)) return input;
  if (!input.includes(before)) throw new Error(`${label} anchor changed; update patchSpecificWritingFeedback.mjs`);
  return input.replace(before, after);
}

const helperAnchor = `function strengthOf(result, submission, level, seed, history) {`;
const helpers = `function rawFeedbackSentences(result = {}) {
  const sources = list(
    result.aiDetailedFeedback,
    result.aiOriginalFeedback,
    result.ai?.detailedFeedback,
    result.ai?.originalFeedback,
    result.improvementSummary,
    result.feedback,
  );
  return [...new Set(sources.flatMap((value) => String(value || "")
    .replace(/\\s+/g, " ")
    .split(/(?<=[.!?])\\s+/)
    .map((item) => item.trim())
    .filter(Boolean)))];
}

function genericWritingSentence(value = "") {
  return /^(?:the main purpose of your message is understandable|check verb position, articles and every task point before submitting|your message uses an appropriate greeting and closing|your free-text response is clear)/i.test(String(value || "").trim());
}

function objectiveFeedbackSentence(value = "") {
  return /\\b(?:objective|questions?\\s+\\d+|answers?\\s+(?:are|is)|teil\\s*[34]|score|correct answers?)\\b/i.test(String(value || ""));
}

function specificAiWritingSentence(result = {}, kind = "strength") {
  const cue = kind === "next"
    ? /\\b(?:write|use|replace|correct|revise|avoid|add|change|improve|practise|practice|punctuation|wording|instead of)\\b/i
    : /\\b(?:clear|organis|appropriate|formal|asks?|mentions?|includes?|explains?|specific|well structured|easy to follow)\\b/i;
  return rawFeedbackSentences(result).find((value) => {
    const wordCount = value.split(/\\s+/).filter(Boolean).length;
    return wordCount >= 5
      && wordCount <= 45
      && !genericWritingSentence(value)
      && !objectiveFeedbackSentence(value)
      && cue.test(value);
  }) || "";
}

function writingSectionText(submission = "") {
  let source = String(submission || "").trim();
  const laterPart = source.search(/(?:^|\\n)\\s*(?:teil\\s*[34]|lesen|reading|h[oö]ren|hoeren|listening)\\b/i);
  if (laterPart >= 0) source = source.slice(0, laterPart);
  return source.replace(/^\\s*teil\\s*2\\b[.:]?\\s*/i, "").trim();
}

function writingSentenceCandidates(submission = "") {
  return writingSectionText(submission)
    .split(/(?<=[.!?])\\s+|\\n+/)
    .map((value) => value.replace(/\\s+/g, " ").trim())
    .filter((value) => {
      const words = value.split(/\\s+/).filter(Boolean).length;
      return words >= 5
        && words <= 24
        && !/^(?:sehr geehrte|hallo|liebe?r?|mit freundlichen grüßen|viele grüße|liebe grüße)/i.test(value);
    });
}

function writingAnchor(submission = "") {
  const ranked = writingSentenceCandidates(submission).map((value, index) => {
    let score = -index;
    if (/\\b(?:weil|möchte|interessiere|bitte|können|informationen|seminar)\\b/i.test(value)) score += 8;
    if (/[?]$/.test(value)) score += 3;
    return { value, score };
  }).sort((left, right) => right.score - left.score);
  const value = ranked[0]?.value || "";
  return value.length > 120 ? `${value.slice(0, 117).trim()}…` : value;
}

function submissionAnchoredStrength(submission = "") {
  const source = writingSectionText(submission);
  if (/informationen[^.!?]{0,40}inhalt[^.!?]{0,40}termine[^.!?]{0,40}kosten/i.test(source)) {
    return "Your request clearly asks about the seminar content, dates and costs";
  }
  const anchor = writingAnchor(submission);
  return anchor ? `Your sentence “${anchor.replace(/[.!?]+$/, "")}” clearly communicates the purpose of the message` : "";
}

function submissionAnchoredNextStep(submission = "") {
  const source = writingSectionText(submission);
  if ((source.match(/\\bich freue mich\\b/gi) || []).length >= 2) {
    return "Avoid repeating “Ich freue mich”; vary one occurrence with a different expression";
  }
  if (/informationen\\s+über\\s+den\\s+inhalt/i.test(source)) {
    return "Use “Informationen zu dem Inhalt, den Terminen und den Kosten” instead of “Informationen über den Inhalt, die Termine und die Kosten” for a more natural request";
  }
  if (/rückmeldung\\s*(?:\\n|$)\\s*mit freundlichen grüßen/i.test(source)) {
    return "Add a full stop after “Rückmeldung” before the closing";
  }
  const anchor = writingAnchor(submission);
  return anchor ? `Reread “${anchor.replace(/[.!?]+$/, "")}” and improve one wording choice before submitting` : "";
}

${helperAnchor}`;

if (!source.includes("function rawFeedbackSentences(result = {})")) {
  source = replaceOnce(source, helperAnchor, helpers, "specific feedback helpers");
}

source = replaceOnce(
  source,
  `  if (structured) return structured;\n  const source = String(submission || "");`,
  `  if (structured) return structured;\n  const aiSpecific = specificAiWritingSentence(result, "strength");\n  if (aiSpecific) return aiSpecific;\n  const anchored = submissionAnchoredStrength(submission);\n  if (anchored) return anchored;\n  const source = String(submission || "");`,
  "strength evidence priority",
);

source = source.replace('    choices.push("The main purpose of your message is understandable");\n', "");

source = replaceOnce(
  source,
  `  if (structured) return structured;\n  const source = String(submission || "");\n  const choices = [];\n  if (level === "A2") {`,
  `  if (structured) return structured;\n  const aiSpecific = specificAiWritingSentence(result, "next");\n  if (aiSpecific) return aiSpecific;\n  const anchored = submissionAnchoredNextStep(submission);\n  if (anchored) return anchored;\n  const source = String(submission || "");\n  const choices = [];\n  if (level === "A2") {`,
  "next-step evidence priority",
);

source = source.replace('    choices.push(correction ? "Reread the corrected sentence and check verb position and articles" : "Check verb position, articles and every task point before submitting");\n', "");

fs.writeFileSync(target, source);
console.log("Specific OpenAI or submission-anchored writing evidence now replaces generic fallback sentences.");
