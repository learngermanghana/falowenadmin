import test from "node:test";
import assert from "node:assert/strict";
import { extractNamedChoiceAnswer } from "../src/utils/namedChoiceAnswer.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

// Synthetic matching exercise: deliberately one wrong option (C instead of X).
const reading = ["A", "B", "X", "D", "E", "F", "X"];
const listening = ["A", "B", "B", "B", "A"];
const names = ["Jonas", "Mia", "Herr und Frau Weber", "Nora", "Paul", "Leonie", "David"];
const submitted = ["a", "b", "c", "d", "e", "f", "X"];
const referenceEntry = {
  assignmentKey: "B1-named-choice-test",
  level: "B1",
  expectedParts: ["teil2", "teil3", "teil4"],
  writingParts: ["teil2"],
  parts: {
    teil3: { answers: reading },
    teil4: { answers: listening },
  },
};
const legacyReference = {
  ...referenceEntry,
  parts: undefined,
  answers: [...reading.map((a, i) => `teil3: Answer${i + 1}. ${a}`),
    ...listening.map((a, i) => `teil4: Answer${i + 1}. ${a}`)].join("\n"),
};
function submission(separator = "\n", invisible = "") {
  return `TEIL 2 Sehr geehrte Damen und Herren, bitte senden Sie mir ein Reiseangebot. Mit freundlichen Grüßen Alex${separator}TEIL 3${separator}`
    + names.map((name, i) => `${i + 1}.${invisible} ${name}\t${submitted[i]}`).join(separator)
    + `${separator}TEIL 4${separator}`
    + listening.map((a, i) => `${i + 1}. ${a}`).join(separator);
}

for (const [label, separator, invisible] of [
  ["multiline", "\n", ""],
  ["flattened report", "  ", ""],
  ["word-processor format characters", "\n", "\u2060 \u2060"],
]) {
  test(`named matching choices preserve correct letters and genuine errors: ${label}`, () => {
    const result = computeObjectiveScore(referenceEntry, submission(separator, invisible));
    assert.equal(result.totalCount, 12);
    assert.equal(result.correctCount, 11);
    assert.deepEqual(Object.keys(result.details).filter((key) => !result.details[key].correct), ["teil3.3"]);
    assert.match(result.details["teil3.1"].student, /Jonas\ta/);
    assert.equal(result.details["teil3.3"].expected, "X");
    assert.equal(result.details["teil3.7"].correct, true);
  });
}

test("API deterministic checker uses the same named choice fallback", () => {
  const result = checkDeterministicObjectiveAnswers({ referenceEntry: legacyReference, submissionText: submission() });
  assert.equal(result.objectiveTotal, 12);
  assert.equal(result.objectiveCorrect, 11);
  assert.equal(result.objectiveScore, 92);
  assert.deepEqual(result.wrongAnswers.map(({ partId, question }) => [partId, question]), [["teil3", 3]]);
});

test("named choice parsing handles Unicode names, case, tabs and invisible formatting", () => {
  for (const [answer, letter] of [["Jonas a", "A"], ["Herr und Frau Weber\tc", "C"],
    ["Élodie d", "D"], ["Anne-Marie e", "E"], ["\u2060 David\tX\u200b", "X"]]) {
    assert.equal(extractNamedChoiceAnswer(answer), letter, answer);
  }
});

test("does not infer a choice from prose, ambiguous letters or an embedded letter", () => {
  for (const answer of ["", "Jonas", "Jonas a oder b", "Jonas A B", "Jonas (a/b)",
    "A B", "Das ist a", "Ich nehme a", "Jonas ab", "Jonas 2B", "Jonas a extra"]) {
    assert.equal(extractNamedChoiceAnswer(answer), "", answer);
  }
});

test("free-text answers do not use the named choice fallback", () => {
  const result = computeObjectiveScore({ parts: { teil3: { answers: ["Jonas a"] } } }, "Teil 3\n1. Mia a");
  assert.equal(result.correctCount, 0);
  assert.equal(result.details["teil3.1"].expected, "jonas a");
});

test("marking API repairs stale objective totals before calculating the final score", async () => {
  const { default: handler } = await import("../api/router.js");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true, status: 200,
    text: async () => JSON.stringify({ result: {
      score: 65, finalScore: 65, writingScore: 88,
      objectiveScore: 42, objectiveCorrect: 5, objectiveTotal: 12,
      feedback: "Pending tutor review.", status: "needs_review",
      parts: [{ partId: "teil2", partType: "writing", result: { score: 88 } }],
    } }),
  });
  let status;
  let body;
  const res = {
    status(code) { status = code; return this; },
    json(value) { body = value; return value; },
    send(value) { body = value; return value; },
    setHeader() {},
  };
  try {
    await handler({
      method: "POST", url: "/marking/ai", headers: { host: "localhost", "content-type": "application/json" },
      body: { assignmentKey: referenceEntry.assignmentKey, level: "B1",
        submission: { assignmentKey: referenceEntry.assignmentKey, level: "B1" },
        referenceEntry, submissionText: submission() },
    }, res);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(status, 200);
  assert.equal(body.result.objectiveCorrect, 11);
  assert.equal(body.result.objectiveTotal, 12);
  assert.equal(body.result.objectiveScore, 92);
  assert.equal(body.result.writingScore, 88);
  assert.equal(body.result.finalScore, 90);
  assert.match(body.result.feedback, /11\/12 correct \(92%\)/);
});
