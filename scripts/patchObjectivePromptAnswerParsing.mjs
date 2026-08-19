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
console.log("Objective parsing now reads answers beneath numbered question prompts without dropping question-form choices.");
