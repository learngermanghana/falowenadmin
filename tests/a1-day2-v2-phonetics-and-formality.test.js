import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../src/data/courseMarkingSnapshot.json" with { type: "json" };
import { canonicalCourseReference } from "../src/utils/canonicalCourseReference.js";
import { validateAnswerEntry } from "../src/utils/answerKeyIntegrity.js";

test("Day 2 V2 includes the correct phonetic words and five formality answers", () => {
  const entry = Object.values(snapshot.answerKeys).find(row => row.assignment_id === "A1-0.2_1.1");
  assert.ok(entry, "The current learner assignment must have a checked-in Admin answer key");
  assert.equal(entry.workbookVersion, "A1-DAY2-FOUNDATIONS-V2");
  assert.deepEqual(entry.answers["Teil 1"], {
    Answer1: "B) Hund",
    Answer2: "D) Salz",
    Answer3: "A) Katze",
    Answer4: "D) ß",
    Answer5: "A-Umlaut",
  });
  assert.deepEqual(entry.answers["Teil 2"], {
    Answer1: "C) Sie",
    Answer2: "A) du",
    Answer3: "B) ihr",
    Answer4: "B) Sie",
    Answer5: "C) Sie",
  });
  assert.deepEqual(entry.expectedParts, ["teil1", "teil2", "teil3", "teil4", "teil5"]);
  assert.deepEqual(entry.writingParts, ["teil5"]);
  assert.equal(validateAnswerEntry("A1 Day 2 V2", entry).errors.length, 0);
  const normalized = canonicalCourseReference("A1-0.2_1.1");
  assert.equal(normalized?.parts?.teil1?.answerCount, 5);
  assert.equal(normalized?.parts?.teil2?.answerCount, 5);
  assert.equal(normalized?.parts?.teil5, undefined);
});
