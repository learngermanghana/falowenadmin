import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const oldLine = '  return normalizedPartId === "teil2" && Array.isArray(referenceEntry.expectedParts) && referenceEntry.expectedParts.length > 1;';
const replacement = `  const aiGradedParts = referenceEntry.aiGradedParts || referenceEntry.ai_graded_parts || [];
  if (Array.isArray(aiGradedParts) && aiGradedParts.map(normalizePartId).includes(normalizedPartId)) return true;

  const referenceAnswerParts = referenceEntry.referenceAnswerParts || referenceEntry.reference_answer_parts || [];
  const normalizedReferenceAnswerParts = Array.isArray(referenceAnswerParts) ? referenceAnswerParts.map(normalizePartId) : [];
  if (grading?.hasReferenceAnswers === true || normalizedReferenceAnswerParts.includes(normalizedPartId)) return false;

  const expectedParts = referenceEntry.expectedParts || referenceEntry.expected_parts || [];
  const normalizedExpectedParts = Array.isArray(expectedParts) ? expectedParts.map(normalizePartId) : [];
  const level = String(referenceEntry.level || referenceEntry.assignmentKey || referenceEntry.assignment_id || referenceEntry.assignmentId || "").toUpperCase();
  const legacyWritingPart = /^(A2|B1)(?:\\b|-)/.test(level)
    && normalizedPartId === "teil2"
    && normalizedExpectedParts.includes(normalizedPartId)
    && normalizedReferenceAnswerParts.length > 0
    && !normalizedReferenceAnswerParts.includes(normalizedPartId);

  return legacyWritingPart;`;

if (source.includes(oldLine)) {
  source = source.replace(oldLine, replacement);
} else if (!source.includes("const aiGradedParts = referenceEntry.aiGradedParts")) {
  throw new Error("objectiveMarking writing-part fallback changed; update patchObjectiveWritingPartDetection.mjs");
}

fs.writeFileSync(target, source);
console.log("Objective marking now distinguishes real writing parts from objective Teil 2 sections.");
