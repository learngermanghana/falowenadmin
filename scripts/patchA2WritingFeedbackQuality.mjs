import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) throw new Error(`${label} anchor changed; update patchA2WritingFeedbackQuality.mjs`);
  return source.replace(search, replacement);
}

const autoTarget = new URL("../src/utils/autoMarking.js", import.meta.url);
let autoSource = fs.readFileSync(autoTarget, "utf8");

autoSource = replaceOnce(
  autoSource,
  '    if (/^[a-zäöüß]/.test(line) && !/[,;:]$/.test(previousLine)) {',
  '    const followsCommaGreeting = isWritingGreetingLine(previousLine) && /,$/.test(previousLine.trim());\n    if (/^[a-zäöüß]/.test(line) && !followsCommaGreeting && !/[,;:]$/.test(previousLine)) {',
  "German letter greeting capitalization",
);

autoSource = replaceOnce(
  autoSource,
  '  const connector = String(text || "").match(/\\b(?:weil|danach|zuerst|außerdem|ausserdem|deshalb|aber|und)\\b/i);\n  if (connector) strengths.push(`connector ${highlightWritingSnippet(connector[0])}`);',
  '  const connectorPriority = ["deshalb", "weil", "außerdem", "ausserdem", "aber", "danach", "zuerst", "trotzdem", "denn", "dass", "und"];\n  const connector = connectorPriority.find((value) => new RegExp(`\\\\b${value}\\\\b`, "i").test(String(text || "")));\n  if (connector && connector !== "und") strengths.push(`connector ${highlightWritingSnippet(connector === "ausserdem" ? "außerdem" : connector)}`);',
  "connector strength priority",
);

autoSource = replaceOnce(
  autoSource,
  'function buildWritingFeedback({ level = "", score = 0, rubric = [], text = "" } = {}) {',
  'function connectorRangeSuggestion(text = "", level = "") {\n  const normalized = normalizeForCompare(text);\n  const normalizedLevel = String(level || "").toUpperCase();\n  if (!["A2", "B1"].includes(normalizedLevel)) return "";\n  const catalog = [["weil", "weil"], ["deshalb", "deshalb"], ["aber", "aber"], ["ausserdem", "außerdem"], ["danach", "danach"], ["trotzdem", "trotzdem"]];\n  const used = catalog.filter(([token]) => new RegExp(`\\\\b${token}\\\\b`, "i").test(normalized));\n  if (!used.length) return "";\n  const usedTokens = new Set(used.map(([token]) => token));\n  const unused = catalog.filter(([token]) => !usedTokens.has(token)).map(([, label]) => label);\n  if (!unused.length) return "";\n  const suggestions = unused.slice(0, 2);\n  return `To vary your connectors, try “${suggestions[0]}”${suggestions[1] ? ` or “${suggestions[1]}”` : ""} in another sentence.`;\n}\n\nfunction buildWritingFeedback({ level = "", score = 0, rubric = [], text = "" } = {}) {',
  "connector range suggestion helper",
);

autoSource = replaceOnce(
  autoSource,
  '  const strengths = extractWritingStrengths(text);\n  const issues = findWritingIssues(text);',
  '  const strengths = extractWritingStrengths(text);\n  const connectorSuggestion = connectorRangeSuggestion(text, level);\n  const issues = findWritingIssues(text);',
  "connector suggestion collection",
);

autoSource = replaceOnce(
  autoSource,
  '  return `Writing marked with ${level || "default"} rubric (${rubric.join(", ")}). Writing score: ${score}%. ${strengthText} ${issueText}`;',
  '  return `Writing marked with ${level || "default"} rubric (${rubric.join(", ")}). Writing score: ${score}%. ${strengthText} ${issueText}${connectorSuggestion ? ` ${connectorSuggestion}` : ""}`;',
  "connector suggestion output",
);

fs.writeFileSync(autoTarget, autoSource);

const objectiveTarget = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let objectiveSource = fs.readFileSync(objectiveTarget, "utf8");
objectiveSource = replaceOnce(
  objectiveSource,
  '  return Object.entries(VOCABULARY_ALIASES).find(([, aliases]) => aliases.some((alias) => normalized.includes(alias)))?.[0] || "";',
  '  const words = new Set(normalized.split(/\\s+/).filter(Boolean));\n  return Object.entries(VOCABULARY_ALIASES).find(([, aliases]) => aliases.some((alias) => words.has(normalizeAnswer(alias))))?.[0] || "";',
  "vocabulary alias whole-word matching",
);
fs.writeFileSync(objectiveTarget, objectiveSource);

const evidenceTarget = new URL("../src/utils/essayFeedbackEvidence.js", import.meta.url);
let evidenceSource = fs.readFileSync(evidenceTarget, "utf8");

evidenceSource = replaceOnce(
  evidenceSource,
  'function nextStepOf(result, submission, level, correction, seed, history) {',
  'function connectorDevelopmentSuggestion(source = "", level = "") {\n  const matches = [...String(source || "").matchAll(/\\b(weil|deshalb|aber|außerdem|ausserdem|dann|danach|trotzdem)\\b/gi)];\n  const used = [...new Set(matches.map((match) => String(match[1] || "").toLowerCase().replace("ausserdem", "außerdem")))];\n  if (!used.length) return "Connect two ideas with words such as “weil”, “aber” or “deshalb”";\n  if (String(level || "").toUpperCase() !== "A2") return "";\n  const candidates = ["außerdem", "aber", "danach", "trotzdem"].filter((connector) => !used.includes(connector));\n  if (!candidates.length) return "";\n  const examples = candidates.slice(0, 2);\n  const usedExamples = used.filter((connector) => connector !== "und").slice(0, 2);\n  const praise = usedExamples.length ? `You already use ${usedExamples.map((connector) => `“${connector}”`).join(" and ")}; ` : "";\n  return `${praise}next time add ${examples.map((connector) => `“${connector}”`).join(" or ")} to vary how you connect ideas`;\n}\n\nfunction nextStepOf(result, submission, level, correction, seed, history) {',
  "A2 connector development helper",
);

