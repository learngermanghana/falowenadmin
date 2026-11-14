const assert = require("node:assert/strict");
const { test } = require("node:test");
const { resultAnswerReference } = require("./resultAnswerReference.cjs");

test("publishes only the matching version's selected objective answers", () => {
  const reference = {
    assignmentKey: "A2-1.1",
    coursebookRevision: "revision-2",
    referenceAnswerParts: ["teil3"],
    parts: {
      teil2: { answers: [{ questionKey: "internal rubric", rawCorrectAnswer: "Tutor guidance" }] },
      teil3: { answers: [
        { questionKey: "Answer1", rawCorrectAnswer: "B) Berlin" },
        { questionKey: "Answer2", rawCorrectAnswer: "See instructions" },
      ] },
    },
  };
  const published = resultAnswerReference(reference, "A2-1.1");
  reference.parts.teil3.answers[0].rawCorrectAnswer = "Changed";
  assert.deepEqual(published, {
    assignmentId: "A2-1.1", revision: "revision-2",
    parts: [{ id: "teil3", answers: [{ question: "Answer1", answer: "B) Berlin" }] }],
  });
  assert.equal(resultAnswerReference(reference, "A2-1.2"), null);
});
