import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

function replaceOnce(input, before, after, label) {
  if (input.includes(after)) return input;
  if (!input.includes(before)) throw new Error(`${label} anchor changed; update patchSequentialMultipartIsolation.mjs`);
  return input.replace(before, after);
}

source = replaceOnce(
  source,
  'function buildSequentialPartAnswerMap(referenceItems = [], submissionText = "", hasMatchingPartSections = false) {\n  if (hasMatchingPartSections) return new Map();',
  'function buildSequentialPartAnswerMap(referenceItems = [], submissionText = "", hasExplicitPartSections = false) {\n  if (hasExplicitPartSections) return new Map();',
  "sequential block activation",
);

const blockHelperAnchor = 'function splitIntoAnswerBlocks(text = "") {\n  return String(text || "").split(/\\n\\s*\\n+/).map((block) => block.trim()).filter(Boolean);\n}';
const blockHelperWithLeadingText = `${blockHelperAnchor}\n\nfunction leadingUnlabelledSubmissionText(text = "") {\n  const sourceText = String(text || "");\n  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|part)[ \\t]*[1-4]\\b[^\\n]*|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?=\\n|$)/i;\n  const marker = markerRegex.exec(sourceText);\n  return marker ? sourceText.slice(0, marker.index).trim() : sourceText.trim();\n}`;
source = replaceOnce(
  source,
  blockHelperAnchor,
  blockHelperWithLeadingText,
  "leading unlabelled section helper",
);

source = replaceOnce(
  source,
  'function getStudentAnswerForItem({ item, index, submissionText, sections, flatAnswers, sequentialPartAnswers }) {',
  'function getStudentAnswerForItem({ item, index, submissionText, sections, flatAnswers, sequentialPartAnswers, hasAnyMatchingPartSections }) {',
  "student-answer resolver signature",
);

const originalLookup = [
  '  const sequentialPartAnswer = sequentialPartAnswers.get(`${item.partId}.${item.questionNumber}`);',
  '  if (sequentialPartAnswer !== undefined) return sequentialPartAnswer;',
  '',
  '  const sectionText = sections.find((section) => section.partId === item.partId)?.text || submissionText;',
  '  const numberedAnswers = extractNumberedTextAnswers(sectionText);',
  '  if (numberedAnswers[item.questionNumber] !== undefined) return numberedAnswers[item.questionNumber];',
].join("\n");

const previouslyPatchedLookup = [
  '  const sequentialPartAnswer = sequentialPartAnswers.get(`${item.partId}.${item.questionNumber}`);',
  '  if (sequentialPartAnswer !== undefined) return sequentialPartAnswer;',
  '  if (sequentialPartAnswers.size > 0) return "";',
  '',
  '  const sectionText = sections.find((section) => section.partId === item.partId)?.text || submissionText;',
  '  const numberedAnswers = extractNumberedTextAnswers(sectionText);',
  '  if (numberedAnswers[item.questionNumber] !== undefined) return numberedAnswers[item.questionNumber];',
].join("\n");

const isolatedLookup = [
  '  const matchingSectionText = sections.find((section) => section.partId === item.partId)?.text;',
  '  if (matchingSectionText !== undefined) {',
  '    const matchingSectionAnswers = extractNumberedTextAnswers(matchingSectionText);',
  '    return matchingSectionAnswers[item.questionNumber] ?? "";',
  '  }',
  '',
  '  const sequentialPartAnswer = sequentialPartAnswers.get(`${item.partId}.${item.questionNumber}`);',
  '  if (sequentialPartAnswer !== undefined) return sequentialPartAnswer;',
  '  if (sequentialPartAnswers.size > 0 || hasAnyMatchingPartSections) return "";',
  '',
  '  const sectionText = submissionText;',
  '  const numberedAnswers = extractNumberedTextAnswers(sectionText);',
  '  if (numberedAnswers[item.questionNumber] !== undefined) return numberedAnswers[item.questionNumber];',
].join("\n");

if (!source.includes(isolatedLookup)) {
  if (source.includes(previouslyPatchedLookup)) {
    source = source.replace(previouslyPatchedLookup, isolatedLookup);
  } else if (source.includes(originalLookup)) {
    source = source.replace(originalLookup, isolatedLookup);
  } else {
    throw new Error("Sequential multipart answer lookup anchor changed; update patchSequentialMultipartIsolation.mjs");
  }
}

source = replaceOnce(
  source,
  '  const hasMatchingPartSections = Boolean(referencePartIds.length) && referencePartIds.every((partId) => sectionPartIds.has(partId));',
  '  const hasAnyMatchingPartSections = Boolean(referencePartIds.length) && referencePartIds.some((partId) => sectionPartIds.has(partId));',
  "partial labelled-section detection",
);

const originalSequentialSetup = '  const sequentialPartAnswers = buildSequentialPartAnswerMap(referenceItems, submissionText, hasMatchingPartSections);';
const mixedSequentialSetup = [
  '  const sequentialReferenceItems = hasAnyMatchingPartSections',
  '    ? referenceItems.filter((item) => item.partId !== "main" && !sectionPartIds.has(item.partId))',
  '    : referenceItems;',
  '  const sequentialSubmissionText = hasAnyMatchingPartSections',
  '    ? leadingUnlabelledSubmissionText(submissionText)',
  '    : submissionText;',
  '  const sequentialPartAnswers = buildSequentialPartAnswerMap(sequentialReferenceItems, sequentialSubmissionText, false);',
].join("\n");
source = replaceOnce(
  source,
  originalSequentialSetup,
  mixedSequentialSetup,
  "mixed labelled/unlabelled sequential mapping",
);

source = replaceOnce(
  source,
  '    const student = getStudentAnswerForItem({ item, index, submissionText, sections, flatAnswers, sequentialPartAnswers });',
  '    const student = getStudentAnswerForItem({ item, index, submissionText, sections, flatAnswers, sequentialPartAnswers, hasAnyMatchingPartSections });',
  "student-answer resolver call",
);

fs.writeFileSync(target, source);
console.log("Sequential multipart answers are isolated while labelled and leading unlabelled sections remain authoritative.");
