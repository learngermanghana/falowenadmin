import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const answerKeys = require("../functions/swahili-answers.json");
const { resolveDayFourAnswerReference } = require("../functions/swahiliResults.js");

test("Day 4 tutor reference matches all five Lesen and five Hören answers", () => {
  const current = answerKeys["swahili-day-4"];
  assert.equal(current.version, 2);
  assert.deepEqual(Object.keys(current.reading), ["read-1", "read-2", "read-3", "read-4", "read-5"]);
  assert.deepEqual(Object.values(current.reading).map(x => x.answer.slice(0, 1)), ["B", "B", "C", "B", "C"]);
  assert.deepEqual(Object.keys(current.listening), [
    "listen-origin-b", "listen-origin-a", "listen-languages-b", "listen-learning", "listen-likes-a",
  ]);
  assert.deepEqual(Object.values(current.listening).map(x => x.answer.slice(0, 1)), ["B", "C", "A", "B", "D"]);
  assert.equal(current.listening["listen-languages-b"].answer, "A) Kiswahili na Kiingereza");
});

test("old Day 4 submissions keep the three original reading references and no Hören", () => {
  const old = resolveDayFourAnswerReference("swahili-day-4");
  const current = resolveDayFourAnswerReference("swahili-day-4", 2);
  assert.equal(old.version, 1);
  assert.deepEqual(Object.keys(old.reading), ["read-1", "read-2", "read-3"]);
  assert.equal(old.reading["read-1"].answer, "Tanzania.");
  assert.equal(old.listening, undefined);
  assert.equal(old.legacyReading, undefined);
  assert.equal(current.version, 2);
  assert.equal(Object.keys(current.reading).length, 5);
  assert.equal(Object.keys(current.listening).length, 5);
  assert.equal(current.legacyReading, undefined);
  assert.equal(resolveDayFourAnswerReference("swahili-day-3").version, answerKeys["swahili-day-3"].version);
});
