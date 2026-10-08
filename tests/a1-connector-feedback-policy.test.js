import test from "node:test";
import assert from "node:assert/strict";
import { allowsConnectorAssessment } from "../src/utils/a1ConnectorPolicy.js";
import { reconcileMarkingQuality } from "../src/utils/markingQuality.js";
import { heuristicWritingMarker } from "../src/utils/autoMarking.js";

test("A1 connector checks are restricted to chapters 12.3 through 14.1", () => {
  for (const key of ["A1-3", "A1-12.2", "A1-14.2", "A1-15"]) assert.equal(allowsConnectorAssessment("A1", key), false);
  for (const key of ["A1-12.3", "A1-13.1", "A1-14.1"]) assert.equal(allowsConnectorAssessment("A1", key), true);
  assert.equal(allowsConnectorAssessment("A2", "A2-3.6"), true);
});
test("feedback drops stale scores, connector praise and malformed objective fragments", () => {
  const result = reconcileMarkingQuality({ level: "A1", assignmentKey: "A1-3", feedback: 'Writing score: 79%. You used connector "und". Marking summary Good effort. Teil 1: 3/4 correct. / Ich mag nicht Lesen..', writingScorePercent: 60 }, { correctCount: 0, totalCount: 1, details: { "teil1.2": { partId: "teil1", student: "Die Lampe kosten 15 Euro", expectedDisplay: "Sie kostet 15 Euro.", correct: false } } }, { assignmentId: "A1-3" }, { writingExpected: true, wordTarget: 100 });
  assert.doesNotMatch(result.feedback, /79%|connector|Marking summary|nicht Lesen|\.\./);
  assert.equal((result.feedback.match(/Teil 1:/g) || []).length, 1);
  assert.match(result.feedback, /correct answer Sie kostet 15 Euro\./);
});
test("fallback marking does not discuss connectors for an early A1 family task", () => {
  const result = heuristicWritingMarker({ level: "A1", assignmentKey: "A1-3", partId: "teil2", text: "Meine Mutter heißt Comfort und sie ist Lehrerin. Mein Vater heißt Andy. Wir wohnen in Accra." });
  assert.doesNotMatch(result.feedback, /connector/i);
  assert.ok(Number.isFinite(result.score));
});
