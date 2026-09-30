import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { normalizeAnswerKeyEntry } from "../src/utils/answerKeyNormalizer.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { autoMarkSubmission, checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";
import { reconcileFinalDeterministicFeedback } from "../src/utils/finalDeterministicFeedback.js";

const rawReference = {
  assignment_id: "A1-12.3",
  level: "A1",
  answers: { Answer1: "Read comment for answers" },
  expectedParts: ["main"],
};

const submissionText = `Hallo Liebe,

ich schreibe dir, weil du heute Geburtstag hast. Herzlichen Glückwunsch zum Geburtstag! Ich wünsche dir viel Glück und Gesundheit. Gibt es eine Geburtstagsfeier? Kann ich mit meiner Familie kommen? Ich freue mich auf deine Antwort.

Liebe Grüße
Alex
Q2. Sehr geehrte Damen und Herren,

ich möchte einen Deutschkurs besuchen und brauche mehr Informationen. Wann beginnen die Kurse? Wie viel kostet der Kurs? Welche Zahlungsmöglichkeiten gibt es? Bitte schicken Sie mir Informationen zu den Kursen.

Mit freundlichen Grüßen
Lowie Boateng`;

const marySubmissionText = `Teil 1 informal letter
Lieber John,
Ich schreibe dir,weil du Geburtstag hast. Herzlichen Glückwunsch zum Geburtstag!Ich Wünsche dir alles Gute.
Gibt es eine feier bei dir?  Kann Meine familie mittkommen?
Liebe Grüße
Mary

Teil 2 formal letter
Sehr geehrte Damen und Hereen,
Ich schreibe Ihnen,Weil ich einen Deutschkurs besuchen möchte.Auf Ihrer Website fehlen informationen.
Wann beginnt der kurs?Wie viele Kostet der kurs?
Kann ich online bezahlen?
Mit freundlichen Grüßen
Mary Mensah`;

const momodouSubmissionText = `Teil 1.

Hallo Mo, wie geht es dir? Ich schreibe dir, weil ich dir zum Geburtstag gratulieren möchte. Gibt es eine Feier? Könnte meine Familie mitkommen? Vielleicht haben sie etwas zu tun, aber ich kann sie fragen. Viele Grüße, Momodou.

Teil 2.

Sehr geehrte Damen und Herren, ich interessiere mich für einen Deutschkurs an Ihrer Schule. Wann beginnt der nächste Kurs? Wie viel kostet die Teilnahme? Kann ich die Gebühr online bezahlen? Für eine kurze Antwort wäre ich Ihnen sehr dankbar. Mit freundlichen Grüßen.momodou Barry`;

function realA1123Reference() {
  const match = Object.entries(answersDictionary).find(([, entry]) => String(entry?.assignment_id || "").toUpperCase() === "A1-12.3");
  assert.ok(match, "A1-12.3 must exist in answers_dictionary.json");
  const [sourceKey, entry] = match;
  return { sourceKey, entry };
}

test("A1-12.3 exact two-letter submission is writing-only and never receives a fake objective zero", () => {
  const normalized = normalizeAnswerKeyEntry("Introduction to Letter Writing 12.3", rawReference);
  assert.equal(normalized.format, "writing");
  assert.deepEqual(normalized.referenceAnswerParts, []);

  const deterministic = checkDeterministicObjectiveAnswers({
    referenceEntry: rawReference,
    submissionText,
    partId: "main",
  });
  assert.equal(deterministic, null);

  const objective = computeObjectiveScore(rawReference, submissionText);
  assert.equal(objective.correctCount, 0);
  assert.equal(objective.totalCount, 0);
  assert.deepEqual(objective.details, {});

  const auto = autoMarkSubmission({
    referenceEntry: { ...rawReference, format: "writing" },
    submission: { assignmentKey: "A1-12.3", level: "A1" },
    submissionText,
  });
  assert.equal(auto.objectiveTotal, 0);
  assert.equal(auto.objectiveScore, null);
  assert.ok(auto.writingScore !== null);
  assert.ok(auto.detectedParts.some((part) => part.partType === "writing"));
});

test("A1-12.3 manifest marks Mary's informal and formal letters as writing only", () => {
  const manifestReference = {
    ...rawReference,
    format: "writing",
    expectedParts: ["teil1", "teil2"],
    writingParts: ["teil1", "teil2"],
    aiGradedParts: ["teil1", "teil2"],
    referenceAnswerParts: [],
  };

  const deterministic = checkDeterministicObjectiveAnswers({
    referenceEntry: manifestReference,
    submissionText: marySubmissionText,
    partId: "main",
  });
  assert.equal(deterministic, null);

  const objective = computeObjectiveScore(manifestReference, marySubmissionText);
  assert.equal(objective.totalCount, 0);

  const auto = autoMarkSubmission({
    referenceEntry: manifestReference,
    submission: { assignmentKey: "A1-12.3", level: "A1" },
    submissionText: marySubmissionText,
  });
  assert.equal(auto.objectiveTotal, 0);
  assert.equal(auto.objectiveScore, null);
  assert.ok(auto.writingScore !== null);
  assert.equal(auto.detectedParts.filter((part) => part.partType === "writing").length, 2);
});

