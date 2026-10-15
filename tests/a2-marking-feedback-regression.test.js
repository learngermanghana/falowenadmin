import test from "node:test";
import assert from "node:assert/strict";
import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { evaluateWritingTaskEvidence } from "../src/utils/writingTaskEvidence.js";
import { applyQuestionAwareWritingGuard } from "../src/utils/questionAwareWritingMarking.js";
import { comparePublishedAnswerKeys } from "../src/utils/publishedMarkingContract.js";
import { dedupeRepeatedFeedback, limitFeedbackWords } from "../src/utils/feedbackPolicy.js";
import { reconcileMarkingQuality } from "../src/utils/markingQuality.js";

const victoriaSubmission = [
  "TEIL 2",
  "Sehr geehrte Frau Müller",
  "ich schreibe Ihnen ,weil ich über eine offene Stelle in Ihrem Beruf frage.",
  "Erstens, ich bin Ärztin mit fünf Jahren Berufserfahrung.",
  "Ich bin organisiert, klug und gute Teamplayerin.",
  "Außerdem habe ich alle notwendigen Fähigkeiten, die ein Darmarzt braucht.",
  "Zum Schluss, Ich möchte wissen, wie die Arbeitszeiten sind und an welchen Tagen ich arbeiten muss.",
  "Ich möchte wissen, wie hoch das Gehalt ist.",
  "Ich freue mich auf Ihre Antwort.",
  "Mit freundlichen Grüßen",
  "Victoria Odoom",
  "TEIL 3",
  "1. A",
].join("\n");

test("A2-5.12 does not count merely mentioning an open vacancy as asking whether it exists", () => {
  const task = getA2WritingTaskSpec("A2-5.12");
  const evidence = evaluateWritingTaskEvidence(task, victoriaSubmission.split("TEIL 3")[0]);
  assert.equal(evidence.length, 3);
  assert.deepEqual(evidence.map((point) => point.status), ["missing", "met", "met"]);
  assert.match(evidence[0].label, /open positions/i);
});

test("A2-5.12 accepts direct and indirect vacancy inquiries with both hours and salary", () => {
  const task = getA2WritingTaskSpec("A2-5.12");
  const opening = "Sehr geehrte Frau Müller,\nich habe fünf Jahre Berufserfahrung und gute Fähigkeiten. Wie sind die Arbeitszeiten und wie hoch ist das Gehalt?";
  for (const inquiry of ["Gibt es noch offene Stellen?", "Ich möchte wissen, ob es noch offene Stellen gibt."]) {
    const evidence = evaluateWritingTaskEvidence(task, opening + "\n" + inquiry);
    assert.deepEqual(evidence.map((point) => point.status), ["met", "met", "met"]);
    assert.match(evidence[0].evidence, /offene Stellen/i);
  }
  const noSalary = evaluateWritingTaskEvidence(task, opening.replace(" und wie hoch ist das Gehalt", "") + "\nGibt es noch offene Stellen?");
  assert.equal(noSalary[2].status, "missing");
});

test("A2-5.12 does not confuse a vacancy availability inquiry with a working-hours question", () => {
  const task = getA2WritingTaskSpec("A2-5.12");
  const example = "Sehr geehrte Damen und Herren,\\nIch habe fünf Jahre Berufserfahrung und gute Fähigkeiten. Wie sind die Arbeitszeiten für diese Stelle? Wie hoch ist das Gehalt?";
  const points = evaluateWritingTaskEvidence(task, example);
  assert.deepEqual(points.map(point => point.status), ["missing", "met", "met"]);
});

test("answer key comparison treats E and F as formatted letter choices", () => {
  assert.equal(comparePublishedAnswerKeys({ teil3: { Answer1: "F", Answer2: "E" } }, { teil3: { Answer1: "F) Anzeige F", Answer2: "E) Anzeige E" } }).safe, true);
});

test("feedback cap retains a useful correction following short praise", () => {
  const long = "Strong work on the content. Correct the position of the conjugated verb in each dependent clause, especially after weil and wenn, and review the agreement in these several long examples before making the final version.";
  const clipped = limitFeedbackWords(long, 20);
  assert.match(clipped, /Correct the position/i);
  assert.ok(clipped.split(/\\s+/).length <= 20);
});

