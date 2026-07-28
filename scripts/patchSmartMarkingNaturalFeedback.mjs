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
  const referenceEntry = options.referenceEntry || {};
  const protectedResult = enforceRegisteredWritingScore(result, referenceEntry);
  const feedbackInput = {
    ...protectedResult,
    level: protectedResult.level || referenceEntry.level || options.submission?.level || options.level || "",
    assignmentKey: protectedResult.assignmentKey || referenceEntry.assignmentKey || options.submission?.assignmentKey || options.submission?.assignmentId || "",
    previousFeedback: protectedResult.previousFeedback || options.submission?.previousFeedback || options.submission?.feedback || "",
    hasRegisteredWriting: assignmentHasScoredWriting(referenceEntry),
  };
  const studentComment = buildNaturalStudentFeedback(feedbackInput, submissionText);
  if (!studentComment) return protectedResult;

  return {
    ...protectedResult,
    aiDetailedFeedback: protectedResult.aiDetailedFeedback || protectedResult.feedback || "",
    feedback: studentComment,
    improvementSummary: studentComment,
  };
}

`;

const helperStart = source.indexOf("function applyNaturalStudentFeedback(");
const examinerAnchor = "async function requestSecondExaminer(options = {}) {";
const examinerStart = source.indexOf(examinerAnchor);
if (examinerStart < 0) throw new Error("markingService helper anchor changed; update patchSmartMarkingNaturalFeedback.mjs");
if (helperStart >= 0) {
  source = `${source.slice(0, helperStart)}${helper}${source.slice(examinerStart)}`;
} else {
  source = source.replace(examinerAnchor, `${helper}${examinerAnchor}`);
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

function replacePageOnce(pageSource, search, replacement, label) {
  if (pageSource.includes(replacement)) return pageSource;
  if (!pageSource.includes(search)) throw new Error(`MarkingPage deterministic feedback anchor changed: ${label}`);
  return pageSource.replace(search, replacement);
}

const pageTarget = path.join(root, "src/pages/MarkingPage.jsx");
let pageSource = fs.readFileSync(pageTarget, "utf8");

const reconciliationImport = 'import { reconcileFinalDeterministicFeedback } from "../utils/finalDeterministicFeedback.js";';
if (!pageSource.includes(reconciliationImport)) {
  pageSource = replacePageOnce(
    pageSource,
    'import { calculateFinalScore } from "../utils/finalScore.js";',
    `import { calculateFinalScore } from "../utils/finalScore.js";\n${reconciliationImport}`,
    "reconciliation import",
  );
}

pageSource = replacePageOnce(
  pageSource,
  "function mergeObjectiveScore(result = {}, objectiveResult = {}) {",
  'function mergeObjectiveScore(result = {}, objectiveResult = {}, submissionText = "") {',
  "mergeObjectiveScore signature",
);

pageSource = replacePageOnce(
  pageSource,
  `  return {\n    ...result,\n    score: finalScore,`,
  `  return reconcileFinalDeterministicFeedback({\n    ...result,\n    score: finalScore,`,
  "mergeObjectiveScore reconciliation call",
);

pageSource = replacePageOnce(
  pageSource,
  `    aiOriginalFeedback: result.aiOriginalFeedback ?? result.feedback ?? "",\n  };\n}`,
  `    aiOriginalFeedback: result.aiOriginalFeedback ?? result.feedback ?? "",\n  }, objectiveResult, submissionText);\n}`,
  "mergeObjectiveScore reconciliation close",
);

pageSource = replacePageOnce(
  pageSource,
  "const result = mergeObjectiveScore(aiResult, deterministicObjective);",
  "const result = mergeObjectiveScore(aiResult, deterministicObjective, submissionText);",
  "final deterministic merge input",
);

fs.writeFileSync(pageTarget, pageSource);
console.log("Applied final deterministic feedback reconciliation to MarkingPage.");
