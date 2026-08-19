import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { buildNaturalStudentFeedback, enforceRegisteredWritingScore } from "../src/utils/naturalMarkingFeedback.js";
import { reconcileFinalDeterministicFeedback } from "../src/utils/finalDeterministicFeedback.js";

const joshSubmission = `Teil 1
Q1. Ich heiße Anna
Q2. Ich heißt Max
Q3. Er heißt Peter
Q4. Wir kommen aus Italien 
Q5. Ihr komme aus Brasilien 
Q6. Sie kommt aus Russland 
Q7. Ich wohne in Berlin
Q8. Du wohnst in Madrid 
Q9. Sie wohnen in Wien(formal Sie)

Tiel 2.
Guten Tag, ich heiße Josh. Ich komme aus Ghana,ich wohne in Accra. Tschüss 

Tiel 3.
Q1.A
Q2.C
Q3.D
Q4.B
Q5.A`;

const marySubmission = `Teil I 
1.Ich komme aus Deutschland.lch spreche Deutsch.
2.Sie kommt aus frankreich. Sie spricht französisch .
3.Sie kommen aus Russland.sie sprechen Russisch .
4.Wir kommen aus Japan .wir sprechen Japanisch.
5.Er kommt aus England.Er spricht Englisch .

Teil 2 
1.C. Neun
2.B.Polnisch
3.D.Niederländisch
4.A.Deutsch
5.C.Paris
6.B.Amsterdam
7.C.In der schweiz

Teil 3
1.C .in ltalien und Frankreich
2.A. Paris
3.B.Das Essen
4.B.Paris
5.Madrid`;

const nanayaaSubmission = `Teil 1
1.heiBe
2.heiBt
3.heiBt
4.kommen
5.kommt
6.kommen
7.wohne
8.wohnst
9.wohnen

Teil 2
Ich heiße Nanayaa. Ich komme aus Ghana, ich wohne in Kasoa.
Guten Abend

Teil 3
1.A) Anna
2.C) Aus Italien
3.D) In Berlin
4\\. B) Tom
5.A) In Berlin`;

function wrongQuestions(result) {
  return Object.entries(result.details)
    .filter(([, detail]) => detail.correct === false)
    .map(([question]) => Number(question));
}

test("scores Josh A1-1.2 with strict pronoun and verb conjugation", () => {
  const result = computeObjectiveScore("A1-1.2", joshSubmission);

  assert.equal(result.totalCount, 14);
  assert.equal(result.correctCount, 11);
  assert.deepEqual(wrongQuestions(result), [2, 5, 9]);
  assert.equal(result.details[2].student, "Ich heißt Max");
  assert.equal(result.details[5].student, "Ihr komme aus Brasilien");
  assert.match(result.details[9].student, /Sie wohnen in Wien/i);
  assert.equal(result.details[10].correct, true);
  assert.equal(result.details[14].correct, true);
});

test("scores shortened A1-1.2 conjugation answers against the verb in each reference sentence", () => {
  const result = computeObjectiveScore("A1-1.2", nanayaaSubmission);

  assert.equal(result.totalCount, 14);
  assert.equal(result.correctCount, 13);
  assert.deepEqual(wrongQuestions(result), [9]);
  assert.equal(result.details[1].student, "heiBe");
  assert.equal(result.details[1].correct, true);
  assert.equal(result.details[2].correct, true);
  assert.equal(result.details[3].correct, true);
  assert.equal(result.details[9].student, "wohnen");
  assert.equal(result.details[9].correct, false);
});

test("does not award a shortened conjugation point for a pronoun, preposition, or place", () => {
  for (const incompleteAnswer of ["Wir", "aus", "Italien"]) {
    const submission = nanayaaSubmission.replace("4.kommen", `4.${incompleteAnswer}`);
    const result = computeObjectiveScore("A1-1.2", submission);

    assert.equal(result.details[4].student, incompleteAnswer);
    assert.equal(result.details[4].correct, false);
    assert.equal(result.correctCount, 12);
  }
});

test("grades sentence fragments by the expected subject and conjugated verb", () => {
  const submission = `Teil 1
1. Ich heiße Anna
2. Du heißt Max
3. Er heißt Peter
4. Wir kommen aus Italien
5. ihr kommt Brasilien
6. Sie kommen/kommt aus Russland Sie(They/She)
7. Ich wohne in Berlin
8. Du wohnst in Madrid
9. Sie wohnen in Wien

Teil 3
1. A) Anna
2. C) Aus Italien
3. D) In Berlin
4. B) Tom
5. A) In Berlin`;
  const result = computeObjectiveScore("A1-1.2", submission);

  assert.equal(result.totalCount, 14);
  assert.equal(result.correctCount, 13);
  assert.equal(result.details[5].student, "ihr kommt Brasilien");
  assert.equal(result.details[5].correct, true);
  assert.equal(result.details[6].student, "Sie kommen/kommt aus Russland Sie(They/She)");
  assert.equal(result.details[6].correct, true);
  assert.equal(result.details[9].correct, false);
  assert.deepEqual(wrongQuestions(result), [9]);
});

