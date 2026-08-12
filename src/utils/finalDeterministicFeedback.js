import { heuristicWritingMarker } from "./autoMarking.js";
import { buildNaturalStudentFeedback } from "./naturalMarkingFeedback.js";

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function questionNumber(value, fallback = "") {
  const source = String(value ?? "").trim();
  const multipart = source.match(/^(?:teil|part)\s*[1-4]\s*[._\s-]+(\d+)\s*$/i);
  if (multipart?.[1]) return multipart[1];
  const match = source.match(/\d+/);
  return match?.[0] || String(fallback || "").trim();
}

function detectedLevel(result = {}) {
  const direct = String(result.level || result.detectedLevel || result.ai?.detectedLevel || "").toUpperCase();
  const directMatch = direct.match(/\b(A1|A2|B1)\b/);
  if (directMatch) return directMatch[1];
  const assignment = String(result.assignmentKey || result.assignmentId || result.assignment || "").toUpperCase();
  return assignment.match(/^(A1|A2|B1)[-_.]/)?.[1] || "";
}

function extractWritingBeforeObjectiveAnswers(submissionText = "") {
  const source = String(submissionText || "").trim();
  if (!source) return "";

  const lines = source.split(/\r?\n/);
  let firstObjectiveAnswerLine = -1;
  let consecutiveObjectiveAnswers = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (/^\d{1,2}\s*[.)\-:]?\s*(?:[A-FX]|richtig|falsch)(?:\b|[.)!?;,]|$)/i.test(line)) {
      consecutiveObjectiveAnswers += 1;
      if (consecutiveObjectiveAnswers === 1) firstObjectiveAnswerLine = index;
      if (consecutiveObjectiveAnswers >= 3) break;
    } else if (line && !/^(?:teil|part)\s*$/i.test(line)) {
      consecutiveObjectiveAnswers = 0;
      firstObjectiveAnswerLine = -1;
    }
  }

  if (consecutiveObjectiveAnswers < 3 || firstObjectiveAnswerLine < 0) return "";

  return lines
    .slice(0, firstObjectiveAnswerLine)
    .filter((line) => !/^\s*(?:teil|part)\s*$/i.test(line))
    .join("\n")
    .trim();
}

function looksLikeScorableWriting(text = "") {
  const source = String(text || "").trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length < 30) return false;
  const greeting = /\b(?:lieber|liebe|hallo|guten tag|sehr geehrte|dear|hello|hi)\b/i.test(source);
  const closing = /\b(?:viele grüße|viele gruesse|liebe grüße|liebe gruesse|mit freundlichen grüßen|mit freundlichen gruessen|regards|sincerely|best wishes)\b/i.test(source);
  const sentences = (source.match(/[.!?]/g) || []).length;
  return greeting && closing && sentences >= 3;
}

export function recoverZeroWritingScore(result = {}, submissionText = "") {
  const level = detectedLevel(result);
  if (!/^(A2|B1)$/.test(level)) return result;

  const rawWritingScore = result.writingScorePercent ?? result.writingScore;
  if (Number(rawWritingScore) !== 0) return result;

  const writingText = extractWritingBeforeObjectiveAnswers(submissionText);
  if (!looksLikeScorableWriting(writingText)) return result;

  const recovered = heuristicWritingMarker({ level, partId: "teil2", text: writingText });
  const recoveredWritingScore = numeric(recovered.score, 0);
  if (recoveredWritingScore <= 0) return result;

  const objectiveScore = numeric(result.objectiveScore, NaN);
  const finalScore = Number.isFinite(objectiveScore)
    ? Math.round((objectiveScore + recoveredWritingScore) / 2)
    : recoveredWritingScore;

  return {
    ...result,
    score: finalScore,
    finalScore,
    passed: finalScore >= 60,
    writingScore: recoveredWritingScore,
    writingScorePercent: recoveredWritingScore,
    status: "needs_review",
    shouldSendAutomatically: false,
    ai: {
      ...(result.ai || {}),
      recoveredZeroWritingScore: true,
      recoveredWritingScoreSource: "local-writing-evidence",
      recoveredWritingWordCount: writingText.split(/\s+/).filter(Boolean).length,
    },
  };
}

export function deterministicWrongAnswers(objectiveResult = {}) {
  return Object.entries(objectiveResult.details || {})
    .filter(([, detail]) => detail && detail.correct === false)
    .map(([key, detail]) => ({
      question: questionNumber(detail.questionNumber ?? detail.question ?? key, key),
      partId: String(detail.partId || detail.part || "main").trim() || "main",
      student: detail.student ?? detail.submitted ?? detail.studentAnswer ?? "",
      expected: detail.expected ?? detail.correctAnswer ?? detail.expectedAnswer ?? "",
      correct: false,
    }));
}

export function reconcileFinalDeterministicFeedback(result = {}, objectiveResult = {}, submissionText = "") {
  const objectiveTotal = numeric(objectiveResult.totalCount, 0);
  if (objectiveTotal <= 0) return recoverZeroWritingScore(result, submissionText);

  const objectiveCorrect = Math.max(0, Math.min(objectiveTotal, numeric(objectiveResult.correctCount, 0)));
  const objectiveScore = (objectiveCorrect / objectiveTotal) * 100;
  const objectiveDetails = objectiveResult.details || {};
  const wrongAnswers = deterministicWrongAnswers(objectiveResult);
  const originalFeedback = String(result.feedback || result.improvementSummary || "").trim();

  const reconciled = recoverZeroWritingScore({
    ...result,
    objectiveScore,
    objectiveCorrect,
    objectiveTotal,
    objectiveDetails,
    wrongAnswers,
    aiOriginalFeedback: result.aiOriginalFeedback ?? originalFeedback,
    aiDetailedFeedback: result.aiDetailedFeedback || originalFeedback,
    ai: {
      ...(result.ai || {}),
      finalDeterministicFeedbackReconciled: true,
    },
  }, submissionText);

  const feedback = buildNaturalStudentFeedback(reconciled, submissionText);
  if (!feedback) return reconciled;

  return {
    ...reconciled,
    feedback,
    improvementSummary: feedback,
  };
}
