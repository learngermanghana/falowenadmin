import { writingDepthSentences } from "./writingFeedbackDepth.js";

function percent(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : null;
}

function text(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return String(value.text || value.label || value.title || value.point || value.description || value.feedback || "").trim();
}

function list(...values) {
  return [...new Set(values.flat(Infinity).map(text).filter(Boolean))];
}

function first(...values) {
  return list(...values)[0] || "";
}

function levelOf(result = {}) {
  const direct = String(result.level || result.detectedLevel || result.ai?.detectedLevel || "").toUpperCase();
  const directMatch = direct.match(/\b(A1|A2|B1)\b/);
  if (directMatch) return directMatch[1];
  const assignment = String(result.assignmentKey || result.assignmentId || result.assignment || result.ai?.assignmentKey || "").toUpperCase();
  return assignment.match(/^(A1|A2|B1)[-_.]/)?.[1] || "";
}

function objectiveAnswerLike(value = "") {
  const source = String(value || "");
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const answerLine = /^(?:teil\s*\d+\s*)?(?:(?:frage|answer)\s*)?\d+\s*[.)\-:]?\s*(?:[A-DX]|richtig|falsch)(?:\b|[.)!?;,]|$)/i;
  const answerLines = lines.filter((line) => answerLine.test(line)).length;
  const compactAnswers = (source.match(/(?:^|\s)\d+\s*[.)\-:]?\s*[A-DX](?=\s|[.,;!?]|$)/gi) || []).length;
  const proseMarker = /\b(?:ich|wir|mein(?:e|er|en|em|es)?|mir|mich|hallo|liebe?r?|sehr geehrte|meiner meinung nach|ich denke|ich finde|zusammenfassend)\b/i.test(source);

  if (!proseMarker && answerLines >= 2 && answerLines >= Math.ceil(lines.length * 0.5)) return true;
  return !proseMarker && compactAnswers >= 3;
}

function freeText(value = "") {
  const source = String(value || "");
  const wordCount = source.split(/\s+/).filter(Boolean).length;
  if (wordCount < 12 || !/[.!?]/.test(source) || objectiveAnswerLike(source)) return false;

  const sentenceCount = (source.match(/[.!?](?=\s|$)/g) || []).length;
  const proseMarker = /\b(?:ich|wir|mein(?:e|er|en|em|es)?|mir|mich|hallo|liebe?r?|sehr geehrte|meiner meinung nach|ich denke|ich finde|zusammenfassend)\b/i.test(source);
  return proseMarker || sentenceCount >= 2;
}

function hash(value = "") {
  return [...String(value)].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7);
}

function tokens(value = "") {
  return new Set(String(value).toLowerCase().match(/[a-zäöüß]{4,}/g) || []);
}

function similarity(left = "", right = "") {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  return [...a].filter((token) => b.has(token)).length / Math.max(a.size, b.size);
}