test("real A1-12.3 dictionary plus Momodou submission cannot become one fake objective question", () => {
  const { sourceKey, entry } = realA1123Reference();
  assert.equal(entry.format, "writing");
  assert.deepEqual(entry.expectedParts, ["teil1", "teil2"]);
  assert.deepEqual(entry.writingParts, ["teil1", "teil2"]);
  assert.deepEqual(entry.referenceAnswerParts, []);

  const normalized = normalizeAnswerKeyEntry(sourceKey, entry);
  assert.equal(normalized.format, "writing");
  assert.deepEqual(normalized.expectedParts, ["teil1", "teil2"]);
  assert.deepEqual(normalized.writingParts, ["teil1", "teil2"]);
  assert.deepEqual(normalized.referenceAnswerParts, []);
  assert.equal(normalized.totalAnswers, 0);

  const objectiveById = computeObjectiveScore("A1-12.3", momodouSubmissionText);
  assert.equal(objectiveById.totalCount, 0);
  assert.equal(objectiveById.correctCount, 0);
  assert.deepEqual(objectiveById.details, {});

  const objectiveByManifest = computeObjectiveScore(normalized, momodouSubmissionText);
  assert.equal(objectiveByManifest.totalCount, 0);

  const auto = autoMarkSubmission({
    referenceEntry: normalized,
    submission: { assignmentKey: "A1-12.3", level: "A1" },
    submissionText: momodouSubmissionText,
  });
  assert.equal(auto.objectiveTotal, 0);
  assert.equal(auto.objectiveScore, null);
  assert.ok(Number(auto.writingScore) > 0, `Expected a positive writing score, received ${auto.writingScore}`);
  assert.equal(auto.detectedParts.filter((part) => part.partType === "writing").length, 2);

  const markingPageSource = fs.readFileSync(new URL("../src/pages/MarkingPage.jsx", import.meta.url), "utf8");
  assert.match(markingPageSource, /localWritingOnlyReference/);
  assert.match(markingPageSource, /referenceAnswerParts:\s*\[\]/);
});


test("A1-12.3 removes AI-invented objective feedback after deterministic writing-only reconciliation", () => {
  const objective = computeObjectiveScore("A1-12.3", marySubmissionText);
  assert.equal(objective.totalCount, 0);

  const result = reconcileFinalDeterministicFeedback({
    studentName: "Nanayaa Peprah",
    level: "A1",
    assignmentKey: "A1-12.3",
    finalScore: 40,
    score: 40,
    writingScore: 80,
    writingScorePercent: 80,
    objectiveScore: 0,
    objectiveCorrect: 0,
    objectiveTotal: 1,
    objectiveDetails: {
      "1": { correct: false, question: "1", student: "", expected: "Read comment for answers" },
    },
    wrongAnswers: [{ question: "1", student: "", expected: "Read comment for answers" }],
    taskCompletion: { completed: 6, total: 6, missing: [] },
    writingStrengths: [
      "The birthday message asks whether there is a party and whether the family can come.",
      "The formal email asks when the course begins, the price and whether online payment is possible.",
    ],
    nextStep: "Check small punctuation and spacing details before submitting.",
    detectedParts: [
      { partId: "teil1", partType: "writing" },
      { partId: "teil2", partType: "writing" },
      { partId: "main", partType: "objective", total: 1, correct: 0, wrong: 1 },
    ],
    feedback: "Strong work, Nanayaa Peprah. 0 of 1 objective answers are correct. question 1 was not answered. You addressed all 6 task points.",
    improvementSummary: "Focus on ensuring that all objective answers are provided correctly in future submissions.",
  }, objective, marySubmissionText);

  assert.equal(result.objectiveTotal, 0);
  assert.equal(result.objectiveCorrect, 0);
  assert.equal(result.objectiveScore, null);
  assert.deepEqual(result.objectiveDetails, {});
  assert.deepEqual(result.wrongAnswers, []);
  assert.equal(result.detectedParts.filter((part) => part.partType === "objective").length, 0);
  assert.doesNotMatch(result.feedback, /0 of 1|objective answers?|question 1.*not answered/i);
  assert.match(result.feedback, /6 task points|birthday|course/i);
  assert.equal(result.writingScore, 80);
  assert.equal(result.finalScore, 80);
});
