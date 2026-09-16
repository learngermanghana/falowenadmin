import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const helperAnchor = 'function getFlatAnswerCandidateSequences(submissionText = "") {';
const helper = `function extractSideBySideAnswerCandidate(text = "") {
  const leftEntries = [];
  const rightEntries = [];
  let sawWideColumns = false;

  for (const rawLine of String(text || "").split(/\\r?\\n/)) {
    const columns = rawLine.match(/^\\s*(.+?\\S)\\s{3,}(\\S.*)$/);
    const leftText = columns ? columns[1] : rawLine;

    const left = parseNumberedEntriesFromChunk(leftText.trim());
    if (left.length) leftEntries.push(...left);

    if (!columns) continue;
    sawWideColumns = true;
    const right = parseNumberedEntriesFromChunk(columns[2].trim());
    if (right.length) rightEntries.push(...right);
  }

  if (!sawWideColumns) return [];

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

const regressionSubmission = `Teil 1.                              Teil 2
1)heiBt.                          Hello!Guten morgen,Ich heiBe Sala, Ich komme aus Ghana und
2)heiBt.                          Ich wohne in Accra.
3)kommen
4)kommen
5)kommt.                       Teil 3
6)kommt.                      1)A.     2)C.     3)D.    4)B.   5)A
7)wohne
8)wohnst
9)wohnt`;

const { computeObjectiveScore } = await import(`${target.href}?sideBySideObjectiveColumns=1`);
const regressionResult = computeObjectiveScore("A1-1.2", regressionSubmission);
const wrongQuestions = Object.entries(regressionResult.details)
  .filter(([, detail]) => detail.correct === false)
  .map(([question]) => Number(question));
if (
  regressionResult.totalCount !== 14
  || regressionResult.correctCount !== 11
  || wrongQuestions.join(",") !== "1,3,9"
) {
  throw new Error(`Side-by-side A1-1.2 regression failed: ${regressionResult.correctCount}/${regressionResult.totalCount}; wrong=${wrongQuestions.join(",")}`);
}

console.log("Side-by-side objective answer columns are parsed separately; A1-1.2 regression = 11/14 (Q1, Q3, Q9 wrong).");
