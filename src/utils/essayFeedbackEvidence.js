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
  const directMatch = direct.match(/\b(A2|B1)\b/);
  if (directMatch) return directMatch[1];
  const assignment = String(result.assignmentKey || result.assignmentId || result.assignment || result.ai?.assignmentKey || "").toUpperCase();
  return assignment.match(/^(A2|B1)[-_.]/)?.[1] || "";
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

function completeSentences(requiredValues, optionalValues, maximum) {
  const required = uniqueSentences(requiredValues);
  const requiredSet = new Set(required);
  const optional = uniqueSentences(optionalValues).filter((value) => !requiredSet.has(value));
  const selected = [];
  let words = 0;

  for (const value of required) {
    selected.push(value);
    words += value.split(/\s+/).length;
  }

  for (const value of optional) {
    const count = value.split(/\s+/).length;
    if (words + count > maximum) break;
    selected.push(value);
    words += count;
  }

  return selected.join(" ");
}

function historyOf(result = {}) {
  return list(result.recentFeedback, result.previousFeedback, result.ai?.recentFeedback, result.ai?.previousFeedback);
}

function correctionOf(result = {}) {
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
    if (from && to && from !== to && from.length <= 90 && to.length <= 120) return { from, to };
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

function meaningfulStructuredWritingEvidence(result = {}) {
  if (correctionOf(result)) return true;
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

function hasWritingEvidence(result = {}) {
  return result.hasRegisteredWriting === true
    || result.registeredWritingPart === true
    || writingScoreOf(result) !== null
    || meaningfulStructuredWritingEvidence(result);
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

function strengthOf(result, submission, level, seed, history) {
  const structured = first(result.writingStrengths, result.strengths, result.writing?.strengths, result.ai?.writingStrengths, result.ai?.strengths, result.rubric?.strengths);
  if (structured) return structured;
  const source = String(submission || "");
  const choices = [];
  if (level === "A2") {
    if (/\b(?:hallo|liebe?r?|sehr geehrte)\b/i.test(source) && /\b(?:viele grüße|mit freundlichen grüßen|liebe grüße)\b/i.test(source)) choices.push("Your message uses an appropriate greeting and closing");
    if (/\b(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|uhr|café|markt|bahnhof)\b/i.test(source)) choices.push("You include practical details that make the message easy to follow");
    if (/\b(?:weil|denn|deshalb)\b/i.test(source)) choices.push("You explain the purpose of the message instead of listing information only");
    choices.push("The main purpose of your message is understandable");
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

function nextStepOf(result, submission, level, correction, seed, history) {
  const structured = first(result.nextStep, result.improvementTarget, result.writingNextStep, result.writing?.nextStep, result.ai?.nextStep, result.rubric?.nextStep);
  if (structured) return structured;
  const source = String(submission || "");
  const choices = [];
  if (level === "A2") {
    if (/\bweil\s+ich\s+(?:möchte|kann|muss|will)\b/i.test(source)) choices.push("For the next task, place the conjugated verb at the end after “weil”");
    if (!/\b(?:weil|aber|deshalb|dann)\b/i.test(source)) choices.push("Connect two ideas with words such as “weil”, “aber” or “deshalb”");
    choices.push(correction ? "Reread the corrected sentence and check verb position and articles" : "Check verb position, articles and every task point before submitting");
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
  if (!level || !freeText(submissionText) || !hasWritingEvidence(result)) return "";
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
  const correction = correctionOf(result);
  const correctionEvidence = correctionSentence(correction, level, seed, history);
  const requiredSentences = [
    `${choose(openings, `${seed}:opening`, history)}${name ? `, ${name}` : ""}`,
    ...conciseObjective(objectiveSentences),
    correctionEvidence,
  ];
  const optionalSentences = [
    strengthOf(result, submissionText, level, seed, history),
    taskSentence(result),
    nextStepOf(result, submissionText, level, correction, seed, history),
  ];
  return completeSentences(requiredSentences, optionalSentences, level === "B1" ? 75 : 60);
}
