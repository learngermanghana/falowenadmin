import fs from "node:fs";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`${label} anchor changed; update patchObjectiveGrammarConsistency.mjs`);
  return source.replace(before, after);
}

const objectiveTarget = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let objectiveSource = fs.readFileSync(objectiveTarget, "utf8");

const sectionMarkerBefore = '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|part)[ \\t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[.:;]?[ \\t]*(?=\\n|$)/gi;';
const sectionMarkerAfter = '  const markerRegex = /(?:^|\\n)[ \\t]*((?:teil|tiel|part)[ \\t]*([1-4])|lesen|reading|h[oö]ren|hoeren|listening|schreiben|writing)[ \\t]*(?:\\([^\\n)]*\\))?[ \\t]*[.:;]?[ \\t]*(?=\\n|$)/gi;';
if (!objectiveSource.includes("(?:teil|tiel|part)")) {
  objectiveSource = replaceOnce(objectiveSource, sectionMarkerBefore, sectionMarkerAfter, "common Tiel heading typo");
}

const itemMetadataBefore = [
  '      type: meta.type,',
  '      vocabularyKey: meta.vocabularyKey || "",',
  '    });',
].join("\n");
const itemMetadataAfter = [
  '      type: meta.type,',
  '      vocabularyKey: meta.vocabularyKey || "",',
  '      matchingMode: String(',
  '        referenceEntry.answerMatchingMode',
  '          || referenceEntry.textMatchingMode',
  '          || referenceEntry.partGrading?.[partId]?.answerMatchingMode',
  '          || referenceEntry.partGrading?.[normalizedPartId]?.answerMatchingMode',
  '          || "",',
  '      ).trim().toLowerCase(),',
  '    });',
].join("\n");
objectiveSource = replaceOnce(objectiveSource, itemMetadataBefore, itemMetadataAfter, "answer matching metadata");

