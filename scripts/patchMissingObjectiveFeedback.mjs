import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) throw new Error(`${label} anchor changed; update patchMissingObjectiveFeedback.mjs`);
  return source.replace(search, replacement);
}

const feedbackTarget = new URL("../src/utils/naturalMarkingFeedback.js", import.meta.url);
let feedbackSource = fs.readFileSync(feedbackTarget, "utf8");

feedbackSource = replaceOnce(
  feedbackSource,
  '      rows.push({ ...identity, correct: detail.correct === true });',
  '      rows.push({\n        ...identity,\n        correct: detail.correct === true,\n        expected: String(detail?.expectedDisplay || detail?.expected || detail?.rawExpected || "").trim(),\n        student: String(detail?.student || detail?.submitted || "").trim(),\n        answerRecorded: Object.prototype.hasOwnProperty.call(detail, "student") || Object.prototype.hasOwnProperty.call(detail, "submitted"),\n      });',
  "objective detail answer-presence preservation",
);

feedbackSource = replaceOnce(
  feedbackSource,
  '        student: String(detail?.student || detail?.submitted || "").trim(),\n      });',
  '        student: String(detail?.student || detail?.submitted || "").trim(),\n        answerRecorded: Object.prototype.hasOwnProperty.call(detail || {}, "student") || Object.prototype.hasOwnProperty.call(detail || {}, "submitted"),\n      });',
  "wrong-answer presence preservation",
);

feedbackSource = replaceOnce(
  feedbackSource,
  '  authoritativeWrongRows(result).forEach((row) => {\n    const key = row.part || "main";',
  '  authoritativeWrongRows(result).forEach((row) => {\n    if (row.answerRecorded && !row.student) return;\n    const key = row.part || "main";',
  "exclude omitted answers from wrong-answer review groups",
);

const missingHelperAnchor = 'function exactObjectiveCorrections(result = {}) {';
const missingHelper = `function groupedMissingQuestions(result = {}) {
  const groups = new Map();
  authoritativeWrongRows(result).forEach((row) => {
    if (!(row.answerRecorded && !row.student)) return;
    const key = row.part || "main";
    const current = groups.get(key) || [];
    current.push(row.question);
    groups.set(key, current);
  });
  return groups;
}

${missingHelperAnchor}`;
feedbackSource = replaceOnce(feedbackSource, missingHelperAnchor, missingHelper, "missing objective grouping helper");

feedbackSource = replaceOnce(
  feedbackSource,
  '    .filter((row) => row.question && row.expected)',
  '    .filter((row) => row.question && row.expected && !(row.answerRecorded && !row.student))',
  "exclude omitted answers from exact correction list",
);

feedbackSource = replaceOnce(
  feedbackSource,
  '  const wrongGroups = groupedWrongQuestions(result);\n  const perfectParts = perfectObjectiveParts(result);',
  '  const wrongGroups = groupedWrongQuestions(result);\n  const missingGroups = groupedMissingQuestions(result);\n  const perfectParts = perfectObjectiveParts(result);',
  "missing objective groups collection",
);

const groupedEntriesAnchor = '  const groupedEntries = [...wrongGroups.entries()];';
const missingFeedback = [
  '  const missingEntries = [...missingGroups.entries()];',
  '  if (missingEntries.length === 1) {',
  '    const [part, questions] = missingEntries[0];',
  '    const prefix = part === "main" ? "" : `In ${part}, `;',
  '    objectiveSentences.push(`${prefix}question${questions.length === 1 ? "" : "s"} ${humanList(questions)} ${questions.length === 1 ? "was" : "were"} not answered`);',
  '  } else if (missingEntries.length > 1) {',
  '    const descriptions = missingEntries.map(([part, questions]) => `${part === "main" ? "questions" : part} ${humanList(questions)}`);',
  '    objectiveSentences.push(`Not answered: ${humanList(descriptions)}`);',
  '  }',
  '',
  groupedEntriesAnchor,
].join("\n");
feedbackSource = replaceOnce(feedbackSource, groupedEntriesAnchor, missingFeedback, "missing objective feedback sentence");

fs.writeFileSync(feedbackTarget, feedbackSource);

const markingTarget = new URL("../src/pages/MarkingPage.jsx", import.meta.url);
let markingSource = fs.readFileSync(markingTarget, "utf8");
markingSource = replaceOnce(
  markingSource,
  '>Wrong objective answers</div>',
  '>Objective answers to review</div>',
  "objective issue table title",
);
markingSource = replaceOnce(
  markingSource,
  '<td style={{ padding: 6, borderBottom: "1px solid #ffedd5" }}>Wrong</td>',
  '<td style={{ padding: 6, borderBottom: "1px solid #ffedd5" }}>{String(row.student || row.submitted || "").trim() ? "Wrong" : "Not answered"}</td>',
  "objective issue status",
);
fs.writeFileSync(markingTarget, markingSource);

const { buildNaturalStudentFeedback } = await import(`${feedbackTarget.href}?missing-objective=${Date.now()}`);
const regressionSubmission = `Teil 2 · Schreiben : Sind persönliche Kontakte hilfreicher als Online-Portale?

Heutzutage ist die Wohnungssuche besonders in Großstädten sehr schwierig. Ich bin der Meinung, dass persönliche Kontakte hilfreicher sind, weil es weniger Konkurrenz gibt. Einerseits bieten Online-Portale viele Anzeigen, und man kann Wohnungen einfach vergleichen. Andererseits bewerben sich dort sehr viele Menschen. Bei einer Besichtigung in Hamburg waren einmal etwa dreißig Interessenten dabei. Durch persönliche Kontakte erfährt man oft früher von freien Wohnungen. Deshalb glaube ich, dass Kontakte bessere Chancen bieten. Zusammenfassend sollte man beide Methoden nutzen, aber persönliche Kontakte bevorzugen.

Teil 3 · Lesen: 1B, 2A, 3B, 4B, 5A

Teil 4 · Hören: 1B, 2C, 3B, 4B, 5B`;
const objectiveDetails = {};
for (let question = 1; question <= 7; question += 1) {
  objectiveDetails[`teil3.${question}`] = {
    correct: question <= 5,
    partId: "teil3",
    student: question <= 5 ? ["B", "A", "B", "B", "A"][question - 1] : "",
    expected: question === 6 ? "A" : question === 7 ? "B" : ["B", "A", "B", "B", "A"][question - 1],
  };
}
for (let question = 1; question <= 5; question += 1) {
  objectiveDetails[`teil4.${question}`] = {
    correct: true,
    partId: "teil4",
    student: ["B", "C", "B", "B", "B"][question - 1],
    expected: ["B", "C", "B", "B", "B"][question - 1],
  };
}
const regressionFeedback = buildNaturalStudentFeedback({
  studentName: "Student",
  level: "B1",
  assignmentKey: "B1-2.4",
  objectiveScore: 83,
  objectiveCorrect: 10,
  objectiveTotal: 12,
  objectiveDetails,
  writingScore: 82,
  writingScorePercent: 82,
}, regressionSubmission);
if (!/In Teil 3, questions 6 and 7 were not answered/i.test(regressionFeedback)) {
  throw new Error(`Missing-objective feedback regression failed: ${regressionFeedback}`);
}
if (/review questions 6 and 7/i.test(regressionFeedback)) {
  throw new Error(`Omitted answers were mislabeled as ordinary wrong answers: ${regressionFeedback}`);
}

console.log("Missing objective answers are now labeled as not answered in both tutor feedback and the review table.");
