import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "src/services/markingService.js");
let source = fs.readFileSync(target, "utf8");

const naturalImport = 'import { assignmentHasScoredWriting, buildNaturalStudentFeedback, enforceRegisteredWritingScore } from "../utils/naturalMarkingFeedback.js";';
if (!source.includes(naturalImport)) {
  const anchor = '} from "../utils/markingIntelligence.js";';
  if (!source.includes(anchor)) throw new Error("markingService import anchor changed; update patchSmartMarkingNaturalFeedback.mjs");
  source = source.replace(anchor, `${anchor}\n${naturalImport}`);
}

const helper = `function applyNaturalStudentFeedback(result = {}, options = {}, submissionText = "") {
  const protectedResult = enforceRegisteredWritingScore(result, options.referenceEntry || {});
  const studentComment = buildNaturalStudentFeedback(protectedResult, submissionText);
  if (!studentComment) return protectedResult;

  return {
    ...protectedResult,
    aiDetailedFeedback: protectedResult.aiDetailedFeedback || protectedResult.feedback || "",
    feedback: studentComment,
    improvementSummary: studentComment,
  };
}

`;

if (!source.includes("function applyNaturalStudentFeedback(")) {
  const anchor = "async function requestSecondExaminer(options = {}) {";
  if (!source.includes(anchor)) throw new Error("markingService helper anchor changed; update patchSmartMarkingNaturalFeedback.mjs");
  source = source.replace(anchor, `${helper}${anchor}`);
}

source = source.replace(
  "let primary = sanitizeMarkingResult(await base.markSubmissionWithAI(preparedOptions));",
  "let primary = applyNaturalStudentFeedback(sanitizeMarkingResult(await base.markSubmissionWithAI(preparedOptions)), options, originalSubmissionText);",
);

source = source.replace(
  "primary = sanitizeMarkingResult(await base.markSubmissionWithAI(preparedOptions));",
  "primary = applyNaturalStudentFeedback(sanitizeMarkingResult(await base.markSubmissionWithAI(preparedOptions)), options, originalSubmissionText);",
);

source = source.replace(
  "primary = routeMissedWritingToReview(primary, originalSubmissionText);",
  "primary = applyNaturalStudentFeedback(routeMissedWritingToReview(primary, originalSubmissionText), options, originalSubmissionText);",
);

source = source.replace(
  "if (isBlockedScore(scoreValueFromResult(primary)) || !hasWritingEvidence(primary)) {",
  "if (isBlockedScore(scoreValueFromResult(primary)) || !assignmentHasScoredWriting(options.referenceEntry || {}) || !hasWritingEvidence(primary)) {",
);

source = source.replace(
  "return mergeSecondExaminer(primary, secondary);",
  "return applyNaturalStudentFeedback(mergeSecondExaminer(primary, secondary), options, originalSubmissionText);",
);

source = source.replace(
  "return mergeSecondExaminer(primary, null, error);",
  "return applyNaturalStudentFeedback(mergeSecondExaminer(primary, null, error), options, originalSubmissionText);",
);

fs.writeFileSync(target, source);
console.log("Applied smart marking natural-feedback/scoring guard patch.");
