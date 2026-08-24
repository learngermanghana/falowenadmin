import fs from "node:fs";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`${label} anchor changed; update patchObjectiveGrammarConsistency.mjs`);
  return source.replace(before, after);
}

// Objective grammar behavior is now committed directly in objectiveMarking.js.
// Keep this lifecycle patch focused on the remaining cross-file feedback safeguards.
const objectiveTarget = new URL("../src/utils/objectiveMarking.js", import.meta.url);
const objectiveSource = fs.readFileSync(objectiveTarget, "utf8");
for (const required of [
  "matchingMode: String(",
  "function subjectVerbGrammarMatches(",
  'item.matchingMode === "subject_verb"',
]) {
  if (!objectiveSource.includes(required)) {
    throw new Error(`Committed objective grammar behavior is missing: ${required}`);
  }
}

const dictionaryTarget = new URL("../src/data/answers_dictionary.json", import.meta.url);
const dictionary = JSON.parse(fs.readFileSync(dictionaryTarget, "utf8"));
const grammarEntry = Object.values(dictionary).find((entry) => String(entry?.assignment_id || entry?.assignmentId || "").trim().toUpperCase() === "A1-1.2");
if (!grammarEntry) throw new Error("A1-1.2 answer-key entry not found");
if (grammarEntry.answerMatchingMode !== "subject_verb") {
  throw new Error('A1-1.2 must commit answerMatchingMode: "subject_verb"');
}
if (grammarEntry.answers?.Answer6 !== "Sie kommt aus Russland / Sie kommen aus Russland") {
  throw new Error("A1-1.2 Answer6 must commit both accepted Russland forms");
}

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

console.log("Committed A1 grammar rules verified; cross-file objective feedback safeguards applied.");
