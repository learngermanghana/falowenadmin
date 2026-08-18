import fs from "node:fs";

const objectiveTarget = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let objectiveSource = fs.readFileSync(objectiveTarget, "utf8");

const previousCompactPattern = '  const compactPattern = /(?:^|\\s)(\\d{1,3})(?:\\s*[).:–-](?!\\d)\\s*|\\s+)(.*?)(?=\\s+\\d{1,3}(?:\\s*[).:–-](?!\\d)\\s*|\\s+)|$)/g;';
const robustCompactPattern = '  const compactPattern = /(?:^|\\s)(\\d{1,3})(?:\\s*[)–-]\\s*|\\s*[.,:](?!\\d)\\s*|\\s+(?=[A-FX](?:\\s*[).,:–-]|\\s|$)))(.*?)(?=\\s+\\d{1,3}(?:\\s*[)–-]\\s*|\\s*[.,:](?!\\d)\\s*|\\s+(?=[A-FX](?:\\s*[).,:–-]|\\s|$)))|$)/g;';
const questionAwareCompactPattern = '  const compactPattern = /(?:^|\\s)(\\d{1,3})\\s*[).:–-]?\\s*(.*?)(?=\\s+\\d{1,3}\\s*[).:–-]?|$)/g;';

if (objectiveSource.includes(previousCompactPattern)) {
  objectiveSource = objectiveSource.replace(previousCompactPattern, robustCompactPattern);
} else if (!objectiveSource.includes(robustCompactPattern) && !objectiveSource.includes(questionAwareCompactPattern)) {
  throw new Error("objective compact-answer parser changed; update patchA1PricePreferenceMarking.mjs");
}

const legacySinglePattern = '  const single = source.match(/^\\s*(?:answer|antwort|frage|aufgabe|task|exercise|nr\\.?|q)?\\s*(\\d{1,3})\\s*[).:–-]?\\s*(.+?)\\s*$/i);';
const commaSafeSinglePattern = '  const single = source.match(/^\\s*(?:answer|antwort|frage|aufgabe|task|exercise|nr\\.?|q)?\\s*(\\d{1,3})\\s*[).,:–-]?\\s*(.+?)\\s*$/i);';
const questionAwareSinglePattern = '  const single = source.match(/^\\s*(?:answer|antwort|frage|question|aufgabe|task|exercise|nr\\.?|q)?\\s*(\\d{1,3})\\s*[).:–-]?\\s*(.+?)\\s*$/i);';
if (objectiveSource.includes(legacySinglePattern)) {
  objectiveSource = objectiveSource.replace(legacySinglePattern, commaSafeSinglePattern);
} else if (!objectiveSource.includes(commaSafeSinglePattern) && !objectiveSource.includes(questionAwareSinglePattern)) {
  throw new Error("objective single-answer parser changed; update patchA1PricePreferenceMarking.mjs");
}

const commaSplitting = '.split(/\\r?\\n|[,;]+/)';
const lineSplitting = '.split(/\\r?\\n/)';
const compactOptionSplitting = '.split(/\\r?\\n|,(?=\\s*\\d{1,3}\\s*[A-FX](?:\\b|[).,:;–-]))/i)';
if (objectiveSource.includes(commaSplitting)) {
  objectiveSource = objectiveSource.split(commaSplitting).join(lineSplitting);
} else if (!objectiveSource.includes(lineSplitting) && !objectiveSource.includes(compactOptionSplitting)) {
  throw new Error("objective line splitting changed; update patchA1PricePreferenceMarking.mjs");
}

const oldTextMatches = `function textMatches(expectedRaw = "", studentRaw = "") {
  const expected = normalizeAnswer(expectedRaw);
  const student = normalizeAnswer(studentRaw);
  if (!expected || !student) return false;
  if (expected === student || expected.includes(student) || student.includes(expected)) return true;
  const expectedRoots = meaningfulRoots(expectedRaw);
  const studentRoots = new Set(meaningfulRoots(studentRaw));
  if (expectedRoots.length && expectedRoots.every((root) => studentRoots.has(root))) return true;
  const expectedStem = rootToken(expected);
  const studentStem = rootToken(student);
  return expectedStem.length >= 4 && studentStem.length >= 4 && (expectedStem.includes(studentStem) || studentStem.includes(expectedStem));
}`;

