import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) throw new Error(`${label} anchor changed; update patchStructuredWritingEvidence.mjs`);
  return source.replace(search, replacement);
}

const functionTarget = new URL("../functions/index.js", import.meta.url);
let functionSource = fs.readFileSync(functionTarget, "utf8");

functionSource = replaceOnce(
  functionSource,
  `    writingScore: result.writingScore ?? null,\n    finalScore,\n    feedback,\n    corrections: Array.isArray(result.corrections) ? result.corrections : [],`,
  `    writingScore: result.writingScore ?? null,\n    writingScorePercent: result.writingScorePercent ?? result.writingScore ?? null,\n    maxWritingScore: result.maxWritingScore ?? null,\n    writingStrengths: Array.isArray(result.writingStrengths)\n      ? result.writingStrengths\n      : result.writingStrengths ? [String(result.writingStrengths)] : [],\n    taskCompletion: result.taskCompletion && typeof result.taskCompletion === "object" ? result.taskCompletion : null,\n    missingTaskPoints: Array.isArray(result.missingTaskPoints) ? result.missingTaskPoints : [],\n    nextStep: String(result.nextStep || result.writingNextStep || result.improvementTarget || "").trim(),\n    writingNextStep: String(result.writingNextStep || result.nextStep || result.improvementTarget || "").trim(),\n    writing: result.writing && typeof result.writing === "object" ? result.writing : null,\n    rubric: result.rubric && typeof result.rubric === "object" ? result.rubric : null,\n    finalScore,\n    feedback,\n    corrections: Array.isArray(result.corrections) ? result.corrections : [],`,
  "Firebase AI result normalizer",
);

functionSource = replaceOnce(
  functionSource,
  `    "For writing, assess task completion, CEFR-appropriate grammar, word order, vocabulary, spelling, structure, and clarity. When writing needs work, explain a genuine strength, give two or three concrete corrections that quote the student’s exact short wording and show improved wording, briefly explain the most useful language rule, and include one task-relevant next step. When writing is perfect, do not invent corrections; praise specific strengths and give an extension goal instead. Avoid generic writing comments.",`,
  `    "For writing, assess task completion, CEFR-appropriate grammar, word order, vocabulary, spelling, structure, and clarity. Return writingStrengths as one or two short evidence-based strengths that quote or name exact details from the student's text. Return taskCompletion as an object with completed, total, and missing. Return corrections as one or two objects with from, to, reason, and partId 'teil2'; use an empty array when there is no genuine correction. Return nextStep as one specific task-relevant improvement or extension goal. Never invent a correction merely to fill a field, and avoid generic writing comments.",`,
  "Firebase writing evidence prompt",
);

functionSource = replaceOnce(
  functionSource,
  `    \`Return JSON only. The feedback field must be \${AI_FEEDBACK_MIN_WORDS} to \${AI_FEEDBACK_MAX_WORDS} words, plain text only, with no Markdown, bold markers, or asterisks. Use the available space for specific, actionable guidance rather than filler. Include score/finalScore 0-100, status marked or needs_review, confidence 0-1, detectedParts, parts, objective totals, writingScore, corrections, and improvementSummary.\`,`,
  `    \`Return JSON only. The feedback field must be \${AI_FEEDBACK_MIN_WORDS} to \${AI_FEEDBACK_MAX_WORDS} words, plain text only, with no Markdown, bold markers, or asterisks. Use the available space for specific, actionable guidance rather than filler. Include score/finalScore 0-100, status marked or needs_review, confidence 0-1, detectedParts, parts, objective totals, writingScore, writingScorePercent, writingStrengths, taskCompletion, missingTaskPoints, corrections, nextStep, and improvementSummary.\`,`,
  "Firebase JSON field prompt",
);

fs.writeFileSync(functionTarget, functionSource);

const clientTarget = new URL("../src/services/markingServiceBase.js", import.meta.url);
let clientSource = fs.readFileSync(clientTarget, "utf8");

clientSource = replaceOnce(
  clientSource,
  `    writingScore: result.writingScore ?? null,\n    writingScorePercent: result.writingScorePercent ?? null,\n    maxWritingScore: result.maxWritingScore ?? null,\n    scoreBreakdown: Array.isArray(result.scoreBreakdown) ? result.scoreBreakdown : [],\n    corrections: Array.isArray(result.corrections) ? result.corrections : [],`,
  `    writingScore: result.writingScore ?? null,\n    writingScorePercent: result.writingScorePercent ?? result.writingScore ?? null,\n    maxWritingScore: result.maxWritingScore ?? null,\n    writingStrengths: Array.isArray(result.writingStrengths)\n      ? result.writingStrengths\n      : result.writingStrengths ? [String(result.writingStrengths)] : [],\n    taskCompletion: result.taskCompletion && typeof result.taskCompletion === "object" ? result.taskCompletion : null,\n    missingTaskPoints: Array.isArray(result.missingTaskPoints) ? result.missingTaskPoints : [],\n    nextStep: String(result.nextStep || result.writingNextStep || result.improvementTarget || "").trim(),\n    writingNextStep: String(result.writingNextStep || result.nextStep || result.improvementTarget || "").trim(),\n    writing: result.writing && typeof result.writing === "object" ? result.writing : null,\n    rubric: result.rubric && typeof result.rubric === "object" ? result.rubric : null,\n    scoreBreakdown: Array.isArray(result.scoreBreakdown) ? result.scoreBreakdown : [],\n    corrections: Array.isArray(result.corrections) ? result.corrections : [],`,
  "browser AI result normalizer",
);

fs.writeFileSync(clientTarget, clientSource);
console.log("Structured OpenAI writing evidence is preserved from the examiner response to final tutor feedback.");
