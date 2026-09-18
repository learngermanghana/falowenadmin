import fs from "node:fs";

function replaceAny(source, searches, replacement, label) {
  if (source.includes(replacement)) return source;
  for (const search of searches) {
    if (source.includes(search)) return source.replace(search, replacement);
  }
  throw new Error(`${label} anchor changed; update patchStructuredWritingEvidence.mjs`);
}

function ensureAfter(source, anchor, addition, label) {
  if (source.includes(addition)) return source;
  if (!source.includes(anchor)) throw new Error(`${label} anchor changed; update patchStructuredWritingEvidence.mjs`);
  return source.replace(anchor, anchor + addition);
}

const functionTarget = new URL("../functions/index.js", import.meta.url);
let functionSource = fs.readFileSync(functionTarget, "utf8");

const functionMissingAnchor = '    missingTaskPoints: Array.isArray(result.missingTaskPoints) ? result.missingTaskPoints : [],';
const functionEvidenceFields = `
    taskPointEvidence: Array.isArray(result.taskPointEvidence)
      ? result.taskPointEvidence.map((item) => ({
          label: String(item?.label || item?.taskPoint || "").trim(),
          status: ["met", "missing", "review"].includes(String(item?.status || "").toLowerCase()) ? String(item.status).toLowerCase() : "review",
          evidence: String(item?.evidence || "").trim(),
          reason: String(item?.reason || "").trim(),
        })).filter((item) => item.label)
      : [],`;
functionSource = ensureAfter(
  functionSource,
  functionMissingAnchor,
  functionEvidenceFields,
  "Firebase task-point evidence normalizer",
);

const legacyWritingPrompt = `    "For writing, assess task completion, CEFR-appropriate grammar, word order, vocabulary, spelling, structure, and clarity. When writing needs work, explain a genuine strength, give two or three concrete corrections that quote the student’s exact short wording and show improved wording, briefly explain the most useful language rule, and include one task-relevant next step. When writing is perfect, do not invent corrections; praise specific strengths and give an extension goal instead. Avoid generic writing comments.",`;
const structuredWritingPrompt = `    "For writing, assess task completion, CEFR-appropriate grammar, word order, vocabulary, spelling, structure, and clarity. Return writingStrengths as one or two short evidence-based strengths that quote or name exact details from the student's text. Return taskCompletion as an object with completed, total, and missing. Return corrections as one or two objects with from, to, reason, and partId 'teil2'; use an empty array when there is no genuine correction. Return nextStep as one specific task-relevant improvement or extension goal. Never invent a correction merely to fill a field, and avoid generic writing comments.",`;
const alignedWritingPrompt = `    "For writing, assess task completion, CEFR-appropriate grammar, word order, vocabulary, spelling, structure, and clarity. Return writingStrengths as one or two short evidence-based strengths that quote or name exact details from the student's text. Return taskCompletion as an object with completed, total, and missing. Return corrections as one or two objects with from, to, reason, and partId 'teil2'; use an empty array when there is no genuine correction. Return nextStep as one specific task-relevant improvement or extension goal. Score Schreiben as a 0-100 percentage and make the number agree with the evidence and feedback. For A2/B1, a coherent response that addresses the task, develops connected ideas, gives relevant examples, and shows several appropriate sentence structures should normally be at least 60 unless there are substantial language or task-completion problems. Scores below 60 are reserved for clearly insufficient writing and must be justified by concrete missing task points, serious recurring language problems, or major coherence/clarity failures that are explicitly reflected in corrections and feedback. Do not give a failing writing score together with feedback that says the task was completed and only needs deeper development. Never invent a correction merely to fill a field, and avoid generic writing comments.",`;
const evidenceWritingPrompt = `    "For writing, assess task completion, CEFR-appropriate grammar, word order, vocabulary, spelling, structure, and clarity. Return writingStrengths as one or two short evidence-based strengths that quote or name exact details from the student's text. Return taskCompletion as an object with completed, total, and missing. Return taskPointEvidence as one entry for every required communicative point, with label, status (met, missing, or review), a short exact evidence phrase from the student's Teil 2 when met, and a brief reason. A question mark, greeting, connector, or closing counts only when it performs the communicative function requested by that point. Return corrections as one or two objects with from, to, reason, and partId 'teil2'; use an empty array when there is no genuine correction. Return nextStep as one specific task-relevant improvement or extension goal. Never invent a correction merely to fill a field, and avoid generic writing comments.",`;
const alignedEvidenceWritingPrompt = `    "For writing, assess task completion, CEFR-appropriate grammar, word order, vocabulary, spelling, structure, and clarity. Return writingStrengths as one or two short evidence-based strengths that quote or name exact details from the student's text. Return taskCompletion as an object with completed, total, and missing. Return taskPointEvidence as one entry for every required communicative point, with label, status (met, missing, or review), a short exact evidence phrase from the student's Teil 2 when met, and a brief reason. A question mark, greeting, connector, or closing counts only when it performs the communicative function requested by that point. Return corrections as one or two objects with from, to, reason, and partId 'teil2'; use an empty array when there is no genuine correction. Return nextStep as one specific task-relevant improvement or extension goal. Score Schreiben as a 0-100 percentage and make the number agree with the evidence and feedback. For A2/B1, a coherent response that addresses the task, develops connected ideas, gives relevant examples, and shows several appropriate sentence structures should normally be at least 60 unless there are substantial language or task-completion problems. Scores below 60 are reserved for clearly insufficient writing and must be justified by concrete missing task points, serious recurring language problems, or major coherence/clarity failures that are explicitly reflected in corrections and feedback. Do not give a failing writing score together with feedback that says the task was completed and only needs deeper development. Never invent a correction merely to fill a field, and avoid generic writing comments.",`;

