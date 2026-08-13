import fs from "node:fs";

function patchFile(path, apply) {
  let source = fs.readFileSync(path, "utf8");
  source = apply(source);
  fs.writeFileSync(path, source);
}

function replaceOnce(source, anchor, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(anchor)) throw new Error(`${label} anchor changed`);
  return source.replace(anchor, replacement);
}

const placeholderExpression = 'answerValues.length > 0 && answerValues.every((value) => /^(read|see|check) (the )?(comment|comments|instructions?)( for (the )?answers?)?$/.test(value))';

patchFile(new URL("../src/utils/objectiveMarking.js", import.meta.url), (source) => {
  const anchor = 'function isWritingPart(referenceEntry = {}, partId = "main") {\n  const normalizedPartId = normalizePartId(partId);';
  const replacement = `function isWritingPart(referenceEntry = {}, partId = "main") {\n  const normalizedPartId = normalizePartId(partId);\n  const rawAnswers = referenceEntry.rawAnswers || referenceEntry.answers || {};\n  const answerValues = Object.values(rawAnswers).map((value) => String(value || "").trim().toLowerCase());\n  const writingPlaceholder = ${placeholderExpression};\n  if (normalizedPartId === "main" && writingPlaceholder) return true;`;
  return replaceOnce(source, anchor, replacement, "objective writing placeholder");
});

patchFile(new URL("../src/utils/answerKeyNormalizer.js", import.meta.url), (source) => {
  source = replaceOnce(
    source,
    '  const level = inferLevelFromAssignment(assignmentKey);\n  const format = String(sourceEntry.format || "objective").toLowerCase();\n  const rawAnswers = sourceEntry.answers || {};',
    '  const level = inferLevelFromAssignment(assignmentKey);\n  const rawAnswers = sourceEntry.answers || {};\n  const placeholderValues = flattenPlainAnswers(rawAnswers).map((entry) => String(entry.value || "").trim().toLowerCase());\n  const placeholderWriting = placeholderValues.length > 0 && placeholderValues.every((value) => /^(read|see|check) (the )?(comment|comments|instructions?)( for (the )?answers?)?$/.test(value));\n  const format = String(sourceEntry.format || (placeholderWriting ? "writing" : "objective")).toLowerCase();',
    "answer-key placeholder format",
  );
  source = replaceOnce(
    source,
    '  const writingParts = explicitWritingParts.length ? explicitWritingParts : (isA2OrB1 ? ["teil2"] : []);',
    '  const writingParts = explicitWritingParts.length ? explicitWritingParts : (placeholderWriting ? ["main"] : (isA2OrB1 ? ["teil2"] : []));',
    "answer-key placeholder writing part",
  );
  return source;
});

patchFile(new URL("../src/utils/naturalMarkingFeedback.js", import.meta.url), (source) => {
  source = replaceOnce(
    source,
    'export function assignmentHasScoredWriting(referenceEntry = {}) {\n  const writingParts = [',
    `export function assignmentHasScoredWriting(referenceEntry = {}) {\n  const rawAnswers = referenceEntry.rawAnswers || referenceEntry.answers || {};\n  const answerValues = Object.values(rawAnswers).map((value) => String(value || "").trim().toLowerCase());\n  if (${placeholderExpression}) return true;\n\n  const writingParts = [`,
    "feedback placeholder writing classification",
  );
  source = replaceOnce(
    source,
    '  if (writingParts.includes("teil2")) return true;',
    '  if (writingParts.includes("teil2") || writingParts.includes("main")) return true;',
    "main writing registration",
  );
  return source;
});

console.log("Placeholder-only answer keys are treated as AI-graded writing and never as objective questions.");
