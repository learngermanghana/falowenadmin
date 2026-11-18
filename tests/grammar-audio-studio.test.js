import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { parseGrammarAudioScript, planGrammarAudio, grammarAudioCacheKey, grammarAssemblyPlan, optimizeGrammarAudioScript } from "../src/utils/grammarAudio.js";
const require = createRequire(import.meta.url);
const { validateGrammarScriptRequest, validateSceneRequest, buildSpeechPayload } = require("../functions/hoerenStudioApi.js");

test("grammar narration preserves separate English and German lines and exact pauses", () => {
  const parsed = parseGrammarAudioScript("EN: The more I practise, the better I speak.\nDE: Je mehr ich übe, desto besser spreche ich.\n[PAUSE 3]\nEN: Your turn.");
  assert.deepEqual(parsed.map(item => item.type === "pause" ? "pause" : item.language), ["en-GB", "de-DE", "pause", "en-GB"]);
  assert.equal(parsed[1].text, "Je mehr ich übe, desto besser spreche ich.");
  const plan = planGrammarAudio(parsed);
  assert.equal(plan.filter(item => item.type === "speech").length, 3);
  assert.deepEqual(grammarAssemblyPlan(plan).map(item => item.type), ["speech", "speech", "pause", "speech"]);
});

test("grammar speech plans batch same-language lines but never combine English and German", () => {
  const plan = planGrammarAudio(parseGrammarAudioScript("EN: First sentence.\nEN: Second sentence.\nDE: Ich lerne Deutsch.\nDE: Ich spreche Deutsch."));
  assert.equal(plan.length, 2);
  assert.equal(plan[0].turns.length, 2);
  assert.equal(plan[1].turns.length, 2);
  assert.notEqual(grammarAudioCacheKey("lite", plan[0]), grammarAudioCacheKey("lite", plan[1]));
  assert.notEqual(grammarAudioCacheKey("flash", plan[0]), grammarAudioCacheKey("lite", plan[0]));
});

test("untrusted grammar scripts fail before any paid speech calls", () => {
  assert.throws(() => parseGrammarAudioScript("The more I practise."), /EN: or DE:/);
  assert.throws(() => parseGrammarAudioScript("DE: Hallo [PAUSE 3]"), /separate/);
  assert.throws(() => parseGrammarAudioScript("[PAUSE 25]\nDE: Hallo"), /between 1 and 15/);
});

test("oversized grammar recordings are rejected and long sentences split safely", () => {
  const longText = "German grammar is easier when examples are clear. ".repeat(12);
  const parts = parseGrammarAudioScript("EN: " + longText);
  assert.ok(parts.filter(part => part.type === "speech").length >= 2);
  assert.ok(parts.filter(part => part.type === "speech").every(part => part.text.length <= 320));
  const tooMany = Array.from({ length: 37 }, (_, i) => "EN: Phrase number " + i + ".\n[PAUSE 1]").join("\n");
  assert.throws(() => planGrammarAudio(parseGrammarAudioScript(tooMany)), /36 generated scenes/);
});

test("grammar script generation uses an existing constrained CEFR and language selector", () => {
  assert.deepEqual(validateGrammarScriptRequest({ level: "b1", topic: "je desto", languageMode: "bilingual" }), {
    level: "B1", topic: "je desto", languageMode: "bilingual"
  });
  assert.throws(() => validateGrammarScriptRequest({ topic: "ab" }), /4–160/);
  assert.throws(() => validateGrammarScriptRequest({ topic: "je desto", languageMode: "other" }), /bilingual/);
});

test("grammar audio is language-aware without changing the existing German Hören request", () => {
  const turns = [{ speaker: "A", text: "The more I practise, the better I become." }];
  const grammar = validateSceneRequest({ turns, engine: "lite", style: "grammar", language: "en-GB" });
  assert.deepEqual(grammar, { turns, engine: "lite", style: "grammar", language: "en-GB" });
  const payload = buildSpeechPayload(grammar);
  assert.equal(payload.generation_config.speech_config[0].language, "en-GB");
  assert.match(payload.input[0].content[0].annotations[0].style, /language teacher/);
  const legacy = buildSpeechPayload(validateSceneRequest({ turns, engine: "lite" }));
  assert.equal(legacy.generation_config.speech_config[0].language, "de-DE");
  assert.throws(() => validateSceneRequest({ turns, style: "grammar", language: "fr-FR" }), /English or German/);
  assert.throws(() => validateSceneRequest({ turns, style: "narrator" }), /Unsupported speech style/);
});

test("free optimization removes only redundant cue scenes, preserving German and grammar", () => {
  const original = [
    "EN: The verb lernen means to learn.",
    "EN: Listen to these German examples.",
    "DE: Ich lerne Deutsch.",
    "EN: The du form ends with S T.",
    "EN: Listen to this example.",
    "DE: Du lernst Deutsch.",
    "[PAUSE 3]",
    "EN: Complete the sentence.",
    "DE: Wir lernen Deutsch."
  ].join("\n");
  const result = optimizeGrammarAudioScript(original);
  assert.equal(result.saved, 2);
  assert.equal(result.removed.length, 2);
  assert.match(result.script, /The du form ends with S T/);
  assert.match(result.script, /DE: Du lernst Deutsch\./);
  assert.match(result.script, /\[PAUSE 3\]/);
  assert.equal(optimizeGrammarAudioScript(result.script).saved, 0);
});

test("optimizer leaves meaningful language instruction and examples unchanged", () => {
  const source = "EN: Listen carefully to the difference between O and Ö.\nDE: schon. schön.\nEN: The letter O changes the meaning.";
  const result = optimizeGrammarAudioScript(source);
  assert.equal(result.saved, 0);
  assert.equal(result.script, source);
});
