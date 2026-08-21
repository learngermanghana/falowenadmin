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

fs.writeFileSync(autoTarget, autoSource);

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
console.log("A2 feedback now respects comma greetings and includes exact deterministic corrections.");
