function text(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return String(value.text || value.label || value.title || value.point || value.description || value.feedback || "").trim();
}

function list(...values) {
  return [...new Set(values.flat(Infinity).map(text).filter(Boolean))];
}

function writingSectionText(submission = "") {
  let source = String(submission || "").trim();
  const laterPart = source.search(/(?:^|\n)\s*(?:teil\s*[34]|lesen|reading|h[oö]ren|hoeren|listening)\b/i);
  if (laterPart >= 0) source = source.slice(0, laterPart);
  return source.replace(/^\s*teil\s*2\b[^\n]*[:·]?\s*/i, "").trim();
}

function levelOf(result = {}, explicitLevel = "") {
  const direct = String(explicitLevel || result.level || result.detectedLevel || result.ai?.detectedLevel || "").toUpperCase();
  const match = direct.match(/\b(A2|B1)\b/);
  if (match) return match[1];
  const assignment = String(result.assignmentKey || result.assignmentId || result.assignment || "").toUpperCase();
  return assignment.match(/^(A2|B1)[-_.]/)?.[1] || "";
}

function connectorSet(source = "") {
  return new Set((String(source || "").match(/\b(?:weil|denn|deshalb|daher|aber|jedoch|trotzdem|obwohl|wenn|dass|damit|während|einerseits|andererseits|außerdem|zudem|bevor|nachdem|sowie|alternativ|folglich|hingegen)\b/gi) || [])
    .map((value) => value.toLocaleLowerCase("de")));
}

function subordinateCount(source = "") {
  return (String(source || "").match(/\b(?:weil|dass|obwohl|wenn|damit|während|bevor|nachdem|als)\b/gi) || []).length;
}

function sentenceCount(source = "") {
  return String(source || "").split(/(?<=[.!?])\s+|\n+/).map((value) => value.trim()).filter((value) => value.split(/\s+/).length >= 3).length;
}

function contentTokens(source = "") {
  const stop = new Set(["aber","auch","dass","denn","deshalb","diese","dieser","dieses","eine","einen","einer","einem","eines","und","oder","weil","wenn","ich","wir","sie","der","die","das","den","dem","des","mit","für","von","auf","im","in","zu","ist","sind","war","waren","habe","hat","haben"]);
  return (String(source || "").toLocaleLowerCase("de").match(/[a-zäöüß]{4,}/g) || []).filter((token) => !stop.has(token));
}

function taskData(result = {}) {
  const task = result.taskCompletion || result.writing?.taskCompletion || result.ai?.taskCompletion || {};
  const completed = Number(task.completed ?? task.completedPoints ?? result.completedTaskPoints);
  const total = Number(task.total ?? task.totalPoints ?? result.totalTaskPoints);
  const missing = list(task.missing, task.missingPoints, result.missingTaskPoints, result.omittedTaskPoints, result.writing?.missingTaskPoints, result.ai?.missingTaskPoints);
  return {
    completed: Number.isFinite(completed) ? completed : null,
    total: Number.isFinite(total) ? total : null,
    missing,
  };
}

function correctionData(result = {}, source = "") {
  const candidates = [
    ...(Array.isArray(result.corrections) ? result.corrections : []),
    ...(Array.isArray(result.writingCorrections) ? result.writingCorrections : []),
    ...(Array.isArray(result.writing?.corrections) ? result.writing.corrections : []),
    ...(Array.isArray(result.ai?.corrections) ? result.ai.corrections : []),
  ];
  const normalized = source.toLocaleLowerCase("de");
  return candidates.map((item) => {
    if (!item || typeof item !== "object") return null;
    const part = String(item.partId || item.part || "").toLowerCase();
    if (item.question || item.questionNumber || item.key || /teil\s*[34]/.test(part)) return null;
    const from = String(item.from || item.original || item.student || item.error || "").trim();
    const to = String(item.to || item.corrected || item.improved || item.correction || "").trim();
    if (!from || !to || from === to || from.length > 100 || to.length > 130) return null;
    return normalized.includes(from.toLocaleLowerCase("de")) ? { from, to } : null;
  }).filter(Boolean);
}

function registerEvidence(source = "") {
  const formalGreeting = /\bsehr geehrte(?:r|n)?\b/i.test(source);
  const formalClosing = /\bmit freundlichen gr(?:ü|u)(?:ß|ss)en\b/i.test(source);
  const informalGreeting = /(?:^|\n)\s*(?:hallo|liebe?r?)\b/i.test(source);
  const informalClosing = /\b(?:liebe grüße|viele grüße|bis bald)\b/i.test(source);
  if (formalGreeting || formalClosing) return { type: "formal", complete: formalGreeting && formalClosing };
  if (informalGreeting || informalClosing) return { type: "informal", complete: informalGreeting && informalClosing };
  return { type: "neutral", complete: false };
}

function scoreBand(score) {
  if (score >= 4) return "strong";
  if (score >= 3) return "secure";
  if (score >= 2) return "developing";
  return "limited";
}