const correctAnswerAnchor = 'function isCorrectAnswer(item, student) {';
const previousStrictHelper = [
  'function strictGrammarTextMatches(expectedRaw = "", studentRaw = "") {',
  '  const expected = normalizeAnswer(expectedRaw);',
  '  const student = normalizeAnswer(studentRaw);',
  '  return Boolean(expected && student && expected === student);',
  '}',
].join("\n");
const broadShortAnswerStrictHelper = [
  'function normalizeStrictGrammarToken(value = "") {',
  '  return normalizeAnswer(value)',
  '    .replace(/\\bhei(?:b|ß)e\\b/g, "heisse")',
  '    .replace(/\\bhei(?:b|ß)t\\b/g, "heisst");',
  '}',
  '',
  'function strictGrammarTextMatches(expectedRaw = "", studentRaw = "") {',
  '  const expectedTokens = normalizeStrictGrammarToken(expectedRaw).split(/\\s+/).filter(Boolean);',
  '  const studentTokens = normalizeStrictGrammarToken(studentRaw).split(/\\s+/).filter(Boolean);',
  '  if (!expectedTokens.length || !studentTokens.length) return false;',
  '  if (studentTokens.length === 1 && expectedTokens.length > 1) {',
  '    return expectedTokens.includes(studentTokens[0]);',
  '  }',
  '  return expectedTokens.join(" ") === studentTokens.join(" ");',
  '}',
].join("\n");
const conjugatedShortAnswerStrictHelper = [
  'function normalizeStrictGrammarToken(value = "") {',
  '  return normalizeAnswer(value)',
  '    .replace(/\\bhei(?:b|ß)e\\b/g, "heisse")',
  '    .replace(/\\bhei(?:b|ß)t\\b/g, "heisst");',
  '}',
  '',
  'function strictGrammarTextMatches(expectedRaw = "", studentRaw = "") {',
  '  const expectedTokens = normalizeStrictGrammarToken(expectedRaw).split(/\\s+/).filter(Boolean);',
  '  const studentTokens = normalizeStrictGrammarToken(studentRaw).split(/\\s+/).filter(Boolean);',
  '  if (!expectedTokens.length || !studentTokens.length) return false;',
  '  if (studentTokens.length === 1 && expectedTokens.length > 1) {',
  '    const expectedVerbForms = String(expectedRaw || "")',
  '      .split(/\\s*\\/\\s*/)',
  '      .map((alternative) => normalizeStrictGrammarToken(alternative).split(/\\s+/).filter(Boolean)[1])',
  '      .filter(Boolean);',
  '    return expectedVerbForms.includes(studentTokens[0]);',
  '  }',
  '  return expectedTokens.join(" ") === studentTokens.join(" ");',
  '}',
  '',
  correctAnswerAnchor,
].join("\n");
const slashAlternativeStrictHelper = [
  'function normalizeStrictGrammarToken(value = "") {',
  '  return normalizeAnswer(value)',
  '    .replace(/\\bhei(?:b|ß)e\\b/g, "heisse")',
  '    .replace(/\\bhei(?:b|ß)t\\b/g, "heisst");',
  '}',
  '',
  'function strictGrammarStudentVariants(value = "") {',
  '  const source = String(value || "")',
  '    .replace(/\\s+\\bSie\\s*\\([^)]*\\)\\s*$/i, "")',
  '    .replace(/\\([^)]*\\)/g, " ")',
  '    .replace(/\\s+/g, " ")',
  '    .trim();',
  '  const variants = [source];',
  '  const compactVerbAlternative = source.match(/^(.*?\\s)([A-Za-zÄÖÜäöüß]+)\\s*\\/\\s*([A-Za-zÄÖÜäöüß]+)(\\s+.*)$/);',
  '  if (compactVerbAlternative) {',
  '    const [, prefix, firstVerb, secondVerb, suffix] = compactVerbAlternative;',
  '    variants.push(`${prefix}${firstVerb}${suffix}`, `${prefix}${secondVerb}${suffix}`);',
  '  }',
  '  return [...new Set(variants.map(normalizeStrictGrammarToken).filter(Boolean))];',
  '}',
  '',
  'function strictGrammarTextMatches(expectedRaw = "", studentRaw = "") {',
  '  const expectedTokens = normalizeStrictGrammarToken(expectedRaw).split(/\\s+/).filter(Boolean);',
  '  const studentVariants = strictGrammarStudentVariants(studentRaw);',
  '  if (!expectedTokens.length || !studentVariants.length) return false;',
  '  if (studentVariants.length === 1 && studentVariants[0].split(/\\s+/).length === 1 && expectedTokens.length > 1) {',
  '    const expectedVerbForms = String(expectedRaw || "")',
  '      .split(/\\s*\\/\\s*/)',
  '      .map((alternative) => normalizeStrictGrammarToken(alternative).split(/\\s+/).filter(Boolean)[1])',
  '      .filter(Boolean);',
  '    return expectedVerbForms.includes(studentVariants[0]);',
  '  }',
  '  return studentVariants.includes(expectedTokens.join(" "));',
  '}',
  '',
  correctAnswerAnchor,
].join("\n");
const strictHelper = [
  'function normalizeStrictGrammarToken(value = "") {',
  '  return normalizeAnswer(value)',
  '    .replace(/\\bhei(?:b|ß)e\\b/g, "heisse")',
  '    .replace(/\\bhei(?:b|ß)t\\b/g, "heisst");',
  '}',
  '',
  'function strictGrammarStudentVariants(value = "") {',
  '  const source = String(value || "")',
  '    .replace(/\\s+\\bSie\\s*\\([^)]*\\)\\s*$/i, "")',
  '    .replace(/\\([^)]*\\)/g, " ")',
  '    .replace(/\\s+/g, " ")',
  '    .trim();',
  '  const variants = [source];',
  '  const compactVerbAlternative = source.match(/^(.*?\\s)([A-Za-zÄÖÜäöüß]+)\\s*\\/\\s*([A-Za-zÄÖÜäöüß]+)(\\s+.*)$/);',
  '  if (compactVerbAlternative) {',
  '    const [, prefix, firstVerb, secondVerb, suffix] = compactVerbAlternative;',
  '    variants.push(`${prefix}${firstVerb}${suffix}`, `${prefix}${secondVerb}${suffix}`);',
  '  }',
  '  return [...new Set(variants.map(normalizeStrictGrammarToken).filter(Boolean))];',
  '}',
  '',
  'function strictGrammarTextMatches(expectedRaw = "", studentRaw = "") {',
  '  const expectedTokens = normalizeStrictGrammarToken(expectedRaw).split(/\\s+/).filter(Boolean);',
  '  const studentVariants = strictGrammarStudentVariants(studentRaw);',
  '  if (!expectedTokens.length || !studentVariants.length) return false;',
  '  if (studentVariants.length === 1 && studentVariants[0].split(/\\s+/).length === 1 && expectedTokens.length > 1) {',
  '    const expectedVerbForms = String(expectedRaw || "")',
  '      .split(/\\s*\\/\\s*/)',
  '      .map((alternative) => normalizeStrictGrammarToken(alternative).split(/\\s+/).filter(Boolean)[1])',
  '      .filter(Boolean);',
  '    return expectedVerbForms.includes(studentVariants[0]);',
  '  }',
  '  const expectedSentence = expectedTokens.join(" ");',
  '  if (studentVariants.includes(expectedSentence)) return true;',
  '  if (expectedTokens.length < 2) return false;',
  '  return studentVariants.some((variant) => {',
  '    const studentTokens = variant.split(/\\s+/).filter(Boolean);',
  '    return studentTokens[0] === expectedTokens[0] && studentTokens[1] === expectedTokens[1];',
  '  });',
  '}',
  '',
  correctAnswerAnchor,
].join("\n");
if (objectiveSource.includes(previousStrictHelper)) {
  objectiveSource = objectiveSource.replace(previousStrictHelper, strictHelper.split(`\n\n${correctAnswerAnchor}`)[0]);
} else if (objectiveSource.includes(broadShortAnswerStrictHelper)) {
  objectiveSource = objectiveSource.replace(broadShortAnswerStrictHelper, strictHelper.split(`\n\n${correctAnswerAnchor}`)[0]);
} else if (objectiveSource.includes(conjugatedShortAnswerStrictHelper)) {
  objectiveSource = objectiveSource.replace(conjugatedShortAnswerStrictHelper, strictHelper.split(`\n\n${correctAnswerAnchor}`)[0]);
} else if (objectiveSource.includes(slashAlternativeStrictHelper)) {
  objectiveSource = objectiveSource.replace(slashAlternativeStrictHelper, strictHelper.split(`\n\n${correctAnswerAnchor}`)[0]);
} else if (!objectiveSource.includes("function normalizeStrictGrammarToken(")) {
  objectiveSource = replaceOnce(objectiveSource, correctAnswerAnchor, strictHelper, "strict grammar helper");
}

