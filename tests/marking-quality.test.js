import test from "node:test";
import assert from "node:assert/strict";
import { exactObjectiveFeedback, markingConsistencyWarnings, reconcileMarkingQuality } from "../src/utils/markingQuality.js";
import { withResubmissionComparison } from "../src/utils/resubmissionFeedback.js";
const objective = { correctCount: 2, totalCount: 2, details: { "teil3.1": { partId: "teil3", student: "A", expected: "A", correct: true }, "teil4.1": { partId: "teil4", student: "B", expected: "B", correct: true } } };
test("objective-only comments use the verified answers instead of AI deductions", () => {
  const result = reconcileMarkingQuality({ feedback: "Your listening has errors. Improve your writing.", finalScore: 100 }, objective, {}, { writingExpected: false });
  assert.equal(result.feedback, "Teil 3: 1/1 correct. Teil 4: 1/1 correct. All objective answers are correct.");
  assert.equal(result.shouldSendAutomatically, false);
});
test("mixed comments separate writing advice from exact objective feedback", () => {
  const result = reconcileMarkingQuality({ feedback: "✅ Check verb placement. Your listening has mistakes.", writingScorePercent: 80, finalScore: 92 }, objective, { text: "Ich gehe morgen.", previousScore: 80, attempt: 2 }, { writingExpected: true });
  assert.match(result.feedback, /Check verb placement/);
  assert.match(result.feedback, /All objective answers are correct/);
  assert.doesNotMatch(result.feedback, /listening has mistakes|✅/);
  assert.match(result.feedback, /80% to 92%/);
});
test("wrong answers are identified with submitted and expected values", () => {
  const wrong = { correctCount: 0, totalCount: 1, details: { "teil4.1": { partId: "teil4", student: "A", expected: "B", correct: false } } };
  assert.match(exactObjectiveFeedback(wrong, 100), /your answer A; correct answer B/);
  assert.doesNotMatch(exactObjectiveFeedback(wrong), /All objective answers are correct/);
});
test("flags fabricated writing corrections and unsupported low scores without changing them", () => {
  const result = { feedback: "Only minor spelling corrections are needed.", writingScorePercent: 35, finalScore: 35, taskPointEvidence: [{ label: "Ask the price", status: "met", evidence: "Wie viel kostet der Kurs?" }], corrections: [{ from: "Ich bist", to: "Ich bin" }] };
  const warnings = markingConsistencyWarnings(result, { text: "Wie viel kostet der Kurs?" });
  assert.ok(warnings.some((warning) => warning.includes("not present")));
  assert.ok(warnings.some((warning) => warning.includes("low writing score")));
  assert.equal(result.finalScore, 35);
});
test("flags task, assignment, objective and final score contradictions", () => {
  const result = { feedback: "Listening answers are incorrect. A required task point is missing. Final score: 70.", assignmentKey: "A2-3.7", finalScore: 92, objectiveDetails: objective.details, taskPointEvidence: [{ status: "met", label: "Describe the room", evidence: "Mein Zimmer ist hell." }] };
  const warnings = markingConsistencyWarnings(result, { text: "Mein Zimmer ist hell.", assignmentId: "A2-3.6" }, 80);
  assert.ok(warnings.some((warning) => warning.includes("objective mistakes")));
  assert.ok(warnings.some((warning) => warning.includes("missing task point")));
  assert.ok(warnings.some((warning) => warning.includes("assignment")));
  assert.ok(warnings.some((warning) => warning.includes("calculated score")));
  assert.ok(warnings.some((warning) => warning.includes("written in the feedback")));
});

