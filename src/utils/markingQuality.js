import { verifiedObjectiveMetadata } from "./markingReview.js";
import { plainObjectiveAnswer, stripMarkingEmojis } from "./markingFeedbackText.js";
import { withResubmissionComparison } from "./resubmissionFeedback.js";
import { dedupeRepeatedFeedback } from "./feedbackPolicy.js";

const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
const percent = (value) => value === null || value === undefined || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;

function currentWritingScore(result = {}) {
  return percent(result.writingScorePercent ?? result.writingScore);
}

function normalizeWritingScoreClaim(feedback = "", result = {}) {
  const writing = currentWritingScore(result);
  if (writing === null) return String(feedback || "");
  return String(feedback || "").replace(
    /\bWriting score:\s*\d+(?:\.\d+)?\s*%/gi,
    `Writing score: ${Math.round(writing)}%`,
  );
}

function compactWrongQuestionSummary(rows = []) {
  const groups = new Map();
  rows.forEach(([question, row]) => {
    const part = String(row?.partId || question.match(/^(teil\s*\d+)/i)?.[1] || "Objective")
      .replace(/^teil/i, "Teil ")
      .replace(/\s+/g, " ")
      .trim();
    const number = String(question).match(/(\d+)(?!.*\d)/)?.[1] || String(question);
    const current = groups.get(part) || [];
    current.push(number);
    groups.set(part, current);
  });
  const pieces = [...groups.entries()].map(([part, questions]) => {
    const unique = [...new Set(questions)];
    return `${part} question${unique.length === 1 ? "" : "s"} ${unique.join(", ")}`;
  });
  return pieces.length ? `Review ${pieces.join("; ")}.` : "";
}

export function exactObjectiveFeedback(objective, wordTarget = 40) {
  const rows = Object.entries(objective.details || {});
  const summary = [];
  const partIds = [...new Set(rows.map(([, row]) => row.partId || "Objective"))];
  for (const part of partIds) {
    const answers = rows.filter(([, row]) => (row.partId || "Objective") === part);
    summary.push(`${part.replace(/^teil/i, "Teil ")}: ${answers.filter(([, row]) => row.correct).length}/${answers.length} correct.`);
  }
  const wrong = rows.filter(([, row]) => !row.correct);
  const intro = summary.join(" ") || `${objective.correctCount}/${objective.totalCount} correct.`;
  if (!wrong.length) return `${intro} All objective answers are correct.`;

  const corrections = wrong.map(([question, row]) => ({
    question,
    row,
    text: `${question}: your answer ${plainObjectiveAnswer(row.student, "was missing")}; correct answer ${plainObjectiveAnswer(row.expectedDisplay || row.expected || row.rawExpected)}.`,
  }));
  const limit = Number(wordTarget) || Infinity;
  const selected = [];

  for (let index = 0; index < corrections.length; index += 1) {
    const candidate = corrections[index];
    const remaining = corrections.slice(index + 1).map((item) => [item.question, item.row]);
    const fallback = compactWrongQuestionSummary(remaining);
    const nextText = [intro, ...selected.map((item) => item.text), candidate.text, fallback].filter(Boolean).join(" ");
    if (nextText.split(/\s+/).length > limit) break;
    selected.push(candidate);
  }

  const selectedKeys = new Set(selected.map((item) => item.question));
  const remaining = wrong.filter(([question]) => !selectedKeys.has(question));
  const compactRemaining = compactWrongQuestionSummary(remaining);
  return [intro, ...selected.map((item) => item.text), compactRemaining].filter(Boolean).join(" ").trim();
}