export function evaluateWritingRubric(result = {}, submission = "", explicitLevel = "") {
  const level = levelOf(result, explicitLevel);
  const source = writingSectionText(submission);
  const words = source.split(/\s+/).filter(Boolean);
  const sentences = sentenceCount(source);
  const connectors = connectorSet(source);
  const subordinates = subordinateCount(source);
  const tokens = contentTokens(source);
  const uniqueRatio = tokens.length ? new Set(tokens).size / tokens.length : 0;
  const task = taskData(result);
  const corrections = correctionData(result, source);
  const register = registerEvidence(source);

  let taskScore = 3;
  if (task.total && task.completed !== null) taskScore = Math.max(1, Math.min(4, Math.round((task.completed / task.total) * 4)));
  if (task.missing.length) taskScore = Math.min(taskScore, 2);

  let organizationScore = 1;
  if (sentences >= 3) organizationScore += 1;
  if (connectors.size >= (level === "B1" ? 3 : 2)) organizationScore += 1;
  if (/\b(?:zusammenfassend|abschließend|insgesamt|deshalb|daher|alternativ|zunächst|außerdem)\b/i.test(source) || /\?/.test(source)) organizationScore += 1;

  let grammarScore = 2;
  if (subordinates >= 1) grammarScore += 1;
  if (level === "B1" && subordinates >= 2 && connectors.size >= 4) grammarScore += 1;
  if (corrections.length >= 2) grammarScore = Math.max(1, grammarScore - 1);

  let vocabularyScore = 2;
  if (tokens.length >= (level === "B1" ? 35 : 22) && uniqueRatio >= 0.58) vocabularyScore += 1;
  if (connectors.size >= (level === "B1" ? 5 : 3)) vocabularyScore += 1;

  let registerScore = 2;
  if (register.type !== "neutral") registerScore += 1;
  if (register.complete) registerScore += 1;

  let accuracyScore = corrections.length ? Math.max(1, 4 - Math.min(3, corrections.length)) : 3;
  const structuredAccuracy = Number(result.accuracyScore ?? result.writing?.accuracyScore ?? result.rubric?.accuracyScore);
  if (Number.isFinite(structuredAccuracy)) accuracyScore = Math.max(1, Math.min(4, Math.round(structuredAccuracy)));

  const dimensions = {
    taskCompletion: { score: taskScore, band: scoreBand(taskScore), missing: task.missing },
    organizationCohesion: { score: organizationScore, band: scoreBand(organizationScore), connectorCount: connectors.size, sentenceCount: sentences },
    grammarControl: { score: Math.min(4, grammarScore), band: scoreBand(Math.min(4, grammarScore)), subordinateCount: subordinates },
    vocabularyRange: { score: Math.min(4, vocabularyScore), band: scoreBand(Math.min(4, vocabularyScore)), uniqueRatio },
    register: { score: registerScore, band: scoreBand(registerScore), type: register.type, complete: register.complete },
    accuracy: { score: accuracyScore, band: scoreBand(accuracyScore), correctionCount: corrections.length },
  };

  return {
    level,
    wordCount: words.length,
    source,
    dimensions,
    task,
    corrections,
    register,
    structuredStrengths: list(result.writingStrengths, result.strengths, result.writing?.strengths, result.ai?.writingStrengths, result.ai?.strengths, result.rubric?.strengths),
    structuredNextSteps: list(result.nextStep, result.improvementTarget, result.writingNextStep, result.writing?.nextStep, result.ai?.nextStep, result.rubric?.nextStep),
  };
}

export function rubricFeedbackSentences(result = {}, submission = "", explicitLevel = "") {
  const rubric = evaluateWritingRubric(result, submission, explicitLevel);
  if (rubric.level !== "A2" && rubric.level !== "B1") return [];
  if (rubric.wordCount < 20) return [];

  const sentences = [];
  if (rubric.structuredStrengths[0]) {
    sentences.push(rubric.structuredStrengths[0]);
  } else if (rubric.dimensions.taskCompletion.score >= 3 && rubric.dimensions.organizationCohesion.score >= 3) {
    sentences.push("The response develops the task in a clear sequence and gives the reader enough information to follow the purpose, rather than relying on isolated phrases");
  } else {
    sentences.push("The main purpose is understandable, but the response needs fuller development and clearer links between the individual points");
  }

  if (rubric.task.missing[0]) {
    sentences.push(`A required content point still needs to be addressed: ${rubric.task.missing[0]}`);
  } else if (rubric.dimensions.organizationCohesion.connectorCount >= (rubric.level === "B1" ? 3 : 2)) {
    sentences.push("The ideas are connected across sentences, so the text reads as one response instead of a list of separate statements");
  } else {
    sentences.push("Improve cohesion by linking one reason to its consequence and by varying how sentences begin");
  }

  if (rubric.corrections[0]) {
    sentences.push(`One concrete correction is “${rubric.corrections[0].from}” → “${rubric.corrections[0].to}”`);
  } else if (rubric.level === "B1" && rubric.dimensions.grammarControl.subordinateCount < 2) {
    sentences.push("For stronger B1 language control, develop at least one point with a subordinate clause and vary the sentence structure instead of adding more short main clauses");
  } else if (rubric.dimensions.vocabularyRange.score < 3) {
    sentences.push("The vocabulary is understandable, but the next improvement should be more precise nouns and verbs for the topic rather than repeating general words");
  } else {
    sentences.push("The language range is appropriate for the level; the next gain should come from developing one important idea more precisely, not from adding basic connectors");
  }

  if (rubric.structuredNextSteps[0]) {
    sentences.push(rubric.structuredNextSteps[0]);
  } else if (rubric.level === "B1") {
    sentences.push("On the next task, support one central point with a reason, a specific example and a short consequence before moving to the conclusion");
  } else {
    sentences.push("On the next task, make every required point explicit and add one concrete detail to each important sentence");
  }

  return [...new Set(sentences.map((value) => String(value || "").trim()).filter(Boolean))].slice(0, 4);
}
