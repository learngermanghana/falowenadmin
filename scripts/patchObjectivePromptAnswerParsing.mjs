import fs from "node:fs";
import "./patchSlashObjectiveOptionParsing.mjs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const pendingAnchor = "  let pendingQuestionNumber = null;";
const pendingReplacement = `  let pendingQuestionNumber = null;
  let pendingNumberedQuestion = null;`;
if (source.includes(pendingAnchor) && !source.includes("let pendingNumberedQuestion = null;")) {
  source = source.replace(pendingAnchor, pendingReplacement);
}

const legacyBlock = `    const parsed = parseNumberedEntriesFromChunk(line);
    if (pendingQuestionNumber && parsed.length === 1) {
      entries.push({ number: pendingQuestionNumber, answer: parsed[0].answer });
      pendingQuestionNumber = null;
      continue;
    }
    if (parsed.length) {
      entries.push(...parsed);
      pendingQuestionNumber = null;
    } else if (pendingQuestionNumber && normalizeAnswer(line)) {
      entries.push({ number: pendingQuestionNumber, answer: line });
      pendingQuestionNumber = null;
    }`;

const firstPromptAwareBlock = `    const parsed = parseNumberedEntriesFromChunk(line);
    const numberedQuestionPrompt = parsed.length === 1 && /\\?\\s*$/.test(parsed[0].answer);
    if (numberedQuestionPrompt) {
      pendingQuestionNumber = parsed[0].number;
      continue;
    }
    if (pendingQuestionNumber && parsed.length === 1) {
      entries.push({ number: pendingQuestionNumber, answer: parsed[0].answer });
      pendingQuestionNumber = null;
      continue;
    }
    if (parsed.length) {
      entries.push(...parsed);
      pendingQuestionNumber = null;
    } else if (pendingQuestionNumber && normalizeAnswer(line)) {
      entries.push({ number: pendingQuestionNumber, answer: line });
      pendingQuestionNumber = null;
    }`;

const deferredPromptBlock = `    const parsed = parseNumberedEntriesFromChunk(line);
    const numberedQuestionPrompt = parsed.length === 1
      && /\\?\\s*$/.test(parsed[0].answer)
      && !extractOptionLetter(parsed[0].answer);
    if (numberedQuestionPrompt) {
      if (pendingNumberedQuestion) entries.push(pendingNumberedQuestion);
      pendingNumberedQuestion = { number: parsed[0].number, answer: parsed[0].answer };
      pendingQuestionNumber = null;
      continue;
    }
    if (pendingNumberedQuestion) {
      if (!parsed.length && normalizeAnswer(line)) {
        entries.push({ number: pendingNumberedQuestion.number, answer: line });
        pendingNumberedQuestion = null;
        continue;
      }
      entries.push(pendingNumberedQuestion);
      pendingNumberedQuestion = null;
    }
    if (pendingQuestionNumber && parsed.length === 1) {
      entries.push({ number: pendingQuestionNumber, answer: parsed[0].answer });
      pendingQuestionNumber = null;
      continue;
    }
    if (parsed.length) {
      entries.push(...parsed);
      pendingQuestionNumber = null;
    } else if (pendingQuestionNumber && normalizeAnswer(line)) {
      entries.push({ number: pendingQuestionNumber, answer: line });
      pendingQuestionNumber = null;
    }`;

if (source.includes(legacyBlock)) {
  source = source.replace(legacyBlock, deferredPromptBlock);
} else if (source.includes(firstPromptAwareBlock)) {
  source = source.replace(firstPromptAwareBlock, deferredPromptBlock);
} else if (!source.includes(deferredPromptBlock)) {
  throw new Error("objective numbered-answer parser changed; update patchObjectivePromptAnswerParsing.mjs");
}

const returnAnchor = "  return entries.sort((a, b) => a.number - b.number);";
const returnReplacement = `  if (pendingNumberedQuestion) entries.push(pendingNumberedQuestion);
  return entries.sort((a, b) => a.number - b.number);`;
if (source.includes(returnAnchor) && !source.includes(returnReplacement)) {
  source = source.replace(returnAnchor, returnReplacement);
} else if (!source.includes(returnReplacement)) {
  throw new Error("objective numbered-answer return anchor changed; update patchObjectivePromptAnswerParsing.mjs");
}

fs.writeFileSync(target, source);

// The smart/AI marking service has its own submission-section parser in
// autoMarking.js. Some B1 workbook exports repeat the Schreiben number in
// middle-dot headings ("Teil 2 · Lesen" / "Teil 2 · Hören") and put compact
// answers on that same line. Normalize only that workbook form, preserving
// intentional legacy prompts such as "Teil 2. Lesen Sie ...".
const autoTarget = new URL("../src/utils/autoMarking.js", import.meta.url);
let autoSource = fs.readFileSync(autoTarget, "utf8");

const autoSplitBefore = `function splitSubmissionIntoParts(submissionText = "") {
  const text = String(submissionText || "").trim();
  if (!text) return [{ partId: "unknown", title: "Unknown", text: "", confidence: 0 }];`;
const autoSplitAfter = `function splitSubmissionIntoParts(submissionText = "") {
  const text = String(submissionText || "")
    .trim()
    .replace(/(^|\\n)([ \\t]*(?:teil|part)[ \\t]*)2([ \\t]*·[ \\t]*(?:lesen|reading)\\b)/gi, "$1$23$3")
    .replace(/(^|\\n)([ \\t]*(?:teil|part)[ \\t]*)2([ \\t]*·[ \\t]*(?:h[oö]ren|hoeren|listening)\\b)/gi, "$1$24$3")
    .replace(/((?:teil|part)[ \\t]*[34][ \\t]*·[ \\t]*(?:lesen|reading|h[oö]ren|hoeren|listening)\\b)[ \\t]+(?=\\d{1,3}[ \\t]*[A-FX](?:\\b|[).,:;–-]))/gi, "$1\\n");
  if (!text) return [{ partId: "unknown", title: "Unknown", text: "", confidence: 0 }];`;

if (autoSource.includes(autoSplitBefore)) {
  autoSource = autoSource.replace(autoSplitBefore, autoSplitAfter);
} else if (!autoSource.includes(".replace(/(^|\\n)([ \\t]*(?:teil|part)[ \\t]*)2([ \\t]*·[ \\t]*(?:lesen|reading)")) {
  throw new Error("smart marking section parser changed; update patchObjectivePromptAnswerParsing.mjs");
}

const compactBefore = `.flatMap((line) => line.split(/[,;]+/))`;
const compactAfter = `.flatMap((line) => line.split(/[,;·•|]+/))`;
if (autoSource.includes(compactBefore)) {
  autoSource = autoSource.replace(compactBefore, compactAfter);
} else if (!autoSource.includes(compactAfter)) {
  throw new Error("smart marking compact objective parser changed; update patchObjectivePromptAnswerParsing.mjs");
}

fs.writeFileSync(autoTarget, autoSource);
console.log("Objective parsing now reads answers beneath numbered prompts and compact B1 Lesen/Hören workbook sections.");