export function markingConsistencyWarnings(result, submission = {}, calculatedScore = null) {
  const warnings = [];
  const feedback = normalize(result.feedback);
  const text = normalize(submission.text);
  const details = Object.values(result.objectiveDetails || {});
  const objectiveWrong = details.filter((row) => row.correct === false);
  const mentionsWrongObjective = /(?:lesen|hören|horen|listening|reading|objective)[^.\n]{0,70}(?:wrong|incorrect|mistake|error)|(?:wrong|incorrect)[^.\n]{0,40}(?:lesen|hören|horen|listening|reading|objective)/i.test(feedback);
  if (details.length && !objectiveWrong.length && mentionsWrongObjective) warnings.push("Feedback claims objective mistakes, but every objective answer matches the key.");
  if (objectiveWrong.length && /all (?:objective )?answers (?:are|were) correct/i.test(feedback)) warnings.push("Feedback says all answers are correct, but the comparison contains incorrect or missing answers.");
  const expected = normalize(submission.assignmentId || submission.assignmentKey);
  const actual = normalize(result.assignmentKey || result.assignmentId);
  if (expected && actual && expected !== actual) warnings.push("The marked assignment does not match the selected submission.");
  const evidence = Array.isArray(result.taskPointEvidence) ? result.taskPointEvidence : [];
  for (const item of evidence) {
    const fragments = String(item.evidence || "")
      .split(/\s*\|\s*/)
      .map((value) => normalize(value))
      .filter(Boolean);
    const allEvidencePresent = fragments.length > 0 && fragments.every((fragment) => text.includes(fragment));
    if (fragments.length && !allEvidencePresent) warnings.push(`Task evidence for “${item.label}” cannot be found in this submission.`);
    if (item.status === "missing" && allEvidencePresent) warnings.push(`“${item.label}” is marked missing but has supporting text. Check whether that text fulfils the point.`);
  }
  if (evidence.length && evidence.every((item) => item.status === "met") && /missing (?:required )?(?:task|content) point|(?:task|content) point[^.]{0,30}(?:missing|not addressed)/i.test(feedback)) warnings.push("Feedback claims a missing task point, but all task points are marked met.");
  for (const correction of result.corrections || []) {
    if (typeof correction === "object" && correction.from && !text.includes(normalize(correction.from))) warnings.push(`The quoted correction “${correction.from}” is not present in the submitted work.`);
  }
  const writing = percent(result.writingScorePercent ?? result.writingScore);
  if (writing !== null && !evidence.length) warnings.push("The writing score has no task-point evidence. Review it against the actual writing prompt.");
  if (writing !== null && writing < 60 && evidence.length && evidence.every((item) => item.status === "met") && /minor|spelling|punctuation|capitalisation|capitalization/i.test(feedback) && !/unclear|unintelligible|word order|incomplete|grammar|off.topic/i.test(feedback)) warnings.push("The low writing score is explained only by minor corrections despite all task points being met. Review the deductions at this student’s level.");
  const calculated = percent(calculatedScore);
  if (calculated !== null && percent(result.finalScore) !== null && Math.abs(calculated - Number(result.finalScore)) > 0.5) warnings.push(`The final score differs from the calculated score of ${calculated}. Review the override.`);
  const claimed = feedback.match(/(?:final|overall) score\s*:?\s*(\d+(?:\.\d+)?)/);
  if (claimed && percent(result.finalScore) !== null && Number(claimed[1]) !== Number(result.finalScore)) warnings.push("The final score written in the feedback differs from the score being saved.");
  return [...new Set(warnings)];
}

export function reconcileMarkingQuality(result, objective, submission = {}, { writingExpected = false, wordTarget = 40 } = {}) {
  const objectiveSentences = /(?:lesen|hören|horen|hoeren|listening|reading|objective|teil\s*[34])\b/i;
  const writingFeedback = stripMarkingEmojis(result.feedback).split(/(?<=[.!?])\s+/).filter((sentence) => !(objectiveSentences.test(sentence) && /answer|question|score|correct|wrong|mistake|error|\d+\s*\//i.test(sentence))).join(" ");
  const objectiveFeedback = objective.totalCount > 0 ? exactObjectiveFeedback(objective, wordTarget) : "";
  const metadata = verifiedObjectiveMetadata(writingExpected ? result : {}, objective);
  const feedback = writingExpected ? [writingFeedback, objectiveFeedback].filter(Boolean).join("\n\n") : objectiveFeedback;
  const scoreAlignedFeedback = normalizeWritingScoreClaim(feedback || result.feedback, { ...result, ...metadata })
    .replace(/\bMarking summary\b\s*[:.-]?\s*/gi, "")
    .replace(/\bScore summary\b\s*[:.-]?\s*/gi, "");
  const normalizedFeedback = dedupeRepeatedFeedback(stripMarkingEmojis(scoreAlignedFeedback));
  let updated = {
    ...result, ...metadata,
    ...(!writingExpected ? { writingScore: null, writingScorePercent: null, taskPointEvidence: [], corrections: [] } : {}),
    feedback: normalizedFeedback,
    improvementSummary: normalizedFeedback,
  };
  const warnings = markingConsistencyWarnings(updated, submission);
  updated = withResubmissionComparison(updated, submission);
  return { ...updated, ...(submission.previousSubmissionText ? { writingRevisionComparison: compareWritingRevisions(submission.previousSubmissionText, submission.text) } : {}), consistencyWarnings: warnings, shouldSendAutomatically: false, ...(warnings.length ? { status: "needs_review" } : {}) };
}

export function compareWritingRevisions(previousText, currentText) {
  const sentences = (text) => String(text || "").split(/\n\s*(?:teil|part)\s*[34]\b/i)[0]
    .split(/(?<=[.!?])\s+|\n+/).map((line) => line.trim())
    .filter((line) => line && !/^(?:teil|part)\s*\d\b|^\d+[.)]\s*[A-F]\s*$/i.test(line));
  const previous = sentences(previousText);
  const current = sentences(currentText);
  return {
    changed: normalize(previous.join(" ")) !== normalize(current.join(" ")),
    removed: previous.filter((line) => !current.some((value) => normalize(value) === normalize(line))).slice(0, 3),
    added: current.filter((line) => !previous.some((value) => normalize(value) === normalize(line))).slice(0, 3),
  };
}

export function verifiedObjectiveZero(result = {}) {
  const details = Object.values(result.objectiveDetails || {});
  return Number(result.finalScore ?? result.score) === 0 && Number(result.objectiveTotal) > 0
    && details.length === Number(result.objectiveTotal) && Number(result.objectiveCorrect) === 0
    && details.every((row) => row.correct === false)
    && percent(result.writingScorePercent ?? result.writingScore) === null;
}
