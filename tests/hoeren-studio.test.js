import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { parseStudioTranscript, assembleListeningExam } from "../src/utils/hoerenAudio.js";

const require = createRequire(import.meta.url);
const {
  MODELS, LIMITS, ownerUid, validateSpeechRequest,
  validateScriptRequest, extractAudio, extractScript,
} = require("../functions/hoerenStudioApi.js");

function fakeWav() {
  const bytes = new Uint8Array(48);
  const view = new DataView(bytes.buffer);
  bytes.set([82,73,70,70],0); view.setUint32(4,40,true);
  bytes.set([87,65,86,69,102,109,116,32],8);
  view.setUint32(16,16,true); view.setUint16(20,1,true);
  view.setUint16(22,1,true); view.setUint32(24,24000,true);
  view.setUint32(28,48000,true); view.setUint16(32,2,true);
  view.setUint16(34,16,true);
  bytes.set([100,97,116,97],36); view.setUint32(40,4,true);
  bytes.set([1,0,2,0],44);
  return bytes;
}
test("owner-only requires explicit configured UID (fail closed)", () => {
  assert.equal(ownerUid({}, {}), "");
  assert.equal(ownerUid({ ai_studio: { owner_uid: "abc" } }, {}), "abc");
  assert.equal(ownerUid({}, { HOEREN_STUDIO_OWNER_UID: "mine" }), "mine");
});
test("Gemini model ids and request quotas are explicit", () => {
  assert.equal(MODELS.lite, "gemini-3.8-flash-lite-tts");
  assert.equal(MODELS.flash, "gemini-3.8-flash-tts");
  assert.ok(LIMITS.speech <= 36);
});
test("speech requests strictly limit paid generation inputs", () => {
  assert.deepEqual(validateSpeechRequest({ text: "Guten Tag!", speaker: "B", engine: "flash" }), {
    text: "Guten Tag!", speaker: "B", engine: "flash",
  });
  assert.throws(() => validateSpeechRequest({ text: "x".repeat(321) }), /320/);
  assert.throws(() => validateSpeechRequest({ text: "Hello", engine: "unknown" }), /engine/);
  assert.throws(() => validateSpeechRequest({ text: "[PAUSE 3]" }), /Pause/);
  assert.throws(() => validateScriptRequest({ level: "C2", type: "dialogue", topic: "Hallo" }), /level/);
});
test("Goethe-style editable transcript parses exact pauses and voices", () => {
  assert.deepEqual(parseStudioTranscript("A: Hallo\n[PAUSE 3]\nB: Guten Tag"), [
    { type: "speech", speaker: "A", text: "Hallo" },
    { type: "pause", seconds: 3 },
    { type: "speech", speaker: "B", text: "Guten Tag" },
  ]);
  assert.throws(() => parseStudioTranscript("Narrator: Hello"), /Line 1/);
  assert.throws(() => parseStudioTranscript("[PAUSE 50]"), /Pauses/);
});
test("clip assembler produces valid WAV and repeats without another request", async () => {
  const blob = assembleListeningExam(
    parseStudioTranscript("A: Hallo\n[PAUSE 1]\nB: Ja"),
    [fakeWav(), fakeWav()],
    { repeats: 2, lineGap: 0, repeatGap: 2 },
  );
  const audio = new Uint8Array(await blob.arrayBuffer());
  assert.equal(String.fromCharCode(...audio.slice(0,4)), "RIFF");
  assert.equal(String.fromCharCode(...audio.slice(8,12)), "WAVE");
  // Two tiny clips x two passes + (1s pause x twice) + 2s replay gap.
  assert.equal(audio.length, 44 + (4 * 4) + (24000 * 2 * 4));
});
test("Google REST audio and script are checked before accepting a response", () => {
  const bytes = fakeWav();
  assert.equal(extractAudio({ steps: [{ type: "model_output", content: [{ type: "audio", data: Buffer.from(bytes).toString("base64") }] }] }).size, bytes.length);
  assert.throws(() => extractAudio({ steps: [] }), /did not return audio/);
  assert.equal(extractScript({ candidates: [{ content: { parts: [{ text: "A: Guten Tag" }] } }] }), "A: Guten Tag");
  assert.throws(() => extractScript({ candidates: [] }), /empty/);
});
