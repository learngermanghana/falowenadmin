import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const before = [
  '  const sequentialPartAnswer = sequentialPartAnswers.get(`${item.partId}.${item.questionNumber}`);',
  '  if (sequentialPartAnswer !== undefined) return sequentialPartAnswer;',
  '',
  '  const sectionText = sections.find((section) => section.partId === item.partId)?.text || submissionText;',
].join("\n");

const after = [
  '  const sequentialPartAnswer = sequentialPartAnswers.get(`${item.partId}.${item.questionNumber}`);',
  '  if (sequentialPartAnswer !== undefined) return sequentialPartAnswer;',
  '  if (sequentialPartAnswers.size > 0) return "";',
  '',
  '  const sectionText = sections.find((section) => section.partId === item.partId)?.text || submissionText;',
].join("\n");

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error("Sequential multipart answer anchor changed; update patchSequentialMultipartIsolation.mjs");
  }
  source = source.replace(before, after);
  fs.writeFileSync(target, source);
}

console.log("Sequential multipart answers are isolated; missing answers cannot be borrowed from later restarted blocks.");
