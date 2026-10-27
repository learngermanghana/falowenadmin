import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

function replaceOnce(input, before, after, label) {
  if (input.includes(after)) return input;
  if (!input.includes(before)) throw new Error(`${label} anchor changed; update patchMultipartObjectiveAnswerBlocks.mjs`);
  return input.replace(before, after);
}

source = replaceOnce(
  source,
  '    .replace(/[^a-z0-9]+/g, " ")\n    .trim();',
  '    .replace(/[^a-z0-9]+/g, " ")\n    .replace(/(\\d)(uhr)\\b/g, "$1 $2")\n    .trim();',
  "compact Uhr spacing normalization",
);

const cleanupHelper = '  const cleanParsedAnswer = (value = "") => String(value || "")\n    .replace(/^[).,:;–-]+\\s*/, "")\n    .trim();';
if (!source.includes(cleanupHelper)) {
  const labelledAnchor = '  const labelled = source.match(';
  if (!source.includes(labelledAnchor)) {
    throw new Error("repeated answer delimiter cleanup helper anchor changed; update patchMultipartObjectiveAnswerBlocks.mjs");
  }
  source = source.replace(
    labelledAnchor,
    `${cleanupHelper}\n\n${labelledAnchor}`,
  );
}

source = replaceOnce(
  source,
  '    .map((match) => ({ number: Number(match[1]), answer: String(match[2] || "").trim() }))',
  '    .map((match) => ({ number: Number(match[1]), answer: cleanParsedAnswer(match[2]) }))',
  "compact numbered answer cleanup",
);

source = replaceOnce(
  source,
  '  if (single && normalizeAnswer(single[2])) return [{ number: Number(single[1]), answer: single[2].trim() }];',
  '  if (single && normalizeAnswer(single[2])) return [{ number: Number(single[1]), answer: cleanParsedAnswer(single[2]) }];',
  "single numbered answer cleanup",
);

source = replaceOnce(
  source,
  '  const blocks = splitIntoAnswerBlocks(submissionText).map(extractNumberedTextEntries).filter((entries) => entries.length && !isLikelyWritingBlock(entries));',
  [
    '  const parsedBlocks = splitIntoAnswerBlocks(submissionText)',
    '    .map(extractNumberedTextEntries)',
    '    .filter((entries) => entries.length);',
    '  const blocksAlignToReferenceParts = parsedBlocks.length === groups.length',
    '    && groups.every((group, index) => parsedBlocks[index]?.length === group.items.length);',
    '  const blocks = blocksAlignToReferenceParts',
    '    ? parsedBlocks',
    '    : parsedBlocks.filter((entries) => !isLikelyWritingBlock(entries));',
  ].join("\n"),
  "aligned multipart objective block preservation",
);

fs.writeFileSync(target, source);
console.log("Aligned multipart objective blocks preserve full-sentence answers and tolerate compact time and repeated delimiters.");

await import("./patchQSectionAliasHeadings.mjs");