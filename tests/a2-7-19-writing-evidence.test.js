import test from "node:test";
import assert from "node:assert/strict";

import { evaluateWritingTaskEvidence, missingTaskPointsFromEvidence } from "../src/utils/writingTaskEvidence.js";

const task = {
  level: "A2",
  assignmentKey: "A2-7.19",
  taskPoints: [
    "Invite the friend to shop and explain why",
    "Suggest when and where to meet",
    "Ask for the friend's opinion",
  ],
};

test("A2-7.19 recognises Was denkst du and complete meeting evidence", () => {
  const source = `Liebe Diana,

ich schreibe dir, weil ich dich gern zum Möbelkaufen einladen möchte. Hast du am Samstag Zeit? Wir können uns um 10 Uhr vor dem Einkaufszentrum in Accra treffen.

Was denkst du? Möchtest du mitkommen?

Liebe Grüße
Millicent`;

  const evidence = evaluateWritingTaskEvidence(task, source);

  assert.deepEqual(evidence.map((item) => item.status), ["met", "met", "met"]);
  assert.deepEqual(missingTaskPointsFromEvidence(evidence), []);
  assert.match(evidence[2].evidence, /Was denkst du\?/);
});

test("A2-7.19 meeting point requires both time and place", () => {
  const source = `Liebe Diana,
ich möchte dich zum Möbelkaufen einladen. Hast du am Samstag Zeit?
Was denkst du?
Liebe Grüße`;

  const evidence = evaluateWritingTaskEvidence(task, source);

  assert.equal(evidence[0].status, "met");
  assert.equal(evidence[1].status, "missing");
  assert.equal(evidence[2].status, "met");
});

test("A2-7.19 invitation point requires shopping purpose, not a bare invitation", () => {
  const source = `Liebe Diana,
ich möchte dich einladen. Wir treffen uns am Samstag um 10 Uhr vor dem Bahnhof.
Was denkst du?
Liebe Grüße`;

  const evidence = evaluateWritingTaskEvidence(task, source);

  assert.equal(evidence[0].status, "missing");
  assert.equal(evidence[1].status, "met");
  assert.equal(evidence[2].status, "met");
});