test("strict grammar still requires the complete normalized sentence", () => {
  const strictReference = {
    assignment_id: "STRICT-GRAMMAR-REGRESSION",
    answerMatchingMode: "strict_grammar",
    answers: {
      Answer1: "Ihr kommt aus Brasilien",
    },
  };

  const wrongCountry = computeObjectiveScore(strictReference, "1. Ihr kommt aus Russland");
  const exactSentence = computeObjectiveScore(strictReference, "1. Ihr kommt aus Brasilien");

  assert.equal(wrongCountry.details[1].correct, false);
  assert.equal(wrongCountry.correctCount, 0);
  assert.equal(exactSentence.details[1].correct, true);
  assert.equal(exactSentence.correctCount, 1);
});

test("keeps Mary's A1-4 choice result at 10 of 12", () => {
  const result = computeObjectiveScore("A1-4", marySubmission);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 10);
  assert.deepEqual(wrongQuestions(result), [9, 12]);
});

test("deterministic reconciliation replaces contradictory AI part counts", () => {
  const objectiveResult = computeObjectiveScore("A1-1.2", joshSubmission);
  const result = reconcileFinalDeterministicFeedback({
    level: "A1",
    assignmentKey: "A1-1.2",
    studentName: "Josh Asante Afriyie",
    score: 100,
    finalScore: 100,
    objectiveScore: 100,
    objectiveCorrect: 14,
    objectiveTotal: 14,
    detectedParts: [{ partId: "main", partType: "objective", answerCount: 14, correct: 5, wrong: 0 }],
    feedback: "Strong work. You addressed all 1 task points.",
  }, objectiveResult, joshSubmission);

  const main = result.detectedParts.find((part) => part.partId === "main");
  assert.equal(result.objectiveCorrect, 11);
  assert.equal(result.objectiveTotal, 14);
  assert.equal(Math.round(result.objectiveScore), 79);
  assert.equal(main.answerCount, 14);
  assert.equal(main.correct, 11);
  assert.equal(main.wrong, 3);
  assert.match(main.summary, /14 objective found, 11 correct, 3 wrong/);
  assert.deepEqual(result.wrongAnswers.map((row) => Number(row.question)), [2, 5, 9]);
});

test("objective-only assignments cannot claim completed writing task points", () => {
  const objectiveResult = computeObjectiveScore("A1-1.2", joshSubmission);
  const protectedResult = enforceRegisteredWritingScore({
    level: "A1",
    assignmentKey: "A1-1.2",
    studentName: "Josh Asante Afriyie",
    objectiveScore: 100,
    objectiveCorrect: 14,
    objectiveTotal: 14,
    writingScore: 90,
    writingScorePercent: 90,
    writingStrengths: ["You introduced yourself clearly with ‘Guten Tag, ich heiße Josh.’"],
    taskCompletion: { completed: 1, total: 1 },
    missingTaskPoints: [],
    nextStep: "Focus on verb conjugation, especially with the pronoun ‘ihr’",
    ai: { taskCompletion: { completed: 1, total: 1 } },
  }, {
    assignmentKey: "A1-1.2",
    format: "objective",
    expectedParts: ["main"],
  });

  const finalResult = reconcileFinalDeterministicFeedback({
    ...protectedResult,
    hasRegisteredWriting: false,
  }, objectiveResult, joshSubmission);

  assert.equal(finalResult.writingScore, null);
  assert.equal(finalResult.taskCompletion, null);
  assert.equal(finalResult.ai.taskCompletion, null);
  assert.doesNotMatch(finalResult.feedback, /task points?/i);
  assert.match(finalResult.feedback, /Guten Tag, ich heiße Josh|verb conjugation/i);
  assert.match(finalResult.feedback, /11 of 14 objective answers are correct|Review 2, 5, and 9/i);
});

test("registered writing uses the singular form for one task point", () => {
  const feedback = buildNaturalStudentFeedback({
    level: "A1",
    assignmentKey: "A1-3",
    studentName: "Test Student",
    writingScorePercent: 80,
    hasRegisteredWriting: true,
    writingStrengths: ["Your family description includes clear ages and occupations"],
    taskCompletion: { completed: 1, total: 1 },
    nextStep: "Check noun capitalization once more",
  }, "Teil 2\nMeine Familie ist klein. Meine Mutter ist Lehrerin. Wir wohnen in Accra.");

  assert.match(feedback, /1 task point\b/);
  assert.doesNotMatch(feedback, /1 task points\b/);
});
