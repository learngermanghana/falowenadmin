import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) throw new Error(`${label} anchor changed; update patchGroundedWritingFeedback.mjs`);
  return source.replace(search, replacement);
}

const target = new URL("../src/utils/essayFeedbackEvidence.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

source = replaceOnce(
  source,
  `function genericWritingSentence(value = "") {\n  return /^(?:the main purpose of your message is understandable|check verb position, articles and every task point before submitting|your message uses an appropriate greeting and closing|your free-text response is clear)/i.test(String(value || "").trim());\n}\n`,
  `function genericWritingSentence(value = "") {\n  return /^(?:the main purpose of your message is understandable|check verb position, articles and every task point before submitting|your message uses an appropriate greeting and closing|your free-text response is clear)/i.test(String(value || "").trim());\n}\n\nfunction quotedFeedbackPhrases(value = "") {\n  return [...String(value || "").matchAll(/[“\"]([^”\"]{2,90})[”\"]|[‘']([^’']{2,90})[’']/g)]\n    .map((match) => String(match[1] || match[2] || "").trim())\n    .filter(Boolean);\n}\n\nfunction isCorrectiveWritingClaim(value = "") {\n  return /\\b(?:write|use|replace|correct|revise|avoid|change|fix|article|articles|grammar|word order|spelling|instead of|rather than)\\b/i.test(String(value || ""));\n}\n\nfunction submissionContainsExactPhrase(submission = "", phrase = "") {\n  const source = String(submission || "").toLocaleLowerCase("de");\n  const needle = String(phrase || "").trim().toLocaleLowerCase("de");\n  if (!needle) return false;\n  if (!/^[\\p{L}\\p{N}]+$/u.test(needle)) return source.includes(needle);\n  const escaped = needle.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, "\\\\$&");\n  return new RegExp("(?:^|[^\\\\p{L}\\\\p{N}])" + escaped + "(?:$|[^\\\\p{L}\\\\p{N}])", "iu").test(source);\n}\n\nfunction isGroundedCorrectiveFeedback(value = "", submission = "") {\n  const feedback = String(value || "").trim();\n  if (!feedback || !isCorrectiveWritingClaim(feedback)) return Boolean(feedback);\n  const quoted = quotedFeedbackPhrases(feedback);\n  if (!quoted.length) return false;\n  return quoted.some((quote) => submissionContainsExactPhrase(submission, quote));\n}\n`,
  "grounding helpers",
);

source = replaceOnce(
  source,
  `    const correctionIsAnchored = kind !== "next"\n      || quoted.length === 0\n      || quoted.some((quote) => normalizedSubmission.includes(quote.toLocaleLowerCase("de")));`,
  `    const correctionIsAnchored = kind !== "next"\n      || !isCorrectiveWritingClaim(value)\n      || (quoted.length > 0 && quoted.some((quote) => submissionContainsExactPhrase(submission, quote)));`,
  "AI prose grounding",
);

source = replaceOnce(
  source,
  `  const structured = first(result.nextStep, result.improvementTarget, result.writingNextStep, result.writing?.nextStep, result.ai?.nextStep, result.rubric?.nextStep);\n  if (structured) return structured;`,
  `  const structured = first(result.nextStep, result.improvementTarget, result.writingNextStep, result.writing?.nextStep, result.ai?.nextStep, result.rubric?.nextStep);\n  if (structured && isGroundedCorrectiveFeedback(structured, submission)) return structured;`,
  "structured next-step grounding",
);

fs.writeFileSync(target, source);
console.log("Corrective writing feedback now requires an exact quoted phrase from the student submission.");
