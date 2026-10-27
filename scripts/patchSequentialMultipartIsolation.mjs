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

const originalResolverSignature = 'function getStudentAnswerForItem({ item, index, submissionText, sections, flatAnswers, sequentialPartAnswers }) {';
const mixedPartHelpersAndResolver = [
  'function orderedReferencePartGroups(referenceItems = []) {',
  '  const groups = [];',
  '  const byPartId = new Map();',
  '  referenceItems.forEach((item) => {',
  '    if (item.partId === "main") return;',
  '    if (!byPartId.has(item.partId)) {',
  '      const group = { partId: item.partId, items: [] };',
  '      byPartId.set(item.partId, group);',
  '      groups.push(group);',
  '    }',
  '    byPartId.get(item.partId).items.push(item);',
  '  });',
  '  return groups;',
  '}',
  '',
  'function buildMixedPartAnswerMap(referenceItems = [], submissionText = "", sections = [], sectionPartIds = new Set()) {',
  '  const groups = orderedReferencePartGroups(referenceItems);',
  '  const map = new Map();',
  '  const merge = (candidate) => candidate.forEach((value, key) => map.set(key, value));',
  '  const firstExplicitIndex = groups.findIndex((group) => sectionPartIds.has(group.partId));',
  '',
  '  if (firstExplicitIndex > 0) {',
  '    const leadingItems = groups',
  '      .slice(0, firstExplicitIndex)',
  '      .filter((group) => !sectionPartIds.has(group.partId))',
  '      .flatMap((group) => group.items);',
  '    merge(buildSequentialPartAnswerMap(',
  '      leadingItems,',
  '      leadingUnlabelledSubmissionText(submissionText),',
  '      false,',
  '    ));',
  '  }',
  '',
  '  groups.forEach((group, groupIndex) => {',
  '    if (!sectionPartIds.has(group.partId)) return;',
  '    const sectionText = sections.find((section) => section.partId === group.partId)?.text;',
  '    if (sectionText === undefined) return;',
  '    const entries = extractRestartedNumberingEntries(sectionText);',
  '    const overflow = entries.slice(group.items.length);',
  '    if (!overflow.length) return;',
  '',
  '    let offset = 0;',
  '    for (let nextIndex = groupIndex + 1; nextIndex < groups.length && offset < overflow.length; nextIndex += 1) {',
  '      const nextGroup = groups[nextIndex];',
  '      if (sectionPartIds.has(nextGroup.partId)) continue;',
  '      nextGroup.items.forEach((item, itemIndex) => {',
  '        const entry = overflow[offset + itemIndex];',
  '        if (entry) map.set(`${item.partId}.${item.questionNumber}`, entry.answer);',
  '      });',
  '      offset += nextGroup.items.length;',
  '    }',
  '  });',
  '',
  '  return map;',
  '}',
  '',
  'function getStudentAnswerForItem({ item, index, submissionText, sections, flatAnswers, sequentialPartAnswers, hasAnyMatchingPartSections }) {',
].join("\n");
source = replaceOnce(
  source,
  originalResolverSignature,
  mixedPartHelpersAndResolver,
  "mixed part resolver helpers",
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
  '  const sequentialPartAnswers = hasAnyMatchingPartSections',
  '    ? buildMixedPartAnswerMap(referenceItems, submissionText, sections, sectionPartIds)',
  '    : buildSequentialPartAnswerMap(referenceItems, submissionText, false);',
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
console.log("Sequential multipart answers are isolated while labelled sections, leading blocks and overflow remain authoritative.");