const tolerantBranchBefore = [
  '  if (expectedLetter && normalizeAnswer(student) === normalizeAnswer(expectedLetter)) return true;',
  '  if (item.type === "choice" && item.expectedText) return textMatches(item.expectedText, student);',
  '  const accepted = item.accepted?.length ? item.accepted : [item.expected, item.expectedText, item.expectedRaw].filter(Boolean);',
].join("\n");
const tolerantBranchAfter = [
  '  if (expectedLetter && normalizeAnswer(student) === normalizeAnswer(expectedLetter)) return true;',
  '  if (item.type === "choice" && item.expectedText) return textMatches(item.expectedText, student);',
  '  const accepted = item.accepted?.length ? item.accepted : [item.expected, item.expectedText, item.expectedRaw].filter(Boolean);',
  '  if (item.type === "text" && item.matchingMode === "strict_grammar") {',
  '    return accepted.some((expected) => strictGrammarTextMatches(expected, student));',
  '  }',
].join("\n");
objectiveSource = replaceOnce(objectiveSource, tolerantBranchBefore, tolerantBranchAfter, "strict grammar answer branch");
fs.writeFileSync(objectiveTarget, objectiveSource);

const dictionaryTarget = new URL("../src/data/answers_dictionary.json", import.meta.url);
const dictionary = JSON.parse(fs.readFileSync(dictionaryTarget, "utf8"));
const grammarEntry = Object.values(dictionary).find((entry) => String(entry?.assignment_id || entry?.assignmentId || "").trim().toUpperCase() === "A1-1.2");
if (!grammarEntry) throw new Error("A1-1.2 answer-key entry not found");
grammarEntry.answerMatchingMode = "strict_grammar";
if (grammarEntry.answers && typeof grammarEntry.answers === "object") {
  grammarEntry.answers.Answer6 = "Sie kommt aus Russland / Sie kommen aus Russland";
}
fs.writeFileSync(dictionaryTarget, `${JSON.stringify(dictionary, null, 2)}\n`);

