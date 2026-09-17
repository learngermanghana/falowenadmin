import { readFile, writeFile } from "node:fs/promises";

async function patchFile(target, replacements) {
  let source = await readFile(target, "utf8");

  for (const { before, after, label } of replacements) {
    if (source.includes(after)) continue;
    if (!source.includes(before)) {
      throw new Error(`${label} anchor changed; update patchDuplicateObjectiveNumbering.mjs`);
    }
    source = source.replace(before, after);
  }

  await writeFile(target, source);
}

const autoMarkingTarget = new URL("../src/utils/autoMarking.js", import.meta.url);

const autoParserBefore = `function parseStudentObjectiveAnswerTokens(tokens = [], { questionOffset = 0 } = {}) {
  const map = new Map();
  let orderedQuestion = 0;
  let pendingQuestion = null;

  for (const trimmed of tokens) {
    if (!trimmed) continue;

    const prefixedAnswer = parsePrefixedObjectiveAnswer(trimmed);
    if (prefixedAnswer) {
      if (pendingQuestion !== null) {
        map.set(questionOffset + pendingQuestion, prefixedAnswer);
        orderedQuestion = Math.max(orderedQuestion, pendingQuestion);
        pendingQuestion = null;
      } else {
        orderedQuestion += 1;
        map.set(questionOffset + orderedQuestion, prefixedAnswer);
      }
      continue;
    }

    const numbered = parseNumberedObjectiveLine(trimmed);
    if (numbered) {
      const question = questionOffset + numbered.question;
      map.set(question, numbered.answer);
      orderedQuestion = Math.max(orderedQuestion, numbered.question);
      pendingQuestion = numbered.question;
      continue;
    }

    const anzeigeOnly = trimmed.match(new RegExp(\`^(?:anzeige\\\\s*[).:-]?\\\\s*)?([\${OBJECTIVE_OPTION_LETTERS}])(?:\\\\b|\\\\s|[).:-]|$)\`, "i"));
    if (anzeigeOnly && (/^anzeige\\b/i.test(trimmed) || trimmed.length <= 2 || /^[A-FX]\\s*[).:-]/i.test(trimmed))) {
      orderedQuestion += 1;
      map.set(questionOffset + orderedQuestion, anzeigeOnly[1].toUpperCase());
      pendingQuestion = null;
      continue;
    }

    if (isObjectiveOptionAnswer(trimmed)) {
      orderedQuestion += 1;
      map.set(questionOffset + orderedQuestion, trimmed);
      pendingQuestion = null;
    }
  }

  return { map, localQuestionCount: orderedQuestion };
}`;

const autoParserAfter = `function parseStudentObjectiveAnswerTokens(tokens = [], { questionOffset = 0, expectedQuestionCount = 0 } = {}) {
  const map = new Map();
  let orderedQuestion = 0;
  let pendingQuestion = null;

  for (const [tokenIndex, trimmed] of tokens.entries()) {
    if (!trimmed) continue;

    const prefixedAnswer = parsePrefixedObjectiveAnswer(trimmed);
    if (prefixedAnswer) {
      if (pendingQuestion !== null) {
        map.set(questionOffset + pendingQuestion, prefixedAnswer);
        orderedQuestion = Math.max(orderedQuestion, pendingQuestion);
        pendingQuestion = null;
      } else {
        orderedQuestion += 1;
        map.set(questionOffset + orderedQuestion, prefixedAnswer);
      }
      continue;
    }

    const numbered = parseNumberedObjectiveLine(trimmed);
    if (numbered) {
      const sequentialPrefixComplete = Array.from(
        { length: numbered.question },
        (_, index) => map.has(questionOffset + index + 1),
      ).every(Boolean);
      const trailingDuplicateNumberingSlip = expectedQuestionCount > 0
        && numbered.question === expectedQuestionCount - 1
        && map.has(questionOffset + numbered.question)
        && !map.has(questionOffset + numbered.question + 1)
        && tokenIndex === tokens.length - 1
        && sequentialPrefixComplete;
      const localQuestion = trailingDuplicateNumberingSlip ? numbered.question + 1 : numbered.question;
      const question = questionOffset + localQuestion;
      map.set(question, numbered.answer);
      orderedQuestion = Math.max(orderedQuestion, localQuestion);
      pendingQuestion = localQuestion;
      continue;
    }

    const anzeigeOnly = trimmed.match(new RegExp(\`^(?:anzeige\\\\s*[).:-]?\\\\s*)?([\${OBJECTIVE_OPTION_LETTERS}])(?:\\\\b|\\\\s|[).:-]|$)\`, "i"));
    if (anzeigeOnly && (/^anzeige\\b/i.test(trimmed) || trimmed.length <= 2 || /^[A-FX]\\s*[).:-]/i.test(trimmed))) {
      orderedQuestion += 1;
      map.set(questionOffset + orderedQuestion, anzeigeOnly[1].toUpperCase());
      pendingQuestion = null;
      continue;
    }

    if (isObjectiveOptionAnswer(trimmed)) {
      orderedQuestion += 1;
      map.set(questionOffset + orderedQuestion, trimmed);
      pendingQuestion = null;
    }
  }

  return { map, localQuestionCount: orderedQuestion };
}`;

