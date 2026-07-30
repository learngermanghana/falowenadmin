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

source = replaceOnce(source, before, after, "reordered restarted objective groups");
fs.writeFileSync(target, source);
console.log("Flat objective assignments can match restarted answer groups to the correct reference range regardless of submission order.");
