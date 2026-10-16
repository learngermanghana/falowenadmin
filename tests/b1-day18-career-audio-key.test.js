import test from "node:test";
import assert from "node:assert/strict";
import answersDictionary from "../src/data/answers_dictionary.json" with { type: "json" };

test("B1-6.18 teacher marking references the new career-dialogue Hören questions", () => {
  const entry = Object.values(answersDictionary).find(item => item.assignment_id === "B1-6.18");
  assert.ok(entry, "missing B1-6.18 reference");
  assert.deepEqual(entry.answers.teil4, {
    Answer1: "B) Astronaut",
    Answer2: "B) Grafikdesigner, Innenarchitekt oder Kunsttherapeut",
    Answer3: "B) Ein Praktikum im Kinderheim",
    Answer4: "C) Ein Mann wollte Ingenieur werden, arbeitet aber heute als Koch",
    Answer5: "A) Mit einem Kompass für die Karriere",
  });
  assert.equal(entry.answers.teil3.Answer1, "c) Leidenschaft und Vernunft.");
  assert.deepEqual(entry.referenceAnswerParts, ["teil3", "teil4"]);
  assert.ok(entry.aiGradedParts.includes("teil2"));
});