evidenceSource = replaceOnce(
  evidenceSource,
  '  if (level === "A1" || level === "A2") {\n    if (/\\bweil\\s+ich\\s+(?:möchte|kann|muss|will)\\b/i.test(source)) choices.push("For the next task, place the conjugated verb at the end after “weil”");\n    if (!/\\b(?:weil|aber|deshalb|dann)\\b/i.test(source)) choices.push("Connect two ideas with words such as “weil”, “aber” or “deshalb”");\n  } else {',
  '  if (level === "A1" || level === "A2") {\n    if (/\\bweil\\s+ich\\s+(?:möchte|kann|muss|will)\\b/i.test(source)) choices.push("For the next task, place the conjugated verb at the end after “weil”");\n    const connectorDevelopment = connectorDevelopmentSuggestion(source, level);\n    if (connectorDevelopment) choices.push(connectorDevelopment);\n  } else {',
  "A2 connector development next step",
);

fs.writeFileSync(evidenceTarget, evidenceSource);

const feedbackTarget = new URL("../src/utils/naturalMarkingFeedback.js", import.meta.url);
let feedbackSource = fs.readFileSync(feedbackTarget, "utf8");

feedbackSource = replaceOnce(
  feedbackSource,
  '      rowsByIdentity.set(key, { ...identity, correct: false });',
  '      rowsByIdentity.set(key, {\n        ...identity,\n        correct: false,\n        expected: String(detail?.expectedDisplay || detail?.expected || "").trim(),\n        student: String(detail?.student || detail?.submitted || "").trim(),\n      });',
  "objective correction detail preservation",
);

feedbackSource = replaceOnce(
  feedbackSource,
  'function groupedWrongQuestions(result = {}) {\n  const groups = new Map();',
  'function groupedWrongQuestions(result = {}) {\n  const groups = new Map();',
  "grouped wrong questions",
);

const helperAnchor = 'function groupedWrongQuestions(result = {}) {\n  const groups = new Map();\n  authoritativeWrongRows(result).forEach((row) => {\n    const key = row.part || "main";\n    const current = groups.get(key) || [];\n    current.push(row.question);\n    groups.set(key, current);\n  });\n  return groups;\n}\n';
const helperReplacement = `${helperAnchor}\nfunction exactObjectiveCorrections(result = {}) {\n  return authoritativeWrongRows(result)\n    .filter((row) => row.question && row.expected)\n    .slice(0, 6)\n    .map((row) => {\n      const location = row.part && row.part !== "main" ? \`${'${row.part.replace(/^Teil /, "Teil ")}'} question ${'${row.question}'}\` : \`question ${'${row.question}'}\`;\n      const submitted = row.student ? \` (your answer: ${'${row.student}'})\` : "";\n      return \`${'${location}'} → ${'${row.expected}'}${'${submitted}'}\`;\n    });\n}\n`;
feedbackSource = replaceOnce(feedbackSource, helperAnchor, helperReplacement, "exact objective correction helper");

feedbackSource = replaceOnce(
  feedbackSource,
  '  const perfectParts = perfectObjectiveParts(result);\n  const objectiveSentences = [];',
  '  const perfectParts = perfectObjectiveParts(result);\n  const exactCorrections = exactObjectiveCorrections(result);\n  const objectiveSentences = [];',
  "exact objective correction collection",
);

const legacyExactCorrectionFeedback = '  if (exactCorrections.length) {\n    objectiveSentences.push(`Correct answers: ${exactCorrections.join("; ")}`);\n  }';
const previousPassingExactCorrectionFeedback = '  if (objectiveScore !== null && objectiveScore >= 60 && exactCorrections.length) {\n    objectiveSentences.push(`Correct answers: ${exactCorrections.join("; ")}`);\n  }';
const passingExactCorrectionFeedback = '  const resolvedObjectiveScore = objectiveScore ?? (objectiveTotal > 0 ? Math.round((objectiveCorrect / objectiveTotal) * 100) : null);\n  if (resolvedObjectiveScore !== null && resolvedObjectiveScore >= 60 && exactCorrections.length) {\n    objectiveSentences.push(`Correct answers: ${exactCorrections.join("; ")}`);\n  }';
if (feedbackSource.includes(legacyExactCorrectionFeedback)) {
  feedbackSource = feedbackSource.replace(legacyExactCorrectionFeedback, passingExactCorrectionFeedback);
} else if (feedbackSource.includes(previousPassingExactCorrectionFeedback)) {
  feedbackSource = feedbackSource.replace(previousPassingExactCorrectionFeedback, passingExactCorrectionFeedback);
} else {
  feedbackSource = replaceOnce(
    feedbackSource,
    '  const essayFeedback = buildEvidenceEssayFeedback({ result, submissionText, objectiveSentences });',
    `${passingExactCorrectionFeedback}\n\n  const essayFeedback = buildEvidenceEssayFeedback({ result, submissionText, objectiveSentences });`,
    "passing-score objective correction feedback",
  );
}

fs.writeFileSync(feedbackTarget, feedbackSource);
console.log("A2 feedback now respects comma greetings, preserves exact deterministic corrections, develops connector range, and uses whole-word vocabulary aliases.");
