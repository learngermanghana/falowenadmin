export const A2_REQUIRED_WRITING_ASSIGNMENTS = Object.freeze([
  "A2-1.1", "A2-1.3", "A2-2.4", "A2-3.6", "A2-3.7", "A2-4.9",
  "A2-4.10", "A2-5.12", "A2-5.13", "A2-6.15", "A2-6.16", "A2-7.18",
  "A2-7.20", "A2-8.21", "A2-8.22", "A2-9.24", "A2-10.26", "A2-10.28",
]);

export const A2_NO_WRITING_ASSIGNMENTS = Object.freeze([
  "A2-1.2", "A2-2.5", "A2-3.8", "A2-4.11", "A2-5.14", "A2-6.17",
  "A2-7.19", "A2-9.23", "A2-9.25", "A2-10.27",
]);

export const B1_REQUIRED_WRITING_ASSIGNMENTS = Object.freeze([
  "B1-1.1", "B1-1.3", "B1-2.4", "B1-2.6", "B1-3.8", "B1-3.9",
  "B1-4.12", "B1-4.13", "B1-5.14", "B1-5.16", "B1-6.18", "B1-6.20",
  "B1-7.21", "B1-7.23", "B1-8.24", "B1-9.26", "B1-10.27", "B1-10.28",
]);

export const B1_NO_WRITING_ASSIGNMENTS = Object.freeze([
  "B1-1.2", "B1-2.5", "B1-3.7", "B1-4.10", "B1-4.11",
  "B1-5.15", "B1-5.17", "B1-6.19", "B1-7.22", "B1-8.25",
]);

const REQUIRED = Object.freeze({
  A2: new Set(A2_REQUIRED_WRITING_ASSIGNMENTS),
  B1: new Set(B1_REQUIRED_WRITING_ASSIGNMENTS),
});

const NOT_REQUIRED = Object.freeze({
  A2: new Set(A2_NO_WRITING_ASSIGNMENTS),
  B1: new Set(B1_NO_WRITING_ASSIGNMENTS),
});

const normalizeAssignmentId = (value = "") => {
  const source = String(value || "").trim().toUpperCase();
  const match = source.match(/\b(A2|B1)-\d+(?:\.\d+)?\b/);
  return match?.[0] || "";
};

const normalizeLevel = (...values) => {
  for (const value of values) {
    const match = String(value || "").trim().toUpperCase().match(/\b(A2|B1)\b|^(A2|B1)[-_.]/);
    const level = match?.[1] || match?.[2];
    if (level) return level;
  }
  return "";
};

export function getA2B1WritingRequirement({
  level = "",
  assignmentId = "",
  assignmentKey = "",
} = {}) {
  const normalizedAssignment = normalizeAssignmentId(assignmentId || assignmentKey || level);
  const normalizedLevel = normalizeLevel(level, normalizedAssignment, assignmentId, assignmentKey);
  if (!["A2", "B1"].includes(normalizedLevel) || !normalizedAssignment) return null;

  if (REQUIRED[normalizedLevel].has(normalizedAssignment)) return true;
  if (NOT_REQUIRED[normalizedLevel].has(normalizedAssignment)) return false;
  return null;
}

const normalizedPartIds = (value) =>
  (Array.isArray(value) ? value : [])
    .map((part) => String(part || "").trim().toLowerCase().replace(/[\s_-]+/g, ""))
    .filter(Boolean);

export function getReferenceWritingRequirement(referenceEntry = null) {
  if (!referenceEntry || typeof referenceEntry !== "object") return null;

  const hasWritingPartsDeclaration = Object.prototype.hasOwnProperty.call(referenceEntry, "writingParts")
    || Object.prototype.hasOwnProperty.call(referenceEntry, "writing_parts");
  const hasAiPartsDeclaration = Object.prototype.hasOwnProperty.call(referenceEntry, "aiGradedParts")
    || Object.prototype.hasOwnProperty.call(referenceEntry, "ai_graded_parts");
  const hasExpectedPartsDeclaration = Object.prototype.hasOwnProperty.call(referenceEntry, "expectedParts")
    || Object.prototype.hasOwnProperty.call(referenceEntry, "expected_parts");

  const writingParts = normalizedPartIds(referenceEntry.writingParts || referenceEntry.writing_parts);
  const aiParts = normalizedPartIds(referenceEntry.aiGradedParts || referenceEntry.ai_graded_parts);
  const expectedParts = normalizedPartIds(referenceEntry.expectedParts || referenceEntry.expected_parts);
  const writingDeclared = writingParts.includes("teil2") || aiParts.includes("teil2");

  if (writingDeclared) return true;

  const partGrading = referenceEntry.partGrading || referenceEntry.part_grading || {};
  const gradingDeclaresWriting = Object.entries(partGrading).some(([partId, grading]) => {
    const normalizedPart = String(partId || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (normalizedPart !== "teil2") return false;
    return /(?:ai[_ -]?written[_ -]?response|writing|schreiben)/i.test(
      `${grading?.gradingMode || grading?.mode || ""} ${grading?.label || ""}`,
    );
  });
  if (gradingDeclaresWriting) return true;

  if (
    hasWritingPartsDeclaration
    && hasAiPartsDeclaration
    && hasExpectedPartsDeclaration
    && writingParts.length === 0
    && aiParts.length === 0
    && !expectedParts.includes("teil2")
  ) {
    return false;
  }

  return null;
}

export function resolveA2B1WritingRequirement({
  level = "",
  assignmentId = "",
  assignmentKey = "",
  referenceEntry = null,
} = {}) {
  if (referenceEntry && typeof referenceEntry === "object") {
    // The loaded answer-key entry is authoritative for marking. If it explicitly
    // declares the current workbook parts, do not let older semantic task specs
    // or teaching-slide metadata add Schreiben back to an objective-only day.
    return getReferenceWritingRequirement(referenceEntry);
  }
  return getA2B1WritingRequirement({ level, assignmentId, assignmentKey });
}
