import { allowsConnectorAssessment } from "./a1ConnectorPolicy.js";
import { verifiedObjectiveMetadata, writingPercentFromResult } from "./markingReview.js";
import { plainObjectiveAnswer, stripMarkingEmojis } from "./markingFeedbackText.js";
import { withResubmissionComparison } from "./resubmissionFeedback.js";
import { dedupeRepeatedFeedback } from "./feedbackPolicy.js";
import { groundedA1WritingCorrections, objectiveLanguageCorrections, languageFeedbackSentence } from "./groundedLanguageCorrections.js";
import { buildEvidenceEssayFeedback } from "./essayFeedbackEvidence.js";

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
      .replace(/^main$/i, "Objective")
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
    const label = /^main$/i.test(part) ? "Objective" : part.replace(/^teil/i, "Teil ");
    summary.push(`${label}: ${answers.filter(([, row]) => row.correct).length}/${answers.length} correct.`);
  }
  const wrong = rows.filter(([, row]) => !row.correct);
  const intro = summary.join(" ") || `${objective.correctCount}/${objective.totalCount} correct.`;
  if (!wrong.length) return `${intro} All objective answers are correct.`;

  const corrections = wrong.map(([question, row]) => ({
    question,
    row,
    text: `${question}: your answer ${plainObjectiveAnswer(row.student, "was missing")}; correct answer ${plainObjectiveAnswer(row.expectedDisplay || row.expected || row.rawExpected).replace(/[.!?]+$/, "")}.`,
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

function repairSalutationCapitalizationAdvice(value = "", submissionText = "") {
  const lines = String(submissionText || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const salutationIndex = lines.findIndex((line) => /^Sehr geehrte(?:r|n)?\b/i.test(line));
  if (salutationIndex < 0 || !lines[salutationIndex + 1]) return value;
  const opening = lines[salutationIndex + 1];
  return String(value || "").replace(
    /(?:Review exact wording:\s*)?Write\s+[“"]([^”"]{3,200})[”"]\s+instead of\s+[“"]([^”"]{3,200})[”"]\.?/gi,
    (match, corrected, submitted) => {
      const caseOnly = corrected.length === submitted.length
        && corrected[0] === submitted[0].toLocaleUpperCase("de")
        && corrected.slice(1) === submitted.slice(1)
        && corrected[0] !== submitted[0];
      if (!caseOnly || !opening.toLocaleLowerCase("de").startsWith(submitted.toLocaleLowerCase("de"))) return match;
      // After a formal email greeting the next line begins lowercase when
      // the greeting is followed by a comma. Repair the missing comma instead.
      return /,$/.test(lines[salutationIndex]) ? "" : "Add a comma after the formal salutation.";
    },
  );
}

function recoverThinWritingFeedback(original = "", result = {}, submission = {}, assignmentKey = "", level = "") {
  const current = String(original || "").trim();
  const content = String(submission.text || "").trim();
  const writingOnly = content.split(/(?:^|\n)\s*(?:teil|part)\s*[34]\b/i)[0];
  const currentWords = current.split(/\s+/).filter(Boolean).length;
  const writingWords = writingOnly.split(/\s+/).filter(Boolean).length;
  const targetLevel = String(level || "").toUpperCase();
  if (!["A2", "B1"].includes(targetLevel) || writingWords < 35 || currentWords >= 32) return current;

  // Keep genuine, specific corrections. Only reconstruct examiner comments that
  // contain little beyond greeting/connector praise or an unspecific summary.
  const hasCorrection = /\b(?:correct|revise|replace|instead of|write [“"]|use [“"]|add a comma|check verb|word order)\b/i.test(current);
  if (hasCorrection && currentWords >= 12) return current;
  const overlyThin = currentWords < 18
    || /\b(?:greeting|connector|well organi[sz]ed|well structured)\b/i.test(current);
  if (!overlyThin) return current;

  const notGreetingPraise = (item) => !/\b(?:greeting|connector|salutation)\b/i.test(String(item || ""));
  const safeStrengths = (value) => Array.isArray(value)
    ? value.filter(notGreetingPraise)
    : notGreetingPraise(value) && value ? [value] : [];
  const rich = buildEvidenceEssayFeedback({
    result: {
      ...result,
      assignmentKey: result.assignmentKey || assignmentKey,
      level: targetLevel,
      writingStrengths: safeStrengths(result.writingStrengths),
      strengths: safeStrengths(result.strengths),
      feedback: "",
      improvementSummary: "",
      aiDetailedFeedback: "",
      aiOriginalFeedback: "",
      ai: {
        ...(result.ai || {}),
        writingStrengths: safeStrengths(result.ai?.writingStrengths),
        strengths: safeStrengths(result.ai?.strengths),
        originalFeedback: "",
        detailedFeedback: "",
      },
    },
    submissionText: content,
    forceContextDepth: true,
  });
  const richWords = rich.split(/\s+/).filter(Boolean).length;
  return richWords >= 32 && richWords >= currentWords + 10 ? rich : current;
}

export function reconcileMarkingQuality(result, objective, submission = {}, { writingExpected = false, wordTarget = 40 } = {}) {
  const level = result.level || submission.level || String(submission.assignmentId || result.assignmentKey || "").split("-")[0];
  const assignmentKey = submission.assignmentId || submission.assignmentKey || result.assignmentKey;
  const assessConnectors = allowsConnectorAssessment(level, assignmentKey);
  // Keep writing prose; replace the model's objective block as one unit so
  // decimal question numbers and slash-separated answers cannot leave fragments.
  let writingFeedback = repairSalutationCapitalizationAdvice(stripMarkingEmojis(result.feedback), submission.text)
    .replace(/\bWriting score\s*:\s*\d+(?:\.\d+)?\s*%[.]?/gi, "")
    .replace(/\bMarking summary\b[\s\S]*$/i, "")
    // "main" is an internal flat-objective part key, not a student-facing
    // section. Discard an AI-generated "main: N/N correct" block; the
    // deterministic objective summary is appended below with its real label.
    .replace(/\b(?:Teil\s*[134]|objective|main|listening|reading|hören|horen)\s*(?:score|:|answers?)[\s\S]*$/i, "")
    .trim();
  writingFeedback = writingFeedback.split(/(?<=[.!?])\s+/)
    .filter((sentence) => !/\b(?:objective|listening|reading|hören|horen)\b.*(?:wrong|correct|mistake|error)/i.test(sentence))
    .filter((sentence) => assessConnectors || !/\bconnectors?\b|linking words|linking phrases/i.test(sentence))
    .join(" ").trim();
  // Student-facing output is one concise paragraph: personalised writing first,
  // verified objective scores second. The detailed corrections stay in structured fields.
  writingFeedback = writingFeedback
    // Remove assigned exercises, but retain instructional corrections such as
    // "Next step: check the verb position in subordinate clauses."
    .replace(/\b(?:Next practice|Practice next|Your next exercise|Next step)\s*[:–-]\s*(?:(?:Please\s+)?(?:write|compose|draft|create|complete|do|try|practise|practice)\b)[^.?!]*(?:[.?!]|$)/gi, "")
    .replace(/\s+/g, " ").trim();
  if (writingExpected) {
    writingFeedback = recoverThinWritingFeedback(writingFeedback, result, submission, assignmentKey, level);
  }
  const objectiveFeedback = objective.totalCount > 0 ? exactObjectiveFeedback(objective, 22) : "";
  // Correct meaning does not imply perfect spelling. Keep the objective score
  // authoritative while reporting verifiable language issues separately.
  const objectiveLanguageNotes = objectiveLanguageCorrections(objective, { level });
  const sourceText = String(submission.text || "");
  const groundedWriting = writingExpected ? groundedA1WritingCorrections(sourceText, { level }) : [];
  const modelWriting = writingExpected && Array.isArray(result.corrections) ? result.corrections.filter((item) =>
    item && typeof item === "object"
    && String(item.from || "").trim() && String(item.to || "").trim()
    && sourceText.toLocaleLowerCase("de").includes(String(item.from).trim().toLocaleLowerCase("de"))
    && !/^(?:teil[134]|main)$/i.test(String(item.partId || item.part || ""))
  ) : [];
  const writingCorrections = [...modelWriting];
  for (const correction of groundedWriting) {
    if (!writingCorrections.some((item) => String(item.from).toLocaleLowerCase("de") === correction.from.toLocaleLowerCase("de"))) {
      writingCorrections.push(correction);
    }
  }
  const languageAccuracyNotes = [
    ...objectiveLanguageNotes.slice(0, 2).map((item) => languageFeedbackSentence(item, { objective: true })),
    ...writingCorrections.filter((item) => item.reason && item.to).slice(0, 3)
      .map((item) => languageFeedbackSentence(item)),
  ];
  const novelLanguageNotes = languageAccuracyNotes.filter((note) => {
    const quoted = [...note.matchAll(/“([^”]+)”/g)].map((match) => match[1]);
    return !quoted.length || !quoted.every((phrase) => writingFeedback.toLocaleLowerCase("de").includes(phrase.toLocaleLowerCase("de")));
  });
  // Never drop a valid correction just because it happens to be sentence five.
  // The AI is prompted to keep its writing comment concise; objective scoring
  // is appended from verified answers and is never inferred from that prose.
  const feedback = [writingExpected ? writingFeedback : "", objectiveFeedback, ...novelLanguageNotes].filter(Boolean).join(" ").trim();
  const metadata = verifiedObjectiveMetadata(writingExpected ? result : {}, objective);
  const scoreAlignedFeedback = normalizeWritingScoreClaim(feedback || result.feedback, { ...result, ...metadata })
    .replace(/\bMarking summary\b\s*[:.-]?\s*/gi, "")
    .replace(/\bScore summary\b\s*[:.-]?\s*/gi, "");
  const normalizedFeedback = dedupeRepeatedFeedback(stripMarkingEmojis(scoreAlignedFeedback));
  let updated = {
    ...result, ...metadata,
    ...(!writingExpected ? { writingScore: null, writingScorePercent: null, taskPointEvidence: [], corrections: [] } : { corrections: writingCorrections }),
    languageAccuracyNotes, objectiveLanguageCorrections: objectiveLanguageNotes,
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
