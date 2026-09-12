import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) throw new Error(`${label} anchor changed; update patchA1DuplicateObjectiveSectionLabels.mjs`);
  return source.replace(search, replacement);
}

const target = new URL("../src/utils/autoMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const writingPartHelper = `function isReferenceWritingPart(referenceEntry = {}, partId = "unknown") {
  const normalizedPartId = findPartId(partId);
  if (normalizedPartId === "unknown") return false;

  const declaredWritingParts = [
    ...(Array.isArray(referenceEntry.writingParts) ? referenceEntry.writingParts : []),
    ...(Array.isArray(referenceEntry.aiGradedParts) ? referenceEntry.aiGradedParts : []),
  ].map(findPartId);
  if (declaredWritingParts.includes(normalizedPartId)) return true;

  const grading = Object.entries(referenceEntry.partGrading || {})
    .find(([candidatePartId]) => findPartId(candidatePartId) === normalizedPartId)?.[1] || null;
  const gradingMode = String(grading?.gradingMode || "").trim().toLowerCase();
  return ["ai_written_response", "ai_writing", "writing"].includes(gradingMode);
}

`;

if (!source.includes(writingPartHelper)) {
  source = replaceOnce(
    source,
    "function getReferenceObjectivePartIds(referenceEntry = {}) {",
    `${writingPartHelper}function getReferenceObjectivePartIds(referenceEntry = {}) {`,
    "reference writing helper",
  );
}

const desiredObjectivePartFilter = `  return [...new Set(partIds)].filter((partId) => !isReferenceWritingPart(referenceEntry, partId));`;
if (!source.includes(desiredObjectivePartFilter)) {
  const objectivePartFilterCandidates = [
    `  return [...new Set(partIds)].filter((partId) => partId !== "teil2");`,
    `  return [...new Set(partIds)].filter((partId) => partId !== "teil2" || detectPartType({ partId, text: "", referenceEntry }) === "objective");`,
  ];
  const currentFilter = objectivePartFilterCandidates.find((candidate) => source.includes(candidate));
  if (!currentFilter) throw new Error("objective Teil 2 filtering anchor changed; update patchA1DuplicateObjectiveSectionLabels.mjs");
  source = source.replace(currentFilter, desiredObjectivePartFilter);
}

const oldSelector = `function selectSubmissionTextForPart(submissionText = "", partId = "main") {
  if (partId === "main" || partId === "unknown") return submissionText;
  const matchingParts = splitSubmissionIntoParts(submissionText).filter((part) => part.partId === partId);
  if (!matchingParts.length) return submissionText;
  return matchingParts.map((part) => part.text).filter(Boolean).join("\\n");
}`;

const repairedSelector = `function repairSequentialPartLabels(parts = [], expectedPartIds = []) {
  const expected = expectedPartIds.filter((partId) => /^teil[1-4]$/.test(partId));
  const labeledParts = parts.filter((part) => part.partId !== "unknown");
  if (expected.length < 2 || labeledParts.length !== expected.length || parts.length !== labeledParts.length) return parts;

  const observed = labeledParts.map((part) => part.partId);
  const missing = expected.filter((partId) => !observed.includes(partId));
  const duplicatePartIds = [...new Set(observed.filter((partId, index) => observed.indexOf(partId) !== index))];
  if (missing.length !== 1 || duplicatePartIds.length !== 1) return parts;

  const mismatchIndexes = expected
    .map((expectedPartId, index) => observed[index] === expectedPartId ? -1 : index)
    .filter((index) => index >= 0);
  if (mismatchIndexes.length !== 1) return parts;

  const mismatchIndex = mismatchIndexes[0];
  if (expected[mismatchIndex] !== missing[0] || observed[mismatchIndex] !== duplicatePartIds[0]) return parts;

  return parts.map((part, index) => index === mismatchIndex ? {
    ...part,
    partId: expected[mismatchIndex],
    title: part.title + " (recovered as " + expected[mismatchIndex] + ")",
    confidence: Math.min(Number(part.confidence || 0.9), 0.8),
  } : part);
}

function selectSubmissionTextForPart(submissionText = "", partId = "main", expectedPartIds = []) {
  if (partId === "main" || partId === "unknown") return submissionText;
  const repairedParts = repairSequentialPartLabels(splitSubmissionIntoParts(submissionText), expectedPartIds);
  const matchingParts = repairedParts.filter((part) => part.partId === partId);
  if (!matchingParts.length) return submissionText;
  return matchingParts.map((part) => part.text).filter(Boolean).join("\\n");
}`;

source = replaceOnce(source, oldSelector, repairedSelector, "duplicate section label recovery");
source = replaceOnce(
  source,
  `    const textForPart = selectSubmissionTextForPart(submissionText, currentPartId);`,
  `    const textForPart = selectSubmissionTextForPart(submissionText, currentPartId, partIds);`,
  "expected part sequence input",
);

fs.writeFileSync(target, source);
console.log("Applied A1 objective Teil 2 and duplicate-section label recovery.");
