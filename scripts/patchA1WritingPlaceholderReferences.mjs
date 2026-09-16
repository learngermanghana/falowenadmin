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
  source = replaceOnce(source, anchor, replacement, "objective writing placeholder");

  const buildReferenceAnchor = 'function buildReferenceItems(referenceEntry = {}) {\n  if (!referenceEntry || typeof referenceEntry !== "object") return [];\n  const items = [];';
  const buildReferenceReplacement = 'function buildReferenceItems(referenceEntry = {}) {\n  if (!referenceEntry || typeof referenceEntry !== "object") return [];\n  // A writing-only assignment must never turn placeholder metadata into an objective question.\n  if (String(referenceEntry.format || "").trim().toLowerCase() === "writing") return [];\n  const declaredReferenceParts = referenceEntry.referenceAnswerParts ?? referenceEntry.reference_answer_parts;\n  const declaredWritingParts = referenceEntry.writingParts ?? referenceEntry.writing_parts;\n  if (Array.isArray(declaredReferenceParts) && declaredReferenceParts.length === 0 && Array.isArray(declaredWritingParts) && declaredWritingParts.length > 0) return [];\n  const items = [];';
  source = replaceOnce(source, buildReferenceAnchor, buildReferenceReplacement, "writing-only objective exclusion");

  const labelledAnswerAnchor = '  const accepted = rawCandidates.flatMap(splitAlternatives).map(normalizeAnswer).filter(Boolean);';
  const labelledAnswerReplacement = `  const labelledAcceptedAnswers = rawCandidates.flatMap((candidate) => {\n    const text = String(candidate || "").trim();\n    if (!text || /^[A-FX]\\s*[).:-]/i.test(text)) return [];\n\n    const labelled = text.match(/^[^:\\n]{2,100}:\\s*(?:'([^']+)'|"([^"]+)"|“([^”]+)”|„([^“]+)“)\\s*$/);\n    const phrase = [labelled?.[1], labelled?.[2], labelled?.[3], labelled?.[4]].find(Boolean)?.trim();\n    if (!phrase) return [];\n\n    const withoutPoliteLeadIn = phrase\n      .replace(/^\\s*(?:entschuldigung|entschuldigen\\s+sie(?:\\s+bitte)?|bitte)\\s*[,;:!.-]?\\s*/i, "")\n      .trim();\n    return [phrase, withoutPoliteLeadIn].filter(Boolean);\n  });\n  const accepted = [...rawCandidates.flatMap(splitAlternatives), ...labelledAcceptedAnswers]\n    .map(normalizeAnswer)\n    .filter(Boolean);`;
  source = replaceOnce(source, labelledAnswerAnchor, labelledAnswerReplacement, "objective labelled reference answers");

  return source;
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
    '  const parts = splitAnswersIntoParts(rawAnswers);\n  const totalAnswers = countPartAnswers(parts);',
    '  // Placeholder text belongs to the writing manifest; it is not a reference answer.\n  const parts = (format === "writing" && placeholderWriting) ? {} : splitAnswersIntoParts(rawAnswers);\n  const totalAnswers = countPartAnswers(parts);',
    "answer-key placeholder part exclusion",
  );
  source = replaceOnce(
    source,
    '  const writingParts = explicitWritingParts.length ? explicitWritingParts : (isA2OrB1 ? ["teil2"] : []);',
    '  const writingParts = explicitWritingParts.length ? explicitWritingParts : (placeholderWriting ? ["main"] : (isA2OrB1 ? ["teil2"] : []));',
    "answer-key placeholder writing part",
  );
  source = replaceOnce(
    source,
    '  const referenceAnswerParts = normalizePartList(\n    sourceEntry.referenceAnswerParts || sourceEntry.reference_answer_parts,\n    Object.keys(parts || {}).filter((partId) => !writingParts.includes(partId) && !excludedParts.includes(partId)),\n  );',
    '  const declaredReferenceAnswerParts = sourceEntry.referenceAnswerParts ?? sourceEntry.reference_answer_parts;\n  const fallbackReferenceAnswerParts = Object.keys(parts || {}).filter((partId) => !writingParts.includes(partId) && !excludedParts.includes(partId));\n  // An explicit [] means “there are no objective reference parts”; do not replace it with a fallback main part.\n  const referenceAnswerParts = Array.isArray(declaredReferenceAnswerParts)\n    ? normalizePartList(declaredReferenceAnswerParts)\n    : normalizePartList(declaredReferenceAnswerParts, fallbackReferenceAnswerParts);',
    "explicit empty reference parts",
  );
  source = replaceOnce(
    source,
    '    .filter((entry) => entry.assignmentKey && entry.totalAnswers > 0);',
    '    .filter((entry) => entry.assignmentKey && (entry.totalAnswers > 0 || entry.writingParts?.length > 0));',
    "keep writing-only registry entries",
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
  const currentWritingRegistration = '  if (writingParts.includes("teil2") || writingParts.includes("main")) return true;';
  const legacyWritingRegistration = '  if (writingParts.includes("teil2")) return true;';
  const writingRegistration = '  if (writingParts.includes("teil1") || writingParts.includes("teil2") || writingParts.includes("main")) return true;';
  if (!source.includes(writingRegistration)) {
    if (source.includes(currentWritingRegistration)) source = source.replace(currentWritingRegistration, writingRegistration);
    else source = replaceOnce(source, legacyWritingRegistration, writingRegistration, "A1 multi-part writing registration");
  }
  return source;
});