functionSource = replaceAny(
  functionSource,
  [legacyWritingPrompt, structuredWritingPrompt, alignedWritingPrompt, evidenceWritingPrompt],
  alignedEvidenceWritingPrompt,
  "Firebase writing evidence prompt",
);

const jsonPromptLegacy = `    \`Return JSON only. The feedback field must be \${AI_FEEDBACK_MIN_WORDS} to \${AI_FEEDBACK_MAX_WORDS} words, plain text only, with no Markdown, bold markers, or asterisks. Use the available space for specific, actionable guidance rather than filler. Include score/finalScore 0-100, status marked or needs_review, confidence 0-1, detectedParts, parts, objective totals, writingScore, corrections, and improvementSummary.\`,`;
const jsonPromptStructured = `    \`Return JSON only. The feedback field must be \${AI_FEEDBACK_MIN_WORDS} to \${AI_FEEDBACK_MAX_WORDS} words, plain text only, with no Markdown, bold markers, or asterisks. Use the available space for specific, actionable guidance rather than filler. Include score/finalScore 0-100, status marked or needs_review, confidence 0-1, detectedParts, parts, objective totals, writingScore, writingScorePercent, writingStrengths, taskCompletion, missingTaskPoints, corrections, nextStep, and improvementSummary.\`,`;
const jsonPromptEvidence = `    \`Return JSON only. The feedback field must be \${AI_FEEDBACK_MIN_WORDS} to \${AI_FEEDBACK_MAX_WORDS} words, plain text only, with no Markdown, bold markers, or asterisks. Use the available space for specific, actionable guidance rather than filler. Include score/finalScore 0-100, status marked or needs_review, confidence 0-1, detectedParts, parts, objective totals, writingScore, writingScorePercent, writingStrengths, taskCompletion, missingTaskPoints, taskPointEvidence, corrections, nextStep, and improvementSummary.\`,`;
functionSource = replaceAny(
  functionSource,
  [jsonPromptLegacy, jsonPromptStructured],
  jsonPromptEvidence,
  "Firebase JSON field prompt",
);

fs.writeFileSync(functionTarget, functionSource);

const clientTarget = new URL("../src/services/markingServiceBase.js", import.meta.url);
let clientSource = fs.readFileSync(clientTarget, "utf8");
const clientMissingAnchor = '    missingTaskPoints: Array.isArray(result.missingTaskPoints) ? result.missingTaskPoints : [],';
const clientEvidenceField = `
    taskPointEvidence: Array.isArray(result.taskPointEvidence) ? result.taskPointEvidence : [],`;
clientSource = ensureAfter(
  clientSource,
  clientMissingAnchor,
  clientEvidenceField,
  "browser task-point evidence normalizer",
);

fs.writeFileSync(clientTarget, clientSource);
console.log("Structured OpenAI writing evidence is preserved from examiner response to tutor review, including task-point proof.");
