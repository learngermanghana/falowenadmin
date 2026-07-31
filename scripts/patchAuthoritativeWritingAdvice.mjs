import fs from "node:fs";

const target = new URL("../src/utils/essayFeedbackEvidence.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

function replaceOnce(before, after, label) {
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`${label} anchor changed; update patchAuthoritativeWritingAdvice.mjs`);
  source = source.replace(before, after);
}

const helperAnchor = 'function strengthOf(result, submission, level, seed, history) {';
const helper = `function safeStructuredWritingSentence(values = [], kind = "strength", submission = "") {
  const normalizedSubmission = String(submission || "").toLocaleLowerCase("de");
  return list(values).find((value) => {
    const wordCount = String(value || "").split(/\\s+/).filter(Boolean).length;
    const quoted = [...String(value || "").matchAll(/[“\"]([^”\"]{3,90})[”\"]|[‘']([^’']{3,90})[’']/g)]
      .map((match) => match[1] || match[2])
      .filter(Boolean);
    const correctionIsAnchored = kind !== "next"
      || quoted.length === 0
      || quoted.some((quote) => normalizedSubmission.includes(quote.toLocaleLowerCase("de")));
    return wordCount >= 3
      && wordCount <= 45
      && !genericWritingSentence(value)
      && !objectiveFeedbackSentence(value)
      && correctionIsAnchored;
  }) || "";
}

${helperAnchor}`;
if (!source.includes("function safeStructuredWritingSentence(")) {
  replaceOnce(helperAnchor, helper, "structured writing sentence filter");
}

replaceOnce(
  `function strengthOf(result, submission, level, seed, history) {
  const structured = first(result.writingStrengths, result.strengths, result.writing?.strengths, result.ai?.writingStrengths, result.ai?.strengths, result.rubric?.strengths);
  if (structured) return structured;`,
  `function strengthOf(result, submission, level, seed, history) {
  const structured = safeStructuredWritingSentence([
    result.writingStrengths,
    result.strengths,
    result.writing?.strengths,
    result.ai?.writingStrengths,
    result.ai?.strengths,
    result.rubric?.strengths,
  ], "strength", submission);
  if (structured) return structured;`,
  "structured writing strength filter",
);

replaceOnce(
  `function nextStepOf(result, submission, level, correction, seed, history) {
  const structured = first(result.nextStep, result.improvementTarget, result.writingNextStep, result.writing?.nextStep, result.ai?.nextStep, result.rubric?.nextStep);
  if (structured) return structured;`,
  `function nextStepOf(result, submission, level, correction, seed, history) {
  const structured = safeStructuredWritingSentence([
    result.nextStep,
    result.improvementTarget,
    result.writingNextStep,
    result.writing?.nextStep,
    result.ai?.nextStep,
    result.rubric?.nextStep,
  ], "next", submission);
  if (structured) return structured;`,
  "structured writing next-step filter",
);

replaceOnce(
  `  if (first(
    result.writingStrengths,
    result.strengths,
    result.writing?.strengths,
    result.ai?.writingStrengths,
    result.ai?.strengths,
    result.rubric?.strengths,
  )) return true;
  return Boolean(first(
    result.nextStep,
    result.improvementTarget,
    result.writingNextStep,
    result.writing?.nextStep,
    result.ai?.nextStep,
    result.rubric?.nextStep,
  ));`,
  `  if (safeStructuredWritingSentence([
    result.writingStrengths,
    result.strengths,
    result.writing?.strengths,
    result.ai?.writingStrengths,
    result.ai?.strengths,
    result.rubric?.strengths,
  ], "strength", submission)) return true;
  return Boolean(safeStructuredWritingSentence([
    result.nextStep,
    result.improvementTarget,
    result.writingNextStep,
    result.writing?.nextStep,
    result.ai?.nextStep,
    result.rubric?.nextStep,
  ], "next", submission));`,
  "meaningful structured writing evidence filter",
);

fs.writeFileSync(target, source);
console.log("Structured writing advice now rejects stale objective claims and falls back to submission-anchored evidence.");