test("A2-5.12 question-aware guard caps unjustified full-content scores without changing objective credit", () => {
  const result = applyQuestionAwareWritingGuard({
    level: "A2",
    assignmentKey: "A2-5.12",
    objectiveScore: 100,
    objectiveCorrect: 10,
    objectiveTotal: 10,
    writingScore: 86,
    writingScorePercent: 86,
    finalScore: 94,
    score: 94,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    feedback: "You covered all 3 required points.",
    status: "marked",
  }, {
    referenceEntry: { assignmentKey: "A2-5.12", level: "A2", writingParts: ["teil2"] },
    submission: { assignmentKey: "A2-5.12", level: "A2" },
  }, victoriaSubmission);
  assert.deepEqual(result.taskPointEvidence.map((point) => point.status), ["missing", "met", "met"]);
  assert.equal(result.taskCompletion.completed, 2);
  assert.equal(result.writingScorePercent, 80);
  assert.equal(result.finalScore, 92);
  assert.equal(result.objectiveScore, 100);
  assert.equal(result.status, "needs_review");
  assert.doesNotMatch(result.feedback, /You covered all 3 required points/i);
});

test("student feedback strips interrupted instructions and repeated task claims", () => {
  const feedback = "Your formal email has a clear purpose. Remove the You covered all 3 required points. You covered all 3 required points. Teil 3: 5/5 correct.";
  const result = dedupeRepeatedFeedback(feedback);
  assert.doesNotMatch(result, /Remove the You|Remove the$/i);
  assert.equal((result.match(/You covered all 3 required points/g) || []).length, 1);

  const long = "Your formal email clearly explains your professional experience. Remove the comma after Zum Schluss, and fix the verb position. Teil 3: 5/5 correct.";
  const clipped = limitFeedbackWords(long, 13);
  assert.equal(clipped, "Your formal email clearly explains your professional experience.");
  assert.doesNotMatch(clipped, /Remove the/);
});

test("staff key comparison ignores choice-label formatting but names real mismatches", () => {
  const plain = { teil3: { Answer1: "A" }, teil4: { Answer1: "B" } };
  const labelled = { teil3: { Answer1: "A) Anzeige A" }, teil4: { Answer1: "B) Tierärztin" } };
  assert.equal(comparePublishedAnswerKeys(plain, labelled).safe, true);
  const different = structuredClone(labelled);
  different.teil4.Answer1 = "C) Tierarzt";
  const checked = comparePublishedAnswerKeys(plain, different);
  assert.equal(checked.safe, false);
  assert.match(checked.reason, /teil4\.answer1/);
  assert.match(checked.reason, /Admin: B; coursebook: C\) Tierarzt/);
  const conflictingDescription = comparePublishedAnswerKeys(labelled, {
    ...labelled, teil4: { Answer1: "B) Lehrer" },
  });
  assert.equal(conflictingDescription.safe, false);
});

