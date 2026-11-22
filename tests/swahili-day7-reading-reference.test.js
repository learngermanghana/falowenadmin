import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const answerKeys = require("../functions/swahili-answers.json");
const { answerReferenceForSwahiliSubmission } = require("../functions/swahiliResults.js");

test("Swahili A1 Day 7 tutor key matches the five shopping-dialogue questions", () => {
  const reference = answerKeys["swahili-day-7"];
  assert.equal(reference.version, 2);
  assert.deepEqual(Object.keys(reference.reading), ["read-1", "read-2", "read-3", "read-4", "read-5"]);
  assert.deepEqual(Object.values(reference.reading).map(({ answer }) => answer.split(")")[0]), ["B", "B", "C", "C", "C"]);
  assert.match(reference.reading["read-3"].answer, /4,500 TSh/);
  assert.match(reference.reading["read-5"].answer, /Risiti, tafadhali/);
  assert.equal(Object.keys(reference.listening).length, 5);
});

test("Swahili Day 7 older submissions retain their earlier reading reference", () => {
  const previous = answerReferenceForSwahiliSubmission("swahili-day-7");
  assert.equal(previous.version, 1);
  assert.deepEqual(Object.keys(previous.reading), ["read-1", "read-2", "read-3"]);
  assert.equal(previous.reading["read-1"].answer, "Chai.");
  const current = answerReferenceForSwahiliSubmission("swahili-day-7", 2);
  assert.equal(current.version, 2);
  assert.equal(Object.keys(current.reading).length, 5);
  assert.equal(current.legacyReading, undefined);
  assert.equal(previous.legacyReading, undefined);
  assert.equal(answerReferenceForSwahiliSubmission("swahili-day-6").version, answerKeys["swahili-day-6"].version);
});