const improvedTextMatches = `function editDistance(left = "", right = "") {
  const a = String(left || "");
  const b = String(right || "");
  if (!a) return b.length;
  if (!b) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < b.length; j += 1) {
      current[j + 1] = a[i] === b[j]
        ? previous[j]
        : Math.min(previous[j] + 1, current[j] + 1, previous[j + 1] + 1);
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
}

function rootsApproximatelyMatch(expectedRoot = "", studentRoot = "") {
  if (!expectedRoot || !studentRoot) return false;
  if (expectedRoot === studentRoot || expectedRoot.includes(studentRoot) || studentRoot.includes(expectedRoot)) return true;
  const length = Math.max(expectedRoot.length, studentRoot.length);
  const allowance = length >= 4 ? Math.min(3, Math.max(1, Math.floor(length * 0.25))) : 0;
  return allowance > 0 && editDistance(expectedRoot, studentRoot) <= allowance;
}

function textMatches(expectedRaw = "", studentRaw = "") {
  const expected = normalizeAnswer(expectedRaw);
  const student = normalizeAnswer(studentRaw);
  if (!expected || !student) return false;
  if (expected === student || expected.includes(student) || student.includes(expected)) return true;
  const expectedRoots = meaningfulRoots(expectedRaw);
  const studentRoots = meaningfulRoots(studentRaw);
  if (expectedRoots.length && expectedRoots.every((root) => studentRoots.some((candidate) => rootsApproximatelyMatch(root, candidate)))) return true;
  const expectedStem = rootToken(expected);
  const studentStem = rootToken(student);
  return expectedStem.length >= 4 && studentStem.length >= 4 && rootsApproximatelyMatch(expectedStem, studentStem);
}`;

if (objectiveSource.includes(oldTextMatches)) {
  objectiveSource = objectiveSource.replace(oldTextMatches, improvedTextMatches);
} else if (!objectiveSource.includes(improvedTextMatches)) {
  throw new Error("objective text matcher changed; update patchA1PricePreferenceMarking.mjs");
}

fs.writeFileSync(objectiveTarget, objectiveSource);

const feedbackTarget = new URL("../src/utils/essayFeedbackEvidence.js", import.meta.url);
let feedbackSource = fs.readFileSync(feedbackTarget, "utf8");
const levelReplacements = [
  ['  const directMatch = direct.match(/\\b(A2|B1)\\b/);', '  const directMatch = direct.match(/\\b(A1|A2|B1)\\b/);'],
  ['  return assignment.match(/^(A2|B1)[-_.]/)?.[1] || "";', '  return assignment.match(/^(A1|A2|B1)[-_.]/)?.[1] || "";'],
];
for (const [before, after] of levelReplacements) {
  if (feedbackSource.includes(before)) feedbackSource = feedbackSource.replace(before, after);
  else if (!feedbackSource.includes(after)) throw new Error("A1 evidence-feedback level detection changed; update patchA1PricePreferenceMarking.mjs");
}
const a2Branch = '  if (level === "A2") {';
const beginnerBranch = '  if (level === "A1" || level === "A2") {';
if (feedbackSource.includes(a2Branch)) feedbackSource = feedbackSource.split(a2Branch).join(beginnerBranch);
else if (!feedbackSource.includes(beginnerBranch)) throw new Error("A1 evidence-feedback branch changed; update patchA1PricePreferenceMarking.mjs");
fs.writeFileSync(feedbackTarget, feedbackSource);

const dictionaryTarget = new URL("../src/data/answers_dictionary.json", import.meta.url);
const dictionary = JSON.parse(fs.readFileSync(dictionaryTarget, "utf8"));
const assignmentEntry = Object.values(dictionary).find((entry) => String(entry?.assignment_id || entry?.assignmentId || "").trim().toUpperCase() === "A1-3");
if (!assignmentEntry) throw new Error("A1-3 answer-key entry not found");

assignmentEntry.expectedParts = ["teil1", "teil2", "teil3"];
assignmentEntry.writingParts = ["teil2"];
assignmentEntry.aiGradedParts = ["teil2"];
assignmentEntry.referenceAnswerParts = ["teil1", "teil3"];
assignmentEntry.answerLayout = "multipart";
assignmentEntry.partGrading = {
  ...(assignmentEntry.partGrading || {}),
  teil2: {
    label: "Teil 2 Schreiben",
    hasReferenceAnswers: false,
    gradingMode: "ai_written_response",
    instruction: "Teil 2 is a Schreiben/writing part. Grade it with AI using A1 task completion, understandable sentences, basic verb forms, spelling, capitalization, plural forms, vocabulary, and clarity. Do not mark it wrong because there is no fixed reference answer.",
  },
};

fs.writeFileSync(dictionaryTarget, `${JSON.stringify(dictionary, null, 2)}\n`);
console.log("A1-3 now preserves complete comma answers, price values, tolerant preference wording, registered Teil 2 writing, and specific A1 writing evidence.");
