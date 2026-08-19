import fs from "node:fs";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`${label} anchor changed; update patchReorderedObjectiveGroups.mjs`);
  return source.replace(before, after);
}

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const before = `function getFlatAnswerCandidateSequences(submissionText = "") {
  const sections = splitSubmissionIntoSections(submissionText);
  const sectionGroups = sections
    .map((section) => extractRestartedNumberingEntries(section.text))
    .filter((entries) => entries.length && !isLikelyWritingBlock(entries));

  const blockGroups = splitIntoAnswerBlocks(submissionText)
    .map((block) => extractRestartedNumberingEntries(block))
    .filter((entries) => entries.length && !isLikelyWritingBlock(entries));

  const groups = sectionGroups.length > 1 ? sectionGroups : blockGroups.length > 1 ? blockGroups : sectionGroups.length ? sectionGroups : blockGroups;
  if (!groups.length) return [];

  const candidates = [];
  for (let start = 0; start < groups.length; start += 1) {
    const selectedGroups = groups.slice(start);
    const answers = selectedGroups.flatMap((entries) => entries.sort((a, b) => a.number - b.number).map((entry) => entry.answer));
    if (answers.length) candidates.push(answers);
  }

  candidates.push(groups.flatMap((entries) => entries.sort((a, b) => a.number - b.number).map((entry) => entry.answer)));
  return candidates;
}`;

const after = `function permuteAnswerGroups(groups = []) {
  if (groups.length <= 1) return [groups];
  if (groups.length > 5) return [groups];

  const permutations = [];
  groups.forEach((group, index) => {
    const remaining = groups.filter((_, candidateIndex) => candidateIndex !== index);
    permuteAnswerGroups(remaining).forEach((tail) => permutations.push([group, ...tail]));
  });
  return permutations;
}

function flattenAnswerGroups(groups = []) {
  return groups.flatMap((entries) => [...entries]
    .sort((a, b) => a.number - b.number)
    .map((entry) => entry.answer));
}

function getFlatAnswerCandidateSequences(submissionText = "") {
  const sections = splitSubmissionIntoSections(submissionText);
  const sectionGroups = sections
    .map((section) => extractRestartedNumberingEntries(section.text))
    .filter((entries) => entries.length && !isLikelyWritingBlock(entries));

  const blockGroups = splitIntoAnswerBlocks(submissionText)
    .map((block) => extractRestartedNumberingEntries(block))
    .filter((entries) => entries.length && !isLikelyWritingBlock(entries));

  const groups = sectionGroups.length > 1 ? sectionGroups : blockGroups.length > 1 ? blockGroups : sectionGroups.length ? sectionGroups : blockGroups;
  if (!groups.length) return [];

  const candidates = [];
  const seen = new Set();
  const addCandidate = (answers) => {
    if (!answers.length) return;
    const key = JSON.stringify(answers);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(answers);
  };

  for (let start = 0; start < groups.length; start += 1) {
    addCandidate(flattenAnswerGroups(groups.slice(start)));
  }

  permuteAnswerGroups(groups).forEach((orderedGroups) => addCandidate(flattenAnswerGroups(orderedGroups)));
  return candidates;
}`;

if (source.includes(before)) {
  source = source.replace(before, after);
} else if (!source.includes("function permuteAnswerGroups(groups = []) {")) {
  throw new Error("reordered restarted objective groups anchor changed; update patchReorderedObjectiveGroups.mjs");
}

const numberResetGroupHelperAnchor = "function permuteAnswerGroups(groups = []) {";
const numberResetGroupHelper = `function splitNumberResetAnswerGroups(text = "") {
  const groups = [];
  let current = [];

  for (const rawLine of String(text || "").split(/\\r?\\n/)) {
    const entries = parseNumberedEntriesFromChunk(rawLine);
    for (const entry of entries) {
      const previousNumber = current[current.length - 1]?.number || 0;
      if (current.length && entry.number <= previousNumber) {
        groups.push(current);
        current = [];
      }
      current.push(entry);
    }
  }

  if (current.length) groups.push(current);
  return groups.length === 2 && groups[0].length === 7 && groups[1].length === 5 ? groups : [];
}

${numberResetGroupHelperAnchor}`;
if (!source.includes("function splitNumberResetAnswerGroups(text = \"\") {")) {
  source = replaceOnce(
    source,
    numberResetGroupHelperAnchor,
    numberResetGroupHelper,
    "restarted numbering group helper",
  );
}

const questionGroupHelperAnchor = "function permuteAnswerGroups(groups = []) {";
const questionGroupHelper = `function splitQuestionGroupBlocks(text = "") {
  const sourceText = String(text || "");
  const markerRegex = /(?:^|\\n)[ \\t]*q([1-9])\\s*[).:–-]\\s*/gi;
  const markers = [];
  let match;

  while ((match = markerRegex.exec(sourceText))) {
    markers.push({
      index: match.index,
      end: markerRegex.lastIndex,
      number: Number(match[1]),
    });
  }

  if (markers.length < 2 || markers.length > 5) return [];
  if (!markers.every((marker, index) => marker.number === index + 1)) return [];

  const groups = markers.map((marker, index) => {
    const next = markers[index + 1];
    const block = sourceText.slice(marker.end, next ? next.index : sourceText.length).trim();
    return extractRestartedNumberingEntries(block);
  });

  return groups.every((entries) => entries.length >= 2) ? groups : [];
}

${questionGroupHelperAnchor}`;
source = replaceOnce(
  source,
  questionGroupHelperAnchor,
  questionGroupHelper,
  "Q-numbered objective group helper",
);

const groupSelectionBefore = "  const groups = sectionGroups.length > 1 ? sectionGroups : blockGroups.length > 1 ? blockGroups : sectionGroups.length ? sectionGroups : blockGroups;";
const groupSelectionAfter = `  const questionGroups = splitQuestionGroupBlocks(submissionText);
  const groups = questionGroups.length > 1
    ? questionGroups
    : sectionGroups.length > 1
      ? sectionGroups
      : blockGroups.length > 1
        ? blockGroups
        : sectionGroups.length
          ? sectionGroups
          : blockGroups;`;
const numberResetGroupSelection = `${groupSelectionAfter}
  const numberResetGroups = splitNumberResetAnswerGroups(submissionText);`;

const resetCandidateBefore = "  permuteAnswerGroups(groups).forEach((orderedGroups) => addCandidate(flattenAnswerGroups(orderedGroups)));";
const resetCandidateAfter = `  if (numberResetGroups.length > 1) addCandidate(flattenAnswerGroups(numberResetGroups));\n\n  permuteAnswerGroups(groups).forEach((orderedGroups) => addCandidate(flattenAnswerGroups(orderedGroups)));`;

if (!source.includes(numberResetGroupSelection)) {
  source = replaceOnce(
    source,
    groupSelectionBefore,
    groupSelectionAfter,
    "Q-numbered objective group priority",
  );

  source = replaceOnce(
    source,
    groupSelectionAfter,
    numberResetGroupSelection,
    "number-reset objective group priority",
  );
}

source = replaceOnce(
  source,
  resetCandidateBefore,
  resetCandidateAfter,
  "number-reset objective candidate",
);

fs.writeFileSync(target, source);
console.log("Flat objective assignments can match restarted answer groups, including Q1/Q2/Q3 section headings, to the correct reference range regardless of submission order.");
