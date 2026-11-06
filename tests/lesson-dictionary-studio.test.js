import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  STARTER_DICTIONARIES, currentDictionaryQuarter, dictionaryStoryboard,
  validateDictionaries, DICTIONARY_SCHEMA_VERSION,
} from "../src/utils/lessonDictionaryStudio.js";

test("starter lesson library contains 10 quarterly-editable German dictionaries", () => {
  assert.equal(DICTIONARY_SCHEMA_VERSION, 1);
  assert.equal(STARTER_DICTIONARIES.length, 10);
  const ids = new Set(STARTER_DICTIONARIES.map(item => item.id));
  assert.equal(ids.size, 10);
  assert.ok(STARTER_DICTIONARIES.every(item =>
    item.title && item.grammar && item.mistakes && item.examples && item.intro && item.practice));
  assert.deepEqual(new Set(STARTER_DICTIONARIES.map(item => item.level)), new Set(["A1", "A2", "B1", "B2", "C1"]));
});

test("dictionary storyboard always renders six fully scripted teaching scenes", () => {
  for (const pack of STARTER_DICTIONARIES) {
    const slides = dictionaryStoryboard(pack);
    assert.deepEqual(slides.map(s => s.kind), ["intro", "vocabulary", "grammar", "examples", "mistakes", "practice"]);
    assert.equal(slides.length, 6);
    assert.ok(slides.every(s => s.script && s.heading && s.id));
    assert.ok(slides.every(s => s.bullets.length));
  }
});

test("teacher voice overrides do not change the source dictionary", () => {
  const pack = STARTER_DICTIONARIES[0];
  const original = dictionaryStoryboard(pack);
  const overridden = dictionaryStoryboard(pack, { grammar: "Ein Satz für den Unterricht." });
  assert.equal(overridden[2].script, "Ein Satz für den Unterricht.");
  assert.equal(original[2].script === overridden[2].script, false);
  assert.equal(pack.grammar.includes("ich heiße"), true);
});

test("import rejects unsafe IDs, duplicates and oversized curriculum fields", () => {
  assert.equal(validateDictionaries({ dictionaries: STARTER_DICTIONARIES }).length, 10);
  assert.throws(() => validateDictionaries([{ ...STARTER_DICTIONARIES[0], id: "../abc" }]), /IDs/);
  assert.throws(() => validateDictionaries([STARTER_DICTIONARIES[0], STARTER_DICTIONARIES[0]]), /unique/);
  assert.throws(() => validateDictionaries([{ ...STARTER_DICTIONARIES[0], grammar: "x".repeat(12001) }]), /Invalid grammar/);
});

test("calendar quarter uses three-month periods", () => {
  assert.equal(currentDictionaryQuarter(new Date("2026-01-07T12:00:00Z")), "2026-Q1");
  assert.equal(currentDictionaryQuarter(new Date("2026-11-06T12:00:00Z")), "2026-Q4");
});

test("dictionary editor has a stable empty script override and audio readiness feedback", () => {
  const editor = readFileSync(new URL("../src/pages/LessonDictionaryVideoStudio.jsx", import.meta.url), "utf8");
  const tts = readFileSync(new URL("../src/components/LessonTextToSpeech.jsx", import.meta.url), "utf8");
  assert.match(editor, /const EMPTY_SCRIPT_OVERRIDES = Object\.freeze\(\{\}\)/);
  assert.match(editor, /scripts\[pack\?\.id\] \|\| EMPTY_SCRIPT_OVERRIDES/);
  assert.match(tts, /Generate audio unavailable:/);
  assert.match(tts, /Checking the saved voice clips/);
  assert.match(tts, /Hören Studio speech service is not configured/);
  assert.match(tts, /remaining in today's shared 72-request/);
  assert.match(tts, /Cannot check the Hören Studio service/);
});
