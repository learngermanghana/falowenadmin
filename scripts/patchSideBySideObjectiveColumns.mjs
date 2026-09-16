import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const helperAnchor = 'function getFlatAnswerCandidateSequences(submissionText = "") {';
const helper = `function extractSideBySideAnswerCandidate(text = "") {
  const leftEntries = [];
  const rightEntries = [];

  for (const rawLine of String(text || "").split(/\\r?\\n/)) {
    const columns = rawLine.match(/^\\s*(.+?\\S)\\s{3,}(\\S.*)$/);
    if (!columns) continue;

    const left = parseNumberedEntriesFromChunk(columns[1].trim());
    if (left.length) leftEntries.push(...left);

    const right = parseNumberedEntriesFromChunk(columns[2].trim());
    if (right.length) rightEntries.push(...right);
  }

  const orderedSequentialAnswers = (entries = []) => {
    const byNumber = new Map();
    entries.forEach((entry) => {
      if (!byNumber.has(entry.number)) byNumber.set(entry.number, entry.answer);
    });
    const ordered = [...byNumber.entries()]
      .map(([number, answer]) => ({ number: Number(number), answer }))
      .sort((left, right) => left.number - right.number);
    if (ordered.length < 2) return [];
    if (!ordered.every((entry, index) => entry.number === index + 1)) return [];
    return ordered.map((entry) => entry.answer);
  };

  const leftAnswers = orderedSequentialAnswers(leftEntries);
  const rightAnswers = orderedSequentialAnswers(rightEntries);
  if (!leftAnswers.length || !rightAnswers.length) return [];
  return [...leftAnswers, ...rightAnswers];
}

${helperAnchor}`;

if (!source.includes("function extractSideBySideAnswerCandidate(")) {
  if (!source.includes(helperAnchor)) {
    throw new Error("Side-by-side objective helper anchor changed in objectiveMarking.js");
  }
  source = source.replace(helperAnchor, helper);
}

const candidateAnchor = "  for (let start = 0; start < groups.length; start += 1) {";
const candidateInsertion = "  addCandidate(extractSideBySideAnswerCandidate(submissionText));\n\n";
if (!source.includes("addCandidate(extractSideBySideAnswerCandidate(submissionText));")) {
  if (!source.includes(candidateAnchor)) {
    throw new Error("Side-by-side objective candidate anchor changed in objectiveMarking.js");
  }
  source = source.replace(candidateAnchor, `${candidateInsertion}${candidateAnchor}`);
}

fs.writeFileSync(target, source);
console.log("Side-by-side objective answer columns are parsed as separate numbered groups.");
