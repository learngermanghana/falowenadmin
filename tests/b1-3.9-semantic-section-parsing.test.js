import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";
import { parseSubmissionSections } from "../src/utils/submissionSections.js";

const submission = `Teil 2 · Schreiben
Work-Life-Balance im modernen Arbeitsumfeld

Heutzutage ist das Thema Work-Life-Balance sehr wichtig. Ich bin der Meinung, dass flexible Arbeitsmodelle hilfreich sind, weil sie mehr Zeit für Familie und Erholung schaffen.

Teil 2 · Lesen 1B · 2C · 3A · 4B · 5C · 6B · 7B

Teil 2 · Hören 1B · 2C · 3A · 4B · 5B`;

test("semantic Lesen and Hören labels override a stale Teil 2 prefix", () => {
  const sections = parseSubmissionSections(submission);

  assert.deepEqual(sections.map((section) => section.partId), ["teil2", "teil3", "teil4"]);
  assert.equal(sections[1].text, "1B · 2C · 3A · 4B · 5C · 6B · 7B");
  assert.equal(sections[2].text, "1B · 2C · 3A · 4B · 5B");
});

test("B1-3.9 marks compact Lesen and Hören answers instead of treating them as unanswered", () => {
  const result = computeObjectiveScore("B1-3.9", submission);

  assert.equal(result.totalCount, 12);
  assert.equal(result.correctCount, 12);
  assert.equal(result.details["teil3.1"].student, "B");
  assert.equal(result.details["teil3.7"].student, "B");
  assert.equal(result.details["teil4.1"].student, "B");
  assert.equal(result.details["teil4.5"].student, "B");
  assert.ok(Object.values(result.details).every((detail) => detail.correct));
});
