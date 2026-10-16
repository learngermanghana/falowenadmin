import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dictionary = JSON.parse(fs.readFileSync(new URL("../src/data/answers_dictionary.json", import.meta.url), "utf8"));

test("B1-6.18 Hören matches the career dialogue answer key", () => {
  const entry = Object.values(dictionary).find((item) => item.assignment_id === "B1-6.18");
  assert.ok(entry, "B1-6.18 answer dictionary entry is required");
  assert.deepEqual(Object.values(entry.answers.teil4), [
    "B) Astronaut",
    "B) Grafikdesigner, Innenarchitekt oder Kunsttherapeut",
    "B) Ein Praktikum im Kinderheim",
    "C) Ein Mann wollte Ingenieur werden, arbeitet aber heute als Koch",
    "A) Mit einem Kompass für die Karriere",
  ]);
  assert.equal(Object.keys(entry.answers.teil3).length, 7, "Lesen must remain unchanged");
});
