import test from "node:test";
import assert from "node:assert/strict";

import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };
import { heuristicWritingMarker } from "../src/utils/autoMarking.js";
import { buildNaturalStudentFeedback } from "../src/utils/naturalMarkingFeedback.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const WRITING = `Hallo Ama,

ich hoffe, es geht dir gut. Ich schreibe dir, um dir von meinen Plänen für die Zukunft zu erzählen.

Ich möchte einen neuen Job finden und eine Weiterbildung machen, um beruflich weiterzukommen. Deshalb lerne ich auch Deutsch. Deutsch ist für mich wichtig, weil ich in Zukunft in Deutschland arbeiten möchte.

Meine Familie ist mir auch sehr wichtig. Ich möchte gesund bleiben und mehr reisen.

Was planst du für deine Zukunft? Möchtest du studieren, arbeiten oder reisen?

Liebe Grüße
Jeffrey`;

const FULL_SUBMISSION = `${WRITING}\n\nTeil3\n1. C\n2. B\n3. B\n4. B\n5. C\n6. C\n7. B`;

function a21028Reference() {
  return Object.values(answersDictionary).find((entry) => String(entry?.assignment_id || "").toUpperCase() === "A2-10.28");
}

test("A2 heuristic praises meaningful connectors instead of basic und and suggests range", () => {
  const result = heuristicWritingMarker({ level: "A2", partId: "teil2", text: WRITING });

  assert.match(result.feedback, /connector [“\"](?:deshalb|weil)[”\"]/i);
  assert.doesNotMatch(result.feedback, /connector [“\"]und[”\"]/i);
  assert.match(result.feedback, /To vary your connectors, try [“\"](?:außerdem|aber|danach|trotzdem)[”\"]/i);
});

test("A2 natural feedback pairs connector praise with a concrete next connector", () => {
  const writing = heuristicWritingMarker({ level: "A2", partId: "teil2", text: WRITING });
  const feedback = buildNaturalStudentFeedback({
    studentName: "Jeffrey Danso",
    level: "A2",
    assignmentKey: "A2-10.28",
    objectiveScore: 71,
    objectiveCorrect: 5,
    objectiveTotal: 7,
    writingScore: 84,
    writingScorePercent: 84,
    wrongAnswers: [
      { partId: "teil3", question: 3, expected: "C", student: "B" },
      { partId: "teil3", question: 7, expected: "C", student: "B" },
    ],
    aiDetailedFeedback: writing.feedback,
    aiOriginalFeedback: writing.feedback,
    feedback: writing.feedback,
    hasRegisteredWriting: true,
  }, FULL_SUBMISSION);

  assert.match(feedback, /deshalb|weil/i);
  assert.match(feedback, /außerdem|aber|danach|trotzdem/i);
  assert.doesNotMatch(feedback, /connector [“\"]und[”\"]/i);
});

test("A2-10.28 objective correction keeps option C for the hyphenated insurance answer", () => {
  const referenceEntry = a21028Reference();
  assert.ok(referenceEntry, "A2-10.28 reference entry must exist");

  const result = computeObjectiveScore(referenceEntry, FULL_SUBMISSION);
  assert.equal(result.correctCount, 5);
  assert.equal(result.totalCount, 7);
  assert.equal(result.details["teil3.3"].expected, "C");
  assert.equal(result.details["teil3.7"].expected, "C");
});