test("mixed marking keeps the current writing score, names every wrong objective question, and accepts split task evidence", () => {
  const mixedObjective = {
    correctCount: 7,
    totalCount: 10,
    details: {
      "teil3.1": { partId: "teil3", student: "C", expectedDisplay: "B) Drei Nächte", correct: false },
      "teil3.2": { partId: "teil3", student: "C", expectedDisplay: "C) 82 Euro", correct: true },
      "teil3.3": { partId: "teil3", student: "B", expectedDisplay: "B) Frühstück", correct: true },
      "teil3.4": { partId: "teil3", student: "D", expectedDisplay: "C) Ab 14 Uhr", correct: false },
      "teil3.5": { partId: "teil3", student: "B", expectedDisplay: "B) Rezeption informieren", correct: true },
      "teil4.1": { partId: "teil4", student: "C", expectedDisplay: "C) teuer und voll", correct: true },
      "teil4.2": { partId: "teil4", student: "A", expectedDisplay: "B) Wörthersee", correct: false },
      "teil4.3": { partId: "teil4", student: "A", expectedDisplay: "A) Campingplatz", correct: true },
      "teil4.4": { partId: "teil4", student: "C", expectedDisplay: "C) 15. bis 22. Juli", correct: true },
      "teil4.5": { partId: "teil4", student: "B", expectedDisplay: "B) Lebensmittel und Packliste", correct: true },
    },
  };
  const submission = {
    assignmentId: "A2-4.9",
    text: "TEIL 2\nWie viel kostet eine Nacht? Ist frühstück und WLAN im Gesamtpreis enthalten?\nTEIL 3\n1. C\n2. C\n3. B\n4. D\n5. B\nTEIL 4\n1. C\n2. A\n3. A\n4. C\n5. B",
  };
  const result = reconcileMarkingQuality({
    assignmentKey: "A2-4.9",
    writingScorePercent: 80,
    writingScore: 80,
    finalScore: 74,
    feedback: "Writing score: 82%. You covered all 3 required points. You covered all 3 required points.",
    taskPointEvidence: [{
      label: "Ask about the price and additional services",
      status: "met",
      evidence: "Wie viel kostet eine Nacht? | Ist frühstück und WLAN im Gesamtpreis enthalten?",
    }],
  }, mixedObjective, submission, { writingExpected: true, wordTarget: 40 });

  assert.match(result.feedback, /Writing score: 80%/);
  assert.doesNotMatch(result.feedback, /Writing score: 82%/);
  assert.equal((result.feedback.match(/You covered all 3 required points\./g) || []).length, 1);
  assert.match(result.feedback, /Teil 4 question 2/);
  assert.doesNotMatch(result.feedback, /Review all flagged answers/);
  assert.doesNotMatch(result.consistencyWarnings.join(" "), /Task evidence for/);
});

test("resubmissions without a previous score do not invent a zero baseline", () => {
  assert.equal(withResubmissionComparison({ finalScore: 80, feedback: "Good work." }, { attempt: 2 }).feedback, "Good work.");
});

test("writing revision excerpts exclude objective answer changes", async () => {
  const { compareWritingRevisions } = await import("../src/utils/markingQuality.js");
  const previous = "TEIL 2\nIch habe ein Zimmer.\nTEIL 3\n1. A";
  assert.equal(compareWritingRevisions(previous, "TEIL 2\nIch habe ein Zimmer.\nTEIL 3\n1. B").changed, false);
  const changed = compareWritingRevisions(previous, "TEIL 2\nIch habe ein helles Zimmer.\nTEIL 3\n1. B");
  assert.equal(changed.changed, true);
  assert.deepEqual(changed.added, ["Ich habe ein helles Zimmer."]);
});

test("zero is savable only with complete objective evidence and no writing score", async () => {
  const { verifiedObjectiveZero } = await import("../src/utils/markingQuality.js");
  const result = { finalScore: 0, objectiveCorrect: 0, objectiveTotal: 1, objectiveDetails: { q1: { correct: false } }, writingScorePercent: null };
  assert.equal(verifiedObjectiveZero(result), true);
  assert.equal(verifiedObjectiveZero({ ...result, objectiveDetails: {} }), false);
  assert.equal(verifiedObjectiveZero({ ...result, writingScorePercent: 0 }), false);
});

test("objective corrections display single letters without quotation marks", async () => {
  const { plainObjectiveAnswer } = await import("../src/utils/markingFeedbackText.js");
  for (const value of ['A', '"A"', '""A"', '“A”', "'a'"]) assert.equal(plainObjectiveAnswer(value), "A");
  assert.equal(plainObjectiveAnswer("Richtig"), "Richtig");
  const objective = { correctCount: 0, totalCount: 1, details: { "teil1.1": { partId: "teil1", student: '"A"', expected: '"B"', correct: false } } };
  assert.match(exactObjectiveFeedback(objective), /your answer A; correct answer B/);
  assert.doesNotMatch(exactObjectiveFeedback(objective), /["“”]/);
});
