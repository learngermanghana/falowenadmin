import test from "node:test";
import assert from "node:assert/strict";

import { getA2WritingTaskSpec } from "../src/data/a2WritingTaskSpecs.js";
import { evaluateWritingTaskEvidence, missingTaskPointsFromEvidence } from "../src/utils/writingTaskEvidence.js";

const task = getA2WritingTaskSpec("A2-9.24");

test("A2 Day 24 credits Sandra's transport preference question despite article mistakes", () => {
  const submitted = `TEIL 2
Liebe Sandra,
Ich möchte gern unseren Urlaub planen. Hast du nächsten Samstag Zeit?
Wir können uns am Bahnhof treffen. Wir besuchen das Museum in Berlin.
Zuerst kannst du ein Hotel buchen auf Online?
Wir brauchen einen zwei Zimmer mit ein Balkon.
Welche verkehrsmittel passt gut zu uns, ein privat auto oder mit dem Zug?
Falls es regnet, gehen wir ins Kino oder Weihnachtsmarkt.
Ich freue mich auf deine Antwort,
Leo.
TEIL 3
1. D
2. C
3. E
4. A
5. E
TEIL 4
1. B
2. B
3. A
4. B
5. B`;
  const evidence = evaluateWritingTaskEvidence(task, submitted);
  assert.equal(evidence[2].status, "met");
  assert.match(evidence[2].evidence, /Welche verkehrsmittel passt gut zu uns/i);
  assert.equal(missingTaskPointsFromEvidence(evidence).includes(task.taskPoints[2]), false);
});

test("A2 Day 24 requires a preference question, not a simple statement mentioning a train", () => {
  const statement = "Liebe Sandra, ich plane unseren Urlaub. Wir fahren mit dem Zug nach Berlin und buchen ein Hotel.";
  const evidence = evaluateWritingTaskEvidence(task, statement);
  assert.equal(evidence[2].status, "missing");
});

test("A2 Day 24 accepts alternatives expressed as a travel preference question", () => {
  const evidence = evaluateWritingTaskEvidence(task, "Liebe Sandra, Möchtest du lieber mit dem Auto oder mit dem Zug fahren?");
  assert.equal(evidence[2].status, "met");
});