test("formal salutation feedback replaces false ich capitalization with the missing comma", () => {
  const objective = {
    correctCount: 2, totalCount: 2,
    details: {
      "teil3.1": { partId: "teil3", correct: true, student: "A", expected: "A" },
      "teil4.1": { partId: "teil4", correct: true, student: "B", expected: "B" },
    },
  };
  const source = "Review exact wording: Write \"Ich schreibe Ihnen ,weil ich über eine offene Stelle in Ihrem Beruf frage.\" instead of \"ich schreibe Ihnen ,weil ich über eine offene Stelle in Ihrem Beruf frage.\"";
  const reviewed = reconcileMarkingQuality(
    { feedback: source, writingScore: 86, writingScorePercent: 86, finalScore: 94 },
    objective,
    { text: victoriaSubmission, assignmentId: "A2-5.12" },
    { writingExpected: true },
  );
  assert.match(reviewed.feedback, /Add a comma after the formal salutation/);
  assert.doesNotMatch(reviewed.feedback, /Write "Ich schreibe Ihnen|Write “Ich schreibe Ihnen/);
  assert.match(reviewed.feedback, /All objective answers are correct/);
});

test("A2-5.12 replaces greeting-only feedback with grounded evidence without touching a 97/100 score", () => {
  const submission = [
    "TEIL 2",
    "Sehr geehrte Damen und Herren,",
    "Ich hoffe, es geht Ihnen gut. Ich schreibe Ihnen, weil ich mich um eine Stelle als Sekretärin bewerben möchte.",
    "Gibt es bei Ihnen noch offene Stellen? Welche Aufgaben hat die Sekretärin bei Ihnen?",
    "Während meines letzten Praktikums habe ich in einem Büro gearbeitet. Ich war dort als Sekretärin tätig.",
    "Außerdem bin ich zuverlässig und arbeite gern im Team.",
    "Im Umgang mit Kunden habe ich noch wenig Erfahrung, möchte mich darin aber gern verbessern.",
    "Außerdem möchte ich gern wissen: Wie sind die Arbeitszeiten und wie hoch ist das Gehalt?",
    "Wird das Gehalt monatlich oder wöchentlich gezahlt?",
    "Ich freue mich auf Ihre Antwort.",
    "Mit freundlichen Grüßen",
    "Lernende",
    "TEIL 3",
    "1. A", "2. B", "3. C", "4. D", "5. B",
    "TEIL 4",
    "1. B", "2. C", "3. A", "4. C", "5. B",
  ].join("\n");
  const objective = {
    correctCount: 10,
    totalCount: 10,
    details: Object.fromEntries([
      ...["A", "B", "C", "D", "B"].map((letter, index) => [
        `teil3.${index + 1}`, { partId: "teil3", student: letter, expected: letter, correct: true },
      ]),
      ...["B", "C", "A", "C", "B"].map((letter, index) => [
        `teil4.${index + 1}`, { partId: "teil4", student: letter, expected: letter, correct: true },
      ]),
    ]),
  };
  const result = reconcileMarkingQuality({
    level: "A2",
    assignmentKey: "A2-5.12",
    finalScore: 97,
    writingScore: 92,
    writingScorePercent: 92,
    taskCompletion: { completed: 3, total: 3, missing: [] },
    writingStrengths: ['You used clear greeting "Sehr geehrte Damen und Herren" and connector "und"'],
    feedback: 'You used clear greeting "Sehr geehrte Damen und Herren" and connector "und".',
  }, objective, { assignmentId: "A2-5.12", text: submission }, { writingExpected: true });

  assert.equal(result.finalScore, 97);
  assert.equal(result.writingScorePercent, 92);
  assert.equal(result.objectiveScore, 100);
  assert.match(result.feedback, /position is available|vacancy is available/i);
  assert.match(result.feedback, /work or internship experience|practical experience/i);
  assert.match(result.feedback, /working hours and salary/i);
  assert.match(result.feedback, /specific office task|office task/i);
  assert.match(result.feedback, /Teil 3: 5\/5 correct/);
  assert.match(result.feedback, /Teil 4: 5\/5 correct/);
  assert.match(result.feedback, /All objective answers are correct/);
  assert.ok(result.feedback.split(/\s+/).length >= 50, result.feedback);
  assert.doesNotMatch(result.feedback, /connector "und"/);
  assert.deepEqual(result.consistencyWarnings, []);
});

test("A2 rich examiner comments and objective-only grading remain unchanged", () => {
  const rich = "You ask whether vacancies are available and describe your practical experience in the office. Your questions about working hours and salary are specific. For an even stronger application, mention one secretarial duty you performed.";
  const source = "TEIL 2\nSehr geehrte Damen und Herren,\nGibt es offene Stellen? Ich war in einem Büro tätig und arbeite gern im Team. Wie sind die Arbeitszeiten und wie hoch ist das Gehalt?\nMit freundlichen Grüßen\nTEIL 3\n1. A";
  const objective = { correctCount: 1, totalCount: 1, details: { "teil3.1": { partId: "teil3", student: "A", expected: "A", correct: true } } };
  const preserved = reconcileMarkingQuality({ level: "A2", assignmentKey: "A2-5.12", feedback: rich, writingScore: 92, finalScore: 97 }, objective, { text: source, assignmentId: "A2-5.12" }, { writingExpected: true });
  assert.ok(preserved.feedback.startsWith(rich));
  const objectiveOnly = reconcileMarkingQuality({ feedback: rich, finalScore: 100 }, objective, { text: source }, { writingExpected: false });
  assert.doesNotMatch(objectiveOnly.feedback, /secretarial|vacanc|office/i);
});