const naturalTarget = new URL("../src/utils/naturalMarkingFeedback.js", import.meta.url);
let naturalSource = fs.readFileSync(naturalTarget, "utf8");
const scoreFieldsBefore = [
  '    writingScore: null,',
  '    writingScorePercent: null,',
  '    maxWritingScore: null,',
  '    status: "marked",',
].join("\n");
const scoreFieldsAfter = [
  '    writingScore: null,',
  '    writingScorePercent: null,',
  '    maxWritingScore: null,',
  '    taskCompletion: null,',
  '    missingTaskPoints: [],',
  '    omittedTaskPoints: [],',
  '    completedTaskPoints: null,',
  '    totalTaskPoints: null,',
  '    writing: result.writing && typeof result.writing === "object" ? {',
  '      ...result.writing,',
  '      taskCompletion: null,',
  '      missingTaskPoints: [],',
  '      completedTaskPoints: null,',
  '      totalTaskPoints: null,',
  '    } : result.writing,',
  '    status: "marked",',
].join("\n");
naturalSource = replaceOnce(naturalSource, scoreFieldsBefore, scoreFieldsAfter, "unregistered writing task metadata");

const aiFieldsBefore = [
  '    ai: {',
  '      ...(result.ai || {}),',
  '      ignoredUnregisteredWritingScore: ignoredWritingScore !== null,',
].join("\n");
const aiFieldsAfter = [
  '    ai: {',
  '      ...(result.ai || {}),',
  '      taskCompletion: null,',
  '      missingTaskPoints: [],',
  '      completedTaskPoints: null,',
  '      totalTaskPoints: null,',
  '      ignoredUnregisteredWritingScore: ignoredWritingScore !== null,',
].join("\n");
naturalSource = replaceOnce(naturalSource, aiFieldsBefore, aiFieldsAfter, "nested unregistered writing task metadata");
fs.writeFileSync(naturalTarget, naturalSource);

const evidenceTarget = new URL("../src/utils/essayFeedbackEvidence.js", import.meta.url);
let evidenceSource = fs.readFileSync(evidenceTarget, "utf8");
const taskStartBefore = [
  'function taskSentence(result = {}) {',
  '  const task = result.taskCompletion || result.writing?.taskCompletion || result.ai?.taskCompletion || {};',
].join("\n");
const taskStartAfter = [
  'function taskSentence(result = {}) {',
  '  if (result.hasRegisteredWriting === false) return "";',
  '  const task = result.taskCompletion || result.writing?.taskCompletion || result.ai?.taskCompletion || {};',
].join("\n");
evidenceSource = replaceOnce(evidenceSource, taskStartBefore, taskStartAfter, "registered task sentence guard");

const taskPluralBefore = [
  '  if (Number.isFinite(completed) && Number.isFinite(total) && total > 0) {',
  '    if (!missing.length && completed >= total) return `You addressed all ${total} task points`;',
  '    return `You covered ${Math.max(0, Math.min(total, completed))} of ${total} task points${missing[0] ? `; ${missing[0]} is missing` : ""}`;',
  '  }',
].join("\n");
const taskPluralAfter = [
  '  if (Number.isFinite(completed) && Number.isFinite(total) && total > 0) {',
  '    const taskPointLabel = total === 1 ? "task point" : "task points";',
  '    if (!missing.length && completed >= total) return `You addressed all ${total} ${taskPointLabel}`;',
  '    return `You covered ${Math.max(0, Math.min(total, completed))} of ${total} ${taskPointLabel}${missing[0] ? `; ${missing[0]} is missing` : ""}`;',
  '  }',
].join("\n");
evidenceSource = replaceOnce(evidenceSource, taskPluralBefore, taskPluralAfter, "task point singular/plural");
fs.writeFileSync(evidenceTarget, evidenceSource);

