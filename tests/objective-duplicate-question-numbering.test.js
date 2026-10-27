import test from "node:test";
import assert from "node:assert/strict";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

const referenceEntry = {
  assignmentKey: "A2-1.1",
  level: "A2",
  answers: `teil3: Answer1. C) In einer Schule
teil3: Answer2. B) Weil sie gerne mit Kindern arbeitet
teil3: Answer3. A) In einem Buro
teil3: Answer4. B) Tennis
teil3: Answer5. B) Es war sonnig und warm
teil3: Answer6. B) Italien und Spanien
teil3: Answer7. C) Weil die Baume so schon bunt sind
teil4: Answer1. B) Ins Kino gehen
teil4: Answer2. A) Weil sie spannende Geschichten liebt
teil4: Answer3. A) Tennis
teil4: Answer4. B) Es war sonnig und warm
teil4: Answer5. C) Einen Spaziergang Machen`,
};

const submissionText = `Teil 2

Lieber Felix

Wie geht es dir? Ich hoffe, es geht dir gut. Ich schreibe dir, weil ich dir von meiner Familie und meiner Arbeit erzählen möchte. Ich bin studentin. Ich lerne Deutsch. Meine Familie besteht aus meiner Mutter, meinem Vatuer und meinen zwei schwestern. Ich lerne Deutsch. weil ich in Deutschland zur Schule gehen möchte. Was ist das Wetter heute?

Viele Grüße
Vicky

Teil 3

Q1.c. In einer schule
Q2.b. Wil sie gerne mit kindern arbeitet
Q3.a. In einem Büro
Q4.a. Fuß ball
Q5.b. Es war Sonnig und warm
Q6.b. Italien und Spanien
Q7.d. Wil die Bäume so schön bunt sind

Teil 4

Q1.B. Ins kino gehen
Q2.A. Sie Liebt spannende Geschicten
Q3.A. Tennis
Q4.B. Sonnig und warm
Q4.C.Spaziergang`;

test("trailing duplicated question number is recovered as the final missing objective answer", () => {
  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText });

  assert.equal(result.objectiveCorrect, 10);
  assert.equal(result.objectiveTotal, 12);
  assert.equal(result.objectiveScore, 83);

  const teil3 = result.detectedParts.find((part) => part.partId === "teil3");
  const teil4 = result.detectedParts.find((part) => part.partId === "teil4");
  assert.equal(teil3?.summary, "teil3: 7 objective answers found, 5 correct, 2 wrong");
  assert.equal(teil4?.summary, "teil4: 5 objective answers found, 5 correct, 0 wrong");

  assert.deepEqual(
    result.wrongAnswers.map(({ partId, question, expected, student }) => ({ partId, question, expected, student })),
    [
      { partId: "teil3", question: 4, expected: "B", student: "A" },
      { partId: "teil3", question: 7, expected: "C", student: "D" },
    ],
  );
});

test("marking API keeps the first Q4, maps the trailing duplicate Q4 to Q5, and recomputes the final score", async () => {
  const { default: handler } = await import("../api/router.js");
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      result: {
        score: 60,
        finalScore: 60,
        writingScore: 60,
        objectiveScore: 67,
        objectiveCorrect: 8,
        objectiveTotal: 12,
        feedback: "Stale upstream score before deterministic objective repair.",
        parts: [
          {
            partId: "teil2",
            partType: "writing",
            result: { score: 60 },
            feedback: "Writing marked at 60%.",
          },
        ],
        status: "needs_review",
      },
    }),
  });

  const req = {
    method: "POST",
    url: "/marking/ai",
    headers: { host: "localhost", "content-type": "application/json" },
    body: {
      assignmentKey: "A2-1.1",
      level: "A2",
      submission: { name: "Vicky", assignmentKey: "A2-1.1", level: "A2" },
      referenceEntry: {
        assignmentKey: "A2-1.1",
        level: "A2",
        expectedParts: ["teil3", "teil4"],
        parts: {
          teil3: {
            answers: ["C", "B", "A", "B", "B", "B", "C"].map((correctLetter, index) => ({
              questionNumber: String(index + 1),
              correctLetter,
            })),
          },
          teil4: {
            answers: ["B", "A", "A", "B", "C"].map((correctLetter, index) => ({
              questionNumber: String(index + 1),
              correctLetter,
            })),
          },
        },
      },
      submissionText,
    },
  };

  let statusCode = 0;
  let jsonBody;
  const res = {
    status(code) { statusCode = code; return this; },
    json(body) { jsonBody = body; return body; },
    send(body) { jsonBody = body; return body; },
    setHeader() {},
  };

  try {
    await handler(req, res);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(statusCode, 200);
  assert.equal(jsonBody.result.objectiveCorrect, 10);
  assert.equal(jsonBody.result.objectiveTotal, 12);
  assert.equal(jsonBody.result.objectiveScore, 83);
  assert.equal(jsonBody.result.writingScore, 60);
  assert.equal(jsonBody.result.finalScore, 72);

  const teil4 = jsonBody.result.detectedParts.find((part) => part.partId === "teil4");
  assert.equal(teil4?.correct, 5);
  assert.equal(teil4?.wrong, 0);
  assert.equal(jsonBody.result.wrongAnswers.some((row) => row.partId === "teil4"), false);
  assert.match(jsonBody.result.feedback, /Objective score: 10\/12 correct \(83%\)/);
});

test("a duplicate number is not shifted when it is not the trailing final-question typo", () => {
  const result = checkDeterministicObjectiveAnswers({
    referenceEntry: {
      format: "objective",
      answers: {
        Answer1: "A",
        Answer2: "B",
        Answer3: "C",
        Answer4: "D",
        Answer5: "A",
      },
    },
    submissionText: `1. A
2. B
3. C
4. D
4. A
5. A`,
  });

  assert.equal(result.objectiveCorrect, 5);
  assert.equal(result.objectiveTotal, 5);
  assert.equal(result.objectiveScore, 100);
});