const autoAnswersBefore = `function parseStudentObjectiveAnswers(submissionText = "") {
  const text = String(submissionText || "");
  const parts = splitSubmissionIntoParts(text).filter((part) => part.partId !== "unknown");
  const objectiveParts = parts.filter((part) => countObjectiveAnswerEvidence(part.text) > 0);

  if (objectiveParts.length > 1) {
    const map = new Map();
    let questionOffset = 0;

    for (const part of objectiveParts) {
      const parsed = parseStudentObjectiveAnswerTokens(splitObjectiveAnswerTokens(part.text), { questionOffset });
      mergeAnswerMaps(map, parsed.map);
      questionOffset += parsed.localQuestionCount;
    }

    return map;
  }

  return parseStudentObjectiveAnswerTokens(splitObjectiveAnswerTokens(text)).map;
}`;

const autoAnswersAfter = `function parseStudentObjectiveAnswers(submissionText = "", { expectedQuestionCount = 0 } = {}) {
  const text = String(submissionText || "");
  const parts = splitSubmissionIntoParts(text).filter((part) => part.partId !== "unknown");
  const objectiveParts = parts.filter((part) => countObjectiveAnswerEvidence(part.text) > 0);

  if (objectiveParts.length > 1) {
    const map = new Map();
    let questionOffset = 0;

    for (const part of objectiveParts) {
      const parsed = parseStudentObjectiveAnswerTokens(splitObjectiveAnswerTokens(part.text), { questionOffset });
      mergeAnswerMaps(map, parsed.map);
      questionOffset += parsed.localQuestionCount;
    }

    return map;
  }

  return parseStudentObjectiveAnswerTokens(splitObjectiveAnswerTokens(text), { expectedQuestionCount }).map;
}`;

const autoMarkerBefore = `function objectiveMarker(referenceAnswers = {}, submissionText = "", { partId = "unknown" } = {}) {
  let studentAnswers = parseStudentObjectiveAnswers(submissionText);
  const vocabularyAnswers = extractVocabularyAnswers(submissionText);
  const entries = Array.isArray(referenceAnswers)
    ? referenceAnswers.map((entry, index) => ({ key: entry.questionNumber || entry.questionKey || entry.sourceKey || \`Answer\${index + 1}\`, value: entry }))
    : extractObjectiveEntries(referenceAnswers);
  const total = entries.length;

  studentAnswers = alignLabeledPartialObjectiveAnswers(studentAnswers, entries, submissionText);`;

