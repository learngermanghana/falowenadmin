import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const answersPath = new URL("../src/data/answers_dictionary.json", import.meta.url);

function b124Entry() {
  const dictionary = JSON.parse(fs.readFileSync(answersPath, "utf8"));
  return Object.values(dictionary).find((entry) => String(entry?.assignment_id || entry?.assignmentId || "").toUpperCase() === "B1-2.4");
}

test("B1-2.4 matches the live Falowen assignment with 10 objective questions", () => {
  const entry = b124Entry();
  assert.ok(entry, "B1-2.4 answer key must exist");

  assert.deepEqual(Object.keys(entry.answers.teil3), ["Answer1", "Answer2", "Answer3", "Answer4", "Answer5"]);
  assert.deepEqual(Object.keys(entry.answers.teil4), ["Answer1", "Answer2", "Answer3", "Answer4", "Answer5"]);

  assert.equal(entry.answers.teil3.Answer1, "B) Wegen des Mangels an bezahlbarem Wohnraum");
  assert.equal(entry.answers.teil3.Answer5, "A) Wegen der Nahe zu Schulen und Kindergarten");
  assert.equal(entry.answers.teil4.Answer1, "B) 950 Euro");
  assert.equal(entry.answers.teil4.Answer5, "B) Es gibt eine U-Bahn Station und mehree Bushaltestellen in der Nahe");
});
