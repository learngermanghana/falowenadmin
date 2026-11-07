import test from "node:test";
import assert from "node:assert/strict";
import { canonicalCourseReference } from "../src/utils/canonicalCourseReference.js";
import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

const referenceEntry = canonicalCourseReference("B1-8.24");
const reading = "1. A 2. B 3. B 4. A 5. B 6. C 7. B";
const writing = "Heutzutage ist nachhaltiger Konsum wichtig. Wir sollten weniger kaufen und Geräte reparieren.";

for (const separator of ["\n", "  "]) {
  for (const [presentPart, absentPart, answers, count] of [
    ["teil3", "teil4", reading, 7],
    ["teil4", "teil3", "1. A 2. B 3. A 4. C 5. A", 5],
  ]) {
    test(`missing ${absentPart} stays blank with ${JSON.stringify(separator)} separators`, () => {
      const text = `TEIL 2 ${writing}${separator}${presentPart.toUpperCase().replace("TEIL", "TEIL ")}${separator}${answers}`;
      const shared = computeObjectiveScore(referenceEntry, text);
      assert.equal(shared.totalCount, 12);
      assert.equal(shared.correctCount, count);
      const missingDetails = Object.values(shared.details).filter((row) => row.partId === absentPart);
      assert.ok(missingDetails.every((row) => row.student === ""));
      const checked = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText: text });
      assert.equal(checked.objectiveCorrect, count);
      assert.equal(checked.objectiveTotal, 12);
      const missing = checked.parts.find((part) => part.partId === absentPart).result;
      assert.equal(missing.missing.length, absentPart === "teil4" ? 5 : 7);
      assert.equal(missing.wrong.length, 0);
      assert.ok(missing.missing.every((row) => row.student === ""));
    });
  }
}

test("an explicitly empty listening section stays blank", () => {
  const result = checkDeterministicObjectiveAnswers({ referenceEntry,
    submissionText: `Teil 3\n${reading}\nTeil 4\n` });
  assert.equal(result.parts.find((part) => part.partId === "teil4").result.missing.length, 5);
});

test("unlabelled legacy answers remain markable for an explicitly requested part", () => {
  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText: reading, partId: "teil3" });
  assert.equal(result.objectiveCorrect, 7);
  assert.equal(result.objectiveTotal, 7);
});

for (const separator of ["\n", "  "]) {
  test(`API does not borrow reading answers for missing listening: ${JSON.stringify(separator)}`, async () => {
    const { default: handler } = await import("../api/router.js");
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, status: 200,
      text: async () => JSON.stringify({ result: { score: 73, writingScore: 90, status: "needs_review",
        parts: [{ partId: "teil2", partType: "writing", result: { score: 90 } }] } }),
    });
    let body;
    let status;
    const res = { status(code) { status = code; return this; }, json(value) { body = value; return value; },
      send(value) { body = value; return value; }, setHeader() {} };
    try {
      await handler({ method: "POST", url: "/marking/ai", headers: { host: "localhost", "content-type": "application/json" },
        body: { referenceEntry, level: "B1", assignmentKey: "B1-8.24",
          submissionText: `TEIL 2 ${writing}${separator}TEIL 3${separator}${reading}` } }, res);
    } finally { globalThis.fetch = originalFetch; }
    assert.equal(status, 200);
    assert.equal(body.result.objectiveCorrect, 7);
    assert.equal(body.result.objectiveTotal, 12);
    const listening = body.result.parts.find((part) => part.partId === "teil4").result;
    assert.equal(listening.missing.length, 5);
    assert.equal(listening.wrong.length, 0);
    assert.ok(listening.missing.every((row) => row.student === ""));
    assert.ok(body.result.wrongAnswers.filter((row) => row.partId === "teil4").every((row) => row.student === ""));
  });
}
