import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

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

const promptAwareBlock = `    const parsed = parseNumberedEntriesFromChunk(line);
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

if (source.includes(legacyBlock)) {
  source = source.replace(legacyBlock, promptAwareBlock);
} else if (!source.includes(promptAwareBlock)) {
  throw new Error("objective numbered-answer parser changed; update patchObjectivePromptAnswerParsing.mjs");
}

fs.writeFileSync(target, source);
console.log("Objective parsing now reads answers beneath numbered question prompts.");