const autoMarkerAfter = `function objectiveMarker(referenceAnswers = {}, submissionText = "", { partId = "unknown" } = {}) {
  const vocabularyAnswers = extractVocabularyAnswers(submissionText);
  const entries = Array.isArray(referenceAnswers)
    ? referenceAnswers.map((entry, index) => ({ key: entry.questionNumber || entry.questionKey || entry.sourceKey || \`Answer\${index + 1}\`, value: entry }))
    : extractObjectiveEntries(referenceAnswers);
  const total = entries.length;
  let studentAnswers = parseStudentObjectiveAnswers(submissionText, { expectedQuestionCount: total });

  studentAnswers = alignLabeledPartialObjectiveAnswers(studentAnswers, entries, submissionText);`;

await patchFile(autoMarkingTarget, [
  { before: autoParserBefore, after: autoParserAfter, label: "auto-marking objective token parser" },
  { before: autoAnswersBefore, after: autoAnswersAfter, label: "auto-marking objective answer parser" },
  { before: autoMarkerBefore, after: autoMarkerAfter, label: "auto-marking objective marker" },
]);

const routerTarget = new URL("../api/router.js", import.meta.url);

const routerParserBefore = `function parseStudentPartAnswers(text = "") {
  const map = new Map();
  let pendingQuestion = null;
  let orderedQuestion = 0;

  for (const token of splitObjectiveAnswerTokens(text)) {
    const parsed = parseStudentAnswerToken(token, pendingQuestion);
    if (!parsed) continue;

    if (parsed.pendingQuestion) {
      pendingQuestion = parsed.pendingQuestion;
      orderedQuestion = Math.max(orderedQuestion, pendingQuestion);
      continue;
    }

    let question = parsed.question;
    if (!question) {
      orderedQuestion += 1;
      question = orderedQuestion;
    }

    map.set(question, parsed.answer);
    orderedQuestion = Math.max(orderedQuestion, question);
    if (parsed.consumePending) pendingQuestion = null;
  }

  return {
    map,
    ordered: [...map.entries()].sort((left, right) => left[0] - right[0]).map(([question, answer]) => ({ question, answer })),
    answerCount: map.size,
  };
}`;

const routerParserAfter = `function parseStudentPartAnswers(text = "", { expectedQuestionCount = 0 } = {}) {
  const map = new Map();
  let pendingQuestion = null;
  let orderedQuestion = 0;
  const tokens = splitObjectiveAnswerTokens(text);

  for (const [tokenIndex, token] of tokens.entries()) {
    const parsed = parseStudentAnswerToken(token, pendingQuestion);
    if (!parsed) continue;

    if (parsed.pendingQuestion) {
      pendingQuestion = parsed.pendingQuestion;
      orderedQuestion = Math.max(orderedQuestion, pendingQuestion);
      continue;
    }

    let question = parsed.question;
    if (!question) {
      orderedQuestion += 1;
      question = orderedQuestion;
    }

    const sequentialPrefixComplete = Boolean(parsed.question) && Array.from(
      { length: question },
      (_, index) => map.has(index + 1),
    ).every(Boolean);
    const trailingDuplicateNumberingSlip = expectedQuestionCount > 0
      && Boolean(parsed.question)
      && question === expectedQuestionCount - 1
      && map.has(question)
      && !map.has(question + 1)
      && tokenIndex === tokens.length - 1
      && sequentialPrefixComplete;
    if (trailingDuplicateNumberingSlip) question += 1;

    map.set(question, parsed.answer);
    orderedQuestion = Math.max(orderedQuestion, question);
    if (parsed.consumePending) pendingQuestion = null;
  }

  return {
    map,
    ordered: [...map.entries()].sort((left, right) => left[0] - right[0]).map(([question, answer]) => ({ question, answer })),
    answerCount: map.size,
  };
}`;

const routerCallBefore = `      const parsed = parseStudentPartAnswers(matchingText || submissionText);`;
const routerCallAfter = `      const parsed = parseStudentPartAnswers(matchingText || submissionText, { expectedQuestionCount: entries.length });`;

await patchFile(routerTarget, [
  { before: routerParserBefore, after: routerParserAfter, label: "API objective part parser" },
  { before: routerCallBefore, after: routerCallAfter, label: "API objective part parser call" },
]);

console.log("Trailing duplicate objective question numbers now recover the final missing question without overwriting the previous answer.");