const deterministicTarget = new URL("../src/utils/finalDeterministicFeedback.js", import.meta.url);
let deterministicSource = fs.readFileSync(deterministicTarget, "utf8");
const reconcileAnchor = 'export function reconcileFinalDeterministicFeedback(result = {}, objectiveResult = {}, submissionText = "") {';
const detectedPartsHelper = [
  'function authoritativeDetectedParts(result = {}, objectiveDetails = {}, objectiveTotal = 0, objectiveCorrect = 0) {',
  '  const groups = new Map();',
  '  Object.values(objectiveDetails || {}).forEach((detail) => {',
  '    if (!detail || typeof detail !== "object") return;',
  '    const partId = String(detail.partId || detail.part || "main").trim() || "main";',
  '    const current = groups.get(partId) || { partId, total: 0, correct: 0, wrong: 0 };',
  '    current.total += 1;',
  '    if (detail.correct === true) current.correct += 1;',
  '    else current.wrong += 1;',
  '    groups.set(partId, current);',
  '  });',
  '',
  '  if (!groups.size && objectiveTotal > 0) {',
  '    groups.set("main", {',
  '      partId: "main",',
  '      total: objectiveTotal,',
  '      correct: objectiveCorrect,',
  '      wrong: Math.max(0, objectiveTotal - objectiveCorrect),',
  '    });',
  '  }',
  '',
  '  const writingParts = Array.isArray(result.detectedParts)',
  '    ? result.detectedParts.filter((part) => String(part?.partType || "").toLowerCase() === "writing")',
  '    : [];',
  '  const objectiveParts = [...groups.values()].map((group) => ({',
  '    partId: group.partId,',
  '    partType: "objective",',
  '    answerCount: group.total,',
  '    total: group.total,',
  '    correct: group.correct,',
  '    wrong: group.wrong,',
  '    summary: `${group.partId}: ${group.total} objective found, ${group.correct} correct, ${group.wrong} wrong`,',
  '  }));',
  '  return [...writingParts, ...objectiveParts];',
  '}',
  '',
  reconcileAnchor,
].join("\n");
if (!deterministicSource.includes("function authoritativeDetectedParts(")) {
  deterministicSource = replaceOnce(deterministicSource, reconcileAnchor, detectedPartsHelper, "authoritative detected parts helper");
}
const wrongAnswersBefore = [
  '    objectiveDetails,',
  '    wrongAnswers,',
  '    aiOriginalFeedback: result.aiOriginalFeedback ?? originalFeedback,',
].join("\n");
const wrongAnswersAfter = [
  '    objectiveDetails,',
  '    wrongAnswers,',
  '    detectedParts: authoritativeDetectedParts(result, objectiveDetails, objectiveTotal, objectiveCorrect),',
  '    aiOriginalFeedback: result.aiOriginalFeedback ?? originalFeedback,',
].join("\n");
deterministicSource = replaceOnce(deterministicSource, wrongAnswersBefore, wrongAnswersAfter, "deterministic detected part replacement");
const aiFlagBefore = [
  '      ...(result.ai || {}),',
  '      finalDeterministicFeedbackReconciled: true,',
].join("\n");
const aiFlagAfter = [
  '      ...(result.ai || {}),',
  '      finalDeterministicFeedbackReconciled: true,',
  '      objectiveDetectedPartsReconciled: true,',
].join("\n");
deterministicSource = replaceOnce(deterministicSource, aiFlagBefore, aiFlagAfter, "deterministic part diagnostic flag");
fs.writeFileSync(deterministicTarget, deterministicSource);

console.log("A1 grammar objectives now require exact sentence forms, Tiel headings are recognized, and objective feedback counts stay authoritative.");