patchFile(new URL("../src/utils/autoMarking.js", import.meta.url), (source) => {
  source = replaceOnce(
    source,
    'function extractObjectiveEntries(referenceAnswers = {}, path = []) {\n  if (typeof referenceAnswers === "string") {',
    `function isPlaceholderReferenceValue(value = "") {\n  return /^(read|see|check) (the )?(comment|comments|instructions?)( for (the )?answers?)?$/.test(String(value || "").trim().toLowerCase());\n}\n\nfunction extractObjectiveEntries(referenceAnswers = {}, path = []) {\n  if (typeof referenceAnswers === "string") {\n    if (isPlaceholderReferenceValue(referenceAnswers)) return [];`,
    "auto marking placeholder exclusion",
  );
  source = replaceOnce(
    source,
    '  if (typeof referenceAnswers === "number" || typeof referenceAnswers === "boolean") {',
    '  if (typeof referenceAnswers === "number" || typeof referenceAnswers === "boolean") {',
    "auto marking numeric anchor",
  );
  return source;
});

patchFile(new URL("../src/pages/MarkingPage.jsx", import.meta.url), (source) => {
  source = replaceOnce(
    source,
    '      const deterministicAssignmentId = getObjectiveAssignmentId(\n        registryEntry?.assignmentKey,',
    '      // The checked-in dictionary is the canonical curriculum manifest. If Firestore still has an older\n      // A1 writing record, do not let that stale registry turn the placeholder answer into an objective question.\n      const localWritingOnlyReference = String(referenceEntry?.format || "").trim().toLowerCase() === "writing";\n      if (localWritingOnlyReference) {\n        const localAssignmentKey = getObjectiveAssignmentId(\n          referenceEntry?.assignment_id,\n          referenceEntry?.assignmentId,\n          assignmentIdValue,\n          selectedSubmission?.assignmentKey,\n          selectedSubmission?.assignmentId,\n        );\n        registryEntry = {\n          ...(registryEntry || {}),\n          ...referenceEntry,\n          assignmentKey: localAssignmentKey || registryEntry?.assignmentKey || "",\n          assignmentId: localAssignmentKey || referenceEntry?.assignment_id || referenceEntry?.assignmentId || "",\n          rawAnswers: referenceEntry?.answers || referenceEntry?.rawAnswers || {},\n          answers: referenceEntry?.answers || referenceEntry?.rawAnswers || {},\n          format: "writing",\n          writingParts: referenceEntry?.writingParts || referenceEntry?.expectedParts || ["main"],\n          aiGradedParts: referenceEntry?.aiGradedParts || referenceEntry?.writingParts || referenceEntry?.expectedParts || ["main"],\n          referenceAnswerParts: [],\n        };\n      }\n\n      const deterministicAssignmentId = getObjectiveAssignmentId(\n        registryEntry?.assignmentKey,',
    "Marking page local writing manifest override",
  );
  source = replaceOnce(
    source,
    '      const deterministicObjective = computeObjectiveScore(deterministicAssignmentId, submissionText);',
    '      const deterministicObjective = computeObjectiveScore(localWritingOnlyReference ? registryEntry : deterministicAssignmentId, submissionText);',
    "Marking page writing-only deterministic score",
  );
  return source;
});

patchFile(new URL("../api/router.js", import.meta.url), (source) => {
  source = replaceOnce(
    source,
    'function flattenPlainAnswers(value, prefix = []) {\n  if (Array.isArray(value)) {',
    `function isPlaceholderReferenceValue(value = "") {\n  return /^(read|see|check) (the )?(comment|comments|instructions?)( for (the )?answers?)?$/.test(String(value || "").trim().toLowerCase());\n}\n\nfunction flattenPlainAnswers(value, prefix = []) {\n  if (Array.isArray(value)) {`,
    "router placeholder helper",
  );
  source = replaceOnce(
    source,
    '  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {\n    return [{ key: prefix.join(".") || `Answer${prefix[prefix.length - 1] || 1}`, value: String(value) }];\n  }',
    '  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {\n    if (typeof value === "string" && isPlaceholderReferenceValue(value)) return [];\n    return [{ key: prefix.join(".") || `Answer${prefix[prefix.length - 1] || 1}`, value: String(value) }];\n  }',
    "router placeholder exclusion",
  );
  return source;
});

console.log("Writing-only answer keys stay writing-only from dictionary normalization through MarkingPage, even when Firestore has stale objective metadata.");
