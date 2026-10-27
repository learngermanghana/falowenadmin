import test from "node:test";
import assert from "node:assert/strict";

import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { calculateFinalScore } from "../src/utils/finalScore.js";
import { assignmentHasScoredWriting, buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";

const VICKY_SUBMISSION = `1)Es kostet 20 Euro
2) Sie kostet 15 Euro
3) Es kostet 25.000 Euro
4) Er stul kostet 50 Euro

Teil 2
Meine Famille ist klien. Mein Mutter heißt Frau Henrietta und sie ist 53 Jahre alt. Sie is Näherin. Mein Vater heißt Herr Valdis und er is 59 Jahre alt. Er ist lahrer. Ich habe 2 Schwester, sie heißt Viola und Vallary. Viola ist 16 Jahre alt und Vallary is 13 Jahre alt. Wir wohnen in einem Haus in Accra. meine mutter kochet gern. Mein Vater schaul gern fußall und Meine scwestern horën gern musik

Teil 3
1) Nein,ich spiele nicht gern Fußall
2) Nein,ich schwimmst gerh
3) Ja, Ich mag es lessen
4)Nein, ich male nicht gern
5) Ja, ich höre gern musik
6) Ja,Ich koche gern
7) Nein , ich reise nicht gern
8) Nein,ich mag Gartenabiet nicht
9) Nein,ich fahre nicht gern
10) Nein, ich wandre nicht gern`;

function a13Reference() {
  return Object.values(answersDictionary).find((entry) => String(entry?.assignment_id || "").toUpperCase() === "A1-3");
}

test("A1-3 preserves prices and full comma-separated preference answers", () => {
  const referenceEntry = a13Reference();
  assert.ok(referenceEntry, "A1-3 reference entry must exist");

  const result = computeObjectiveScore(referenceEntry, VICKY_SUBMISSION);
  assert.equal(result.correctCount, 12);
  assert.equal(result.totalCount, 12);
  assert.equal(Math.round((result.correctCount / result.totalCount) * 100), 100);
  assert.match(result.details["teil1.4"].student, /50 Euro/i);
  assert.match(result.details["teil3.1"].student, /Nein,ich spiele nicht gern Fußall/i);
  assert.match(result.details["teil3.8"].student, /Gartenabiet/i);
  assert.equal(Object.values(result.details).filter((detail) => detail.correct === false).length, 0);
});

test("A1-3 explicitly registers Teil 2 for AI writing scoring", () => {
  const referenceEntry = a13Reference();
  assert.deepEqual(referenceEntry.expectedParts, ["teil1", "teil2", "teil3"]);
  assert.deepEqual(referenceEntry.writingParts, ["teil2"]);
  assert.deepEqual(referenceEntry.aiGradedParts, ["teil2"]);
  assert.equal(referenceEntry.partGrading?.teil2?.gradingMode, "ai_written_response");
  assert.equal(assignmentHasScoredWriting(referenceEntry), true);
  assert.equal(calculateFinalScore(100, 66), 83);
});

test("A1 feedback uses structured writing evidence instead of one generic tip", () => {
  const feedback = buildNaturalStudentFeedback({
    studentName: "Vicky Eloise Peregrino-Solomon",
    level: "A1",
    assignmentKey: "A1-3",
    objectiveScore: 100,
    objectiveCorrect: 12,
    objectiveTotal: 12,
    writingScore: 66,
    writingScorePercent: 66,
    writingStrengths: ["Your family description is understandable and includes ages, jobs and where the family lives"],
    taskCompletion: { completed: 3, total: 3, missing: [] },
    corrections: [{ from: "Famille", to: "Familie", partId: "teil2" }],
    nextStep: "Practise verb endings, capitalization and plural forms in the family description",
  }, VICKY_SUBMISSION);

  assert.match(feedback, /12 of 12 objective answers are correct/i);
  assert.match(feedback, /Familie/i);
  assert.match(feedback, /ages, jobs and where the family lives/i);
  assert.doesNotMatch(feedback, /Check verb position, articles and every task point/i);
  assert.ok(feedback.split(/\s+/).length <= 60);
});
