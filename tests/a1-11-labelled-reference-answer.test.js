import test from "node:test";
import assert from "node:assert/strict";

import { computeObjectiveScore } from "../src/utils/objectiveMarking.js";

const submission = `Teil 1
1. b) Entschuldigung, wo ist der Bahnhof?
2. b) Links abbiegen
3. b) Auf der rechten Seite, direkt neben dem großen Supermarkt
4. b) Wie komme ich zur nächsten Apotheke?
5. c) Gute Reise und einen schönen Tag noch.

Teil 2
1. c) Wie komme ich zur nächsten Apotheke?
2. c) Rechts abbiegen
3. b) Auf der linken Seite, direkt neben der Bäckerei
4. a) Gehen Sie geradeaus bis zur Kreuzung, dann links.
5. c) Einen schönen Tag noch

Teil 3
1. How do I get to the train station?- Wie komme ich zum Bahnhof?
2. Cross the street- Überqueren Sie die Straße.
3. Go straight- Gehen Sie geradeaus.
4. Turn left- Biegen Sie links ab.
5. Turn right- Biegen Sie rechts ab.`;

test("A1-11 accepts the actual answer phrase inside a quoted labelled reference", () => {
  const result = computeObjectiveScore("A1-11", submission);

  assert.equal(result.totalCount, 15);
  assert.equal(result.correctCount, 15);
  assert.equal(result.details["teil3.1"].correct, true);
  assert.match(result.details["teil3.1"].student, /Wie komme ich zum Bahnhof/i);
});

test("clock colons in choice answers are not treated as labelled text answers", () => {
  const reference = {
    assignmentKey: "A1-clock-colon-guard",
    level: "A1",
    expectedParts: ["teil1"],
    referenceAnswerParts: ["teil1"],
    parts: {
      teil1: {
        answers: {
          Answer1: "B) Um 9:00 Uhr",
        },
      },
    },
  };

  const result = computeObjectiveScore(reference, `Teil 1\n1. C) Um 8:00 Uhr`);
  assert.equal(result.totalCount, 1);
  assert.equal(result.correctCount, 0);
  assert.equal(result.details["teil1.1"].correct, false);
});