function choose(variants, seed, history = []) {
  const options = [...new Set(variants.filter(Boolean))];
  if (!options.length) return "";
  const start = hash(seed) % options.length;
  return options
    .map((_, index) => options[(start + index) % options.length])
    .map((option, index) => ({ option, index, score: history.reduce((max, prior) => Math.max(max, similarity(option, prior)), 0) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)[0].option;
}

function sentence(value = "") {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function uniqueSentences(values = []) {
  return [...new Set(values.map(sentence).filter(Boolean))];
}

function sentenceWords(value = "") {
  return sentence(value).split(/\s+/).filter(Boolean).length;
}

function completeSentences({ opening, objectiveValues, correctionValue, correctionFallback, optionalValues }, maximum) {
  const correctionCandidates = uniqueSentences([correctionValue, correctionFallback]);
  const correction = correctionCandidates.find((value) => sentenceWords(value) <= maximum) || "";
  const correctionWords = sentenceWords(correction);
  const selected = [];
  let words = 0;

  for (const value of uniqueSentences([opening, ...(objectiveValues || [])])) {
    const count = sentenceWords(value);
    if (words + count + correctionWords > maximum) break;
    selected.push(value);
    words += count;
  }

  if (correction && words + correctionWords <= maximum) {
    selected.push(correction);
    words += correctionWords;
  }

  const selectedSet = new Set(selected);
  for (const value of uniqueSentences(optionalValues || []).filter((item) => !selectedSet.has(item))) {
    const count = sentenceWords(value);
    if (words + count > maximum) break;
    selected.push(value);
    words += count;
  }

  return selected.join(" ");
}

function historyOf(result = {}) {
  return list(result.recentFeedback, result.previousFeedback, result.ai?.recentFeedback, result.ai?.previousFeedback);
}

function correctionOf(result = {}, submission = "") {
  const candidates = [
    ...(Array.isArray(result.corrections) ? result.corrections : []),
    ...(Array.isArray(result.writingCorrections) ? result.writingCorrections : []),
    ...(Array.isArray(result.writing?.corrections) ? result.writing.corrections : []),
    ...(Array.isArray(result.ai?.corrections) ? result.ai.corrections : []),
  ];
  for (const item of candidates) {
    if (!item || typeof item !== "object") continue;
    const part = String(item.partId || item.part || "").toLowerCase();
    if (item.question || item.questionNumber || item.key || /teil\s*[34]/.test(part)) continue;
    const from = String(item.from || item.original || item.student || item.error || "").trim();
    const to = String(item.to || item.corrected || item.improved || item.correction || "").trim();
    if (from && to && from !== to && from.length <= 90 && to.length <= 120
      && String(submission).toLocaleLowerCase("de").includes(from.toLocaleLowerCase("de"))) return { from, to };
  }
  return null;
}

function writingScoreOf(result = {}) {
  return percent(
    result.writingScorePercent
    ?? result.writingScore
    ?? result.writing?.scorePercent
    ?? result.writing?.score
    ?? result.ai?.writingScorePercent
    ?? result.ai?.writingScore,
  );
}

function meaningfulTaskEvidence(result = {}) {
  const tasks = [result.taskCompletion, result.writing?.taskCompletion, result.ai?.taskCompletion];
  const hasTaskObject = tasks.some((task) => {
    if (typeof task === "string") return Boolean(task.trim());
    if (Array.isArray(task)) return list(task).length > 0;
    if (!task || typeof task !== "object") return false;

    const completed = Number(task.completed ?? task.completedPoints);
    const total = Number(task.total ?? task.totalPoints);
    if (Number.isFinite(completed) && Number.isFinite(total) && total > 0) return true;
    return list(task.missing, task.missingPoints, task.completedItems, task.coveredPoints, task.feedback, task.description).length > 0;
  });

  if (hasTaskObject) return true;
  return list(
    result.missingTaskPoints,
    result.omittedTaskPoints,
    result.writing?.missingTaskPoints,
    result.ai?.missingTaskPoints,
  ).length > 0;
}

function meaningfulStructuredWritingEvidence(result = {}, submission = "") {
  if (correctionOf(result, submission)) return true;
  if (meaningfulTaskEvidence(result)) return true;
  if (first(
    result.writingStrengths,
    result.strengths,
    result.writing?.strengths,
    result.ai?.writingStrengths,
    result.ai?.strengths,
    result.rubric?.strengths,
  )) return true;
  return Boolean(first(
    result.nextStep,
    result.improvementTarget,
    result.writingNextStep,
    result.writing?.nextStep,
    result.ai?.nextStep,
    result.rubric?.nextStep,
  ));
}

function hasWritingEvidence(result = {}, submission = "") {
  return result.hasRegisteredWriting === true
    || result.registeredWritingPart === true
    || writingScoreOf(result) !== null
    || meaningfulStructuredWritingEvidence(result, submission);
}

function taskSentence(result = {}) {
  const task = result.taskCompletion || result.writing?.taskCompletion || result.ai?.taskCompletion || {};
  const missing = list(task.missing, task.missingPoints, result.missingTaskPoints, result.omittedTaskPoints, result.writing?.missingTaskPoints, result.ai?.missingTaskPoints);
  const completed = Number(task.completed ?? task.completedPoints ?? result.completedTaskPoints);
  const total = Number(task.total ?? task.totalPoints ?? result.totalTaskPoints);
  if (Number.isFinite(completed) && Number.isFinite(total) && total > 0) {
    if (!missing.length && completed >= total) return `You addressed all ${total} task points`;
    return `You covered ${Math.max(0, Math.min(total, completed))} of ${total} task points${missing[0] ? `; ${missing[0]} is missing` : ""}`;
  }
  return missing[0] ? `A required task point is missing: ${missing[0]}` : "";
}

function rawFeedbackSentences(result = {}) {
  const sources = list(
    result.aiDetailedFeedback,
    result.aiOriginalFeedback,
    result.ai?.detailedFeedback,
    result.ai?.originalFeedback,
    result.improvementSummary,
    result.feedback,
  );
  return [...new Set(sources.flatMap((value) => String(value || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)))];
}

function genericWritingSentence(value = "") {
  return /^(?:the main purpose of your message is understandable|check verb position, articles and every task point before submitting|your message uses an appropriate greeting and closing|your free-text response is clear|reread .+ improve one wording choice before submitting)/i.test(String(value || "").trim());
}

function quotedFeedbackPhrases(value = "") {
  return [...String(value || "").matchAll(/[“"]([^”"]{2,90})[”"]|[‘']([^’']{2,90})[’']/g)]
    .map((match) => String(match[1] || match[2] || "").trim())
    .filter(Boolean);
}

function isCorrectiveWritingClaim(value = "") {
  return /\b(?:write|use|replace|correct|revise|avoid|change|fix|article|articles|grammar|word order|spelling|instead of|rather than)\b/i.test(String(value || ""));
}

function submissionContainsExactPhrase(submission = "", phrase = "") {
  const source = String(submission || "").toLocaleLowerCase("de");
  const needle = String(phrase || "").trim().toLocaleLowerCase("de");
  if (!needle) return false;
  if (!/^[\p{L}\p{N}]+$/u.test(needle)) return source.includes(needle);
  const escaped = needle.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  return new RegExp("(?:^|[^\\p{L}\\p{N}])" + escaped + "(?:$|[^\\p{L}\\p{N}])", "iu").test(source);
}

function isGroundedCorrectiveFeedback(value = "", submission = "") {
  const feedback = String(value || "").trim();
  if (genericWritingSentence(feedback)) return false;
  if (!feedback || !isCorrectiveWritingClaim(feedback)) return Boolean(feedback);
  const quoted = quotedFeedbackPhrases(feedback);
  if (!quoted.length) return false;
  return quoted.some((quote) => submissionContainsExactPhrase(submission, quote));
}

function objectiveFeedbackSentence(value = "") {
  return /\b(?:objective|questions?\s+\d+|answers?\s+(?:are|is)|teil\s*[34]|score|correct answers?)\b/i.test(String(value || ""));
}

function specificAiWritingSentence(result = {}, kind = "strength", submission = "") {
  const cue = kind === "next"
    ? /\b(?:write|use|replace|correct|revise|avoid|add|change|improve|practise|practice|punctuation|wording|instead of)\b/i
    : /\b(?:clear|organis|appropriate|formal|asks?|mentions?|includes?|explains?|specific|well structured|easy to follow)\b/i;
  return rawFeedbackSentences(result).find((value) => {
    const wordCount = value.split(/\s+/).filter(Boolean).length;
    const quoted = [...value.matchAll(/[“"]([^”"]{3,90})[”"]|[‘']([^’']{3,90})[’']/g)]
      .map((match) => match[1] || match[2])
      .filter(Boolean);
    const normalizedSubmission = String(submission).toLocaleLowerCase("de");
    const correctionIsAnchored = kind !== "next"
      || !isCorrectiveWritingClaim(value)
      || (quoted.length > 0 && quoted.some((quote) => submissionContainsExactPhrase(submission, quote)));
    return wordCount >= 5
      && wordCount <= 45
      && !genericWritingSentence(value)
      && !objectiveFeedbackSentence(value)
      && cue.test(value)
      && correctionIsAnchored;
  }) || "";
}

function writingSectionText(submission = "") {
  let source = String(submission || "").trim();
  const laterPart = source.search(/(?:^|\n)\s*(?:teil\s*[34]|lesen|reading|h[oö]ren|hoeren|listening)\b/i);
  if (laterPart >= 0) source = source.slice(0, laterPart);
  return source.replace(/^\s*teil\s*2\b[.:]?\s*/i, "").trim();
}

function writingSentenceCandidates(submission = "") {
  return writingSectionText(submission)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter((value) => {
      const words = value.split(/\s+/).filter(Boolean).length;
      return words >= 5
        && words <= 24
        && !/^(?:sehr geehrte|hallo|liebe?r?|mit freundlichen grüßen|viele grüße|liebe grüße)/i.test(value);
    });
}

function writingAnchor(submission = "") {
  const ranked = writingSentenceCandidates(submission).map((value, index) => {
    let score = -index;
    if (/\b(?:weil|möchte|interessiere|bitte|können|informationen|seminar)\b/i.test(value)) score += 8;
    if (/[?]$/.test(value)) score += 3;
    return { value, score };
  }).sort((left, right) => right.score - left.score);
  const value = ranked[0]?.value || "";
  return value.length > 120 ? value.slice(0, 117).trim() + "…" : value;
}

function submissionAnchoredStrength(submission = "") {
  const source = writingSectionText(submission);
  if (/informationen[^.!?]{0,40}inhalt[^.!?]{0,40}termine[^.!?]{0,40}kosten/i.test(source)) {
    return "Your seminar request clearly asks about Inhalt, Termine and Kosten";
  }
  const anchor = writingAnchor(submission);
  return anchor ? "Your sentence “" + anchor.replace(/[.!?]+$/, "") + "” clearly communicates the purpose of the message" : "";
}

function submissionAnchoredNextStep(submission = "") {
  const source = writingSectionText(submission);
  if (/\bauf\s+widersehen\b/i.test(source)) {
    return "Write “Auf Wiedersehen” instead of “Auf Widersehen”";
  }
  const missingStopMatch = source.match(/(?:^|\n|[.!?]\s+)\s*([^\n.!?]{3,120}\brückmeldung)\s*(?:\n|$)\s*mit freundlichen grüßen/i);
  if (missingStopMatch) {
    const exactWording = missingStopMatch[1].replace(/\s+/g, " ").trim();
    return "Add a full stop after “" + exactWording + "” before the closing";
  }
  if ((source.match(/\bich freue mich\b/gi) || []).length >= 2) {
    return "Avoid repeating “Ich freue mich”; vary one occurrence with a different expression";
  }
  if (/informationen\s+über\s+den\s+inhalt/i.test(source)) {
    return "Use “Informationen zu dem Inhalt, den Terminen und den Kosten” instead of “Informationen über den Inhalt, die Termine und die Kosten” for a more natural request";
  }
  return "";
}

function strengthOf(result, submission, level, seed, history) {
  const structured = first(result.writingStrengths, result.strengths, result.writing?.strengths, result.ai?.writingStrengths, result.ai?.strengths, result.rubric?.strengths);
  if (structured && !genericWritingSentence(structured)) return structured;
  const aiSpecific = specificAiWritingSentence(result, "strength", submission);
  if (aiSpecific) return aiSpecific;
  const anchored = submissionAnchoredStrength(submission);
  if (anchored) return anchored;
  const source = String(submission || "");
  const choices = [];
  if (level === "A1" || level === "A2") {
    if (/\b(?:hallo|liebe?r?|sehr geehrte)\b/i.test(source) && /\b(?:viele grüße|mit freundlichen grüßen|liebe grüße)\b/i.test(source)) choices.push("Your message uses an appropriate greeting and closing");
    if (/\b(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|uhr|café|markt|bahnhof)\b/i.test(source)) choices.push("You include practical details that make the message easy to follow");
    if (/\b(?:weil|denn|deshalb)\b/i.test(source)) choices.push("You explain the purpose of the message instead of listing information only");
  } else {
    if (/\b(?:meiner meinung nach|ich denke|ich finde|ich bin der meinung)\b/i.test(source)) choices.push("Your position is clear and easy to identify");
    if (/\b(?:zum beispiel|beispielsweise|etwa)\b/i.test(source)) choices.push("A concrete example helps support your argument");
    if (source.split(/\n\s*\n/).filter((part) => part.trim()).length >= 3) choices.push("The text is organised into recognisable sections");
    choices.push("The response has a clear direction and remains connected to the topic");
  }
  return choose(choices, `${seed}:strength`, history);
}

function correctionSentence(correction, level, seed, history) {
  if (!correction) return "";
  const choices = level === "B1"
    ? [
      `A useful correction is “${correction.to}” instead of “${correction.from}”`,
      `Revise “${correction.from}” to “${correction.to}” so the sentence is complete`,
      `The sentence is more accurate as “${correction.to}”, not “${correction.from}”`,
    ]
    : [
      `Write “${correction.to}” instead of “${correction.from}”`,
      `Correct “${correction.from}” to “${correction.to}”`,
      `Use “${correction.to}” rather than “${correction.from}”`,
    ];
  return choose(choices, `${seed}:correction`, history);
}

function compactCorrectionSentence(correction) {
  return correction ? `“${correction.from}” → “${correction.to}”` : "";
}

function nextStepOf(result, submission, level, correction, seed, history) {
  const structured = first(result.nextStep, result.improvementTarget, result.writingNextStep, result.writing?.nextStep, result.ai?.nextStep, result.rubric?.nextStep);
  if (structured && isGroundedCorrectiveFeedback(structured, submission)) return structured;
  const aiSpecific = specificAiWritingSentence(result, "next", submission);
  if (aiSpecific) return aiSpecific;
  const anchored = submissionAnchoredNextStep(submission);
  if (anchored) return anchored;
  const source = String(submission || "");
  const choices = [];
  if (level === "A1" || level === "A2") {
    if (/\bweil\s+ich\s+(?:möchte|kann|muss|will)\b/i.test(source)) choices.push("For the next task, place the conjugated verb at the end after “weil”");
    if (!/\b(?:weil|aber|deshalb|dann)\b/i.test(source)) choices.push("Connect two ideas with words such as “weil”, “aber” or “deshalb”");
  } else {
    if (!/\b(?:zum beispiel|beispielsweise|etwa)\b/i.test(source)) choices.push("Support each main reason with a concrete example");
    if (source.split(/\n\s*\n/).filter((part) => part.trim()).length < 3) choices.push("Use a short introduction, a developed main section and a clear conclusion");
    if ((source.match(/\b(?:außerdem|jedoch|dennoch|deshalb|einerseits|andererseits|obwohl|während)\b/gi) || []).length < 2) choices.push("Use a wider range of connectors to show how the arguments relate");
    choices.push("Develop one central argument more fully instead of adding several short points");
  }
  return choose(choices, `${seed}:next`, history);
}

function conciseObjective(values = []) {
  return values.map((value) => String(value || "")
    .replace(/^You answered (\d+) of (\d+) objective questions correctly$/i, "$1 of $2 objective answers are correct")
    .replace(/^Review questions? /i, "Review ")
    .replace(/^In (Teil \d+), review questions? /i, "In $1, review ")
    .replace(/\s+carefully$/i, ""));
}

export function buildEvidenceEssayFeedback({ result = {}, submissionText = "", objectiveSentences = [] } = {}) {
  const level = levelOf(result);
  if (!level || !freeText(submissionText) || !hasWritingEvidence(result, submissionText)) return "";
  const writingScore = writingScoreOf(result);

  const name = String(result.studentName || result.name || "").trim();
  const history = historyOf(result);
  const seed = [name, level, result.assignmentKey || result.assignmentId || "", submissionText].join("|");
  const score = writingScore ?? percent(result.finalScore ?? result.score);
  const openings = score !== null && score >= 80
    ? ["Strong work", "Well done", "Excellent progress"]
    : score !== null && score >= 60
      ? ["Good progress", "Solid work", "A good attempt"]
      : ["Keep improving", "Keep practising", "A useful start"];
  const correction = correctionOf(result, submissionText);
  const correctionEvidence = correctionSentence(correction, level, seed, history);
  const structuredStrength = first(
    result.writingStrengths,
    result.strengths,
    result.writing?.strengths,
    result.ai?.writingStrengths,
    result.ai?.strengths,
    result.rubric?.strengths,
  );
  const structuredNextStep = first(
    result.nextStep,
    result.improvementTarget,
    result.writingNextStep,
    result.writing?.nextStep,
    result.ai?.nextStep,
    result.rubric?.nextStep,
  );
  const priorityNextStep = structuredNextStep && isGroundedCorrectiveFeedback(structuredNextStep, submissionText)
    ? structuredNextStep
    : "";
  const priorityStrength = structuredStrength && !genericWritingSentence(structuredStrength) ? structuredStrength : "";
  const priorityTask = taskSentence(result);
  const specificStrength = specificAiWritingSentence(result, "strength", submissionText);
  const specificNextStep = specificAiWritingSentence(result, "next", submissionText);
  const anchoredStrength = submissionAnchoredStrength(submissionText);
  const anchoredNextStep = submissionAnchoredNextStep(submissionText);
  const specificAnchoredStrength = anchoredStrength && !/^Your sentence “/i.test(anchoredStrength) ? anchoredStrength : "";
  const hasPriorityWritingEvidence = Boolean(
    priorityStrength
    || priorityTask
    || priorityNextStep
    || specificStrength
    || specificNextStep
    || specificAnchoredStrength
    || anchoredNextStep,
  );
  const fallbackStrength = priorityStrength || specificStrength || specificAnchoredStrength
    ? ""
    : strengthOf(result, submissionText, level, seed, history);
  const fallbackNextStep = priorityNextStep || specificNextStep || anchoredNextStep
    ? ""
    : nextStepOf(result, submissionText, level, correction, seed, history);
  const supplementalSentences = hasPriorityWritingEvidence
    ? [fallbackStrength, fallbackNextStep]
    : [
      ...writingDepthSentences(result, submissionText, level),
      fallbackStrength,
      fallbackNextStep,
    ];
  const optionalSentences = [
    priorityStrength,
    priorityTask,
    priorityNextStep,
    specificStrength,
    specificNextStep,
    priorityStrength || specificStrength ? "" : specificAnchoredStrength,
    anchoredNextStep,
    ...supplementalSentences,
  ];
  const feedbackMaximum = hasPriorityWritingEvidence
    ? level === "B1" ? 90 : level === "A2" ? 75 : 60
    : level === "B1" ? 120 : level === "A2" ? 100 : 60;
  const feedback = completeSentences({
    opening: `${choose(openings, `${seed}:opening`, history)}${name ? `, ${name}` : ""}`,
    objectiveValues: conciseObjective(objectiveSentences),
    correctionValue: correctionEvidence,
    correctionFallback: compactCorrectionSentence(correction),
    optionalValues: optionalSentences,
  }, feedbackMaximum);
  const hasStructured = meaningfulStructuredWritingEvidence(result, submissionText);
  const hasSpecificAiProse = Boolean(
    specificAiWritingSentence(result, "strength", submissionText)
    || specificAiWritingSentence(result, "next", submissionText),
  );
  console.info("[marking-feedback-diagnostic]", {
    assignmentKey: String(result.assignmentKey || result.assignmentId || "").trim(),
    detectedWritingPart: true,
    structuredWritingEvidence: hasStructured,
    originalAiFeedbackExists: rawFeedbackSentences(result).length > 0,
    finalFeedbackPath: hasStructured ? "structured-writing-evidence" : hasSpecificAiProse ? "original-ai-prose" : "submission-anchor",
    genericFallbackUsed: rawFeedbackSentences({ feedback }).some(genericWritingSentence),
  });
  return feedback;
}
