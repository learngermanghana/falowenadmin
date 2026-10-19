import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { parseStudioTranscript, formatStudioTranscript, sameSpokenTranscript, assembleListeningExam } from "../src/utils/hoerenAudio.js";
import { validateDraftQuestions } from "../src/utils/hoerenQuestions.js";
import { inspectHoerenDraft } from "../src/utils/hoerenDraftQuality.js";

const require = createRequire(import.meta.url);
const { EXAM_PROFILES, getExamProfile, buildExamPrompt } = require("../functions/hoerenExamProfiles.js");
const { validateQuestionSet, extractLessonDraft, questionInstructions } = require("../functions/hoerenQuestions.js");
const {
  MODELS, LIMITS, ownerUid, isStudioOwner, validateSpeechRequest,
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
test("only the approved Firebase owner UID passes server auth", () => {
  assert.equal(isStudioOwner("unrelated-user", {}, {}), false);
  assert.equal(isStudioOwner("different-uid", {}, { HOEREN_STUDIO_OWNER_UID: "different-uid" }), true);
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
  assert.throws(() => validateScriptRequest({ mode: "goethe", level: "C2", type: "dialogue", topic: "Hallo" }), /Teil/);
  assert.equal(validateSpeechRequest({ text: "Guten Tag", speaker: "C" }).speaker, "C");
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

test("all official Hören Teil/Aufgabe selections are configured", () => {
  for (const [level, count] of Object.entries({ A2: 4, B1: 4, B2: 4, C1: 4, C2: 3 })) {
    assert.equal(Object.keys(EXAM_PROFILES[level]).length, count);
  }
  const profile = getExamProfile("C1", "1");
  assert.equal(profile.label, "Podcast · Buch 1/2/3");
  assert.equal(profile.repeats, 1);
  assert.equal(profile.questionCount, 6);
  assert.equal(profile.kind, "multiple-choice");
  assert.equal(validateScriptRequest({ level: "C1", part: "1", type: "podcast", topic: "Drei Bücher" }).profile, profile);
  assert.throws(() => validateScriptRequest({ level: "C1", part: "1", type: "telephone", topic: "Drei Bücher" }), /does not match/);
  assert.equal(getExamProfile("C2", "4"), null);
  const prompt = buildExamPrompt(profile, "Neue Romane", questionInstructions(profile.kind, profile.questionCount));
  assert.match(prompt, /Buch 1/);
  assert.match(prompt, /exactly 6 objects/);
  assert.match(prompt, /once|Einmaliges/);
});
test("C1 Buch 1/2/3 matching requires six evidence-backed choices", () => {
  const script = "A: Erstes Buch ist ein Roman über eine Forschungsreise. Zweites Buch erzählt von historischen Häfen. Drittes Buch erklärt den Klimawandel.";
  const names = ["Buch 1 – Reise", "Buch 2 – Häfen", "Buch 3 – Klima"];
  const fragments = ["Erstes Buch ist ein Roman", "Zweites Buch erzählt von historischen Häfen", "Drittes Buch erklärt den Klimawandel"];
  const questions = Array.from({ length: 6 }, (_, i) => ({
    question: "Welches Buch passt zur Aussage Nummer " + (i + 1) + "?",
    options: names,
    correctIndex: i % 3,
    evidence: fragments[i % 3],
  }));
  assert.equal(validateQuestionSet({ script, kind: "multiple-choice", questions, expectedCount: 6 }).length, 6);
  assert.equal(validateDraftQuestions({ script, kind: "multiple-choice", questions, expectedCount: 6 }).length, 6);
  assert.throws(() => validateQuestionSet({ script, kind: "multiple-choice", questions: questions.slice(0, 5), expectedCount: 6 }), /Exactly 6/);
  const result = { candidates: [{ content: { parts: [{ text: JSON.stringify({ script, kind: "multiple-choice", questions }) }] } }] };
  assert.equal(extractLessonDraft(result, 6).questions.length, 6);
  assert.throws(() => extractLessonDraft(result, 5), /Exactly 5/);
});

test("Course Book mode accepts any supported level with manually selected multiple choice", () => {
  const request = validateScriptRequest({ mode: "course", level: "B2", type: "interview", topic: "Arbeit und Beruf", kind: "multiple-choice" });
  assert.equal(request.mode, "course");
  assert.equal(request.profile, null);
  assert.equal(request.kind, "multiple-choice");
  const legacy = validateScriptRequest({ level: "A1", type: "dialogue", topic: "Bus fahren" });
  assert.equal(legacy.mode, "course");
  assert.throws(() => validateScriptRequest({ mode: "something", level: "A1", topic: "Bus fahren" }), /Course Book/);
});

test("Goethe mode locks the correct question kind and task profile", () => {
  const profile = getExamProfile("C1", "1");
  assert.equal(validateScriptRequest({ mode: "goethe", level: "C1", part: "1", type: "podcast", topic: "Bücher", kind: "richtig-falsch" }).kind, profile.kind);
  assert.throws(() => validateScriptRequest({ mode: "goethe", level: "C1", type: "dialogue", topic: "Bücher" }), /Teil/);
  assert.equal(getExamProfile("C2", "3").questionCount, 10);
});

test("structural exam preflight rejects wrong counts and preserves teacher review", () => {
  const p = getExamProfile("C1", "1");
  const script = "A: Buch eins ist ein spannender Roman über Wetter. Buch zwei ist eine Studie über Städte. Buch drei ist ein Essay über den Wald.";
  const options = ["Buch 1 – Wetter", "Buch 2 – Städte", "Buch 3 – Wald"];
  const evidence = ["Buch eins ist ein spannender Roman", "Buch zwei ist eine Studie", "Buch drei ist ein Essay"];
  const questions = Array.from({length: 6}, (_,i) => ({
    question: "Welches Buch beschreibt Aussage Nummer " + (i+1) + "?",
    options, correctIndex: i % 3, evidence: evidence[i % 3],
  }));
  const good = inspectHoerenDraft({mode:"goethe",script,kind:"multiple-choice",questions,expectedCount:6,profile:p,questionScript:script});
  assert.equal(good.errors.length,0);
  assert.equal(good.readyForVoice,true);
  const badCount = inspectHoerenDraft({mode:"goethe",script,kind:"multiple-choice",questions:questions.slice(0,5),expectedCount:6,profile:p,questionScript:script});
  assert.equal(badCount.readyForVoice,false);
  assert.match(badCount.errors.join(" "), /6/);
  const badChoices=questions.map(q=>({...q,options:["Roman","Sachbuch","Essay"]}));
  const invalid = inspectHoerenDraft({mode:"goethe",script,kind:"multiple-choice",questions:badChoices,expectedCount:6,profile:p,questionScript:script});
  assert.match(invalid.errors.join(" "), /Buch 1/);
  const changed = inspectHoerenDraft({mode:"goethe",script:script+" Extra.",kind:"multiple-choice",questions,expectedCount:6,profile:p,questionScript:script});
  assert.equal(changed.readyForVoice,false);
});

test("Course Book recording can be generated as audio-only, without published questions", () => {
  const draft = inspectHoerenDraft({mode:"course",script:"A: Hallo, heute sprechen wir über Reisen und den Fahrplan im Bahnhof.",kind:"richtig-falsch",questions:[]});
  assert.equal(draft.readyForVoice,true);
  assert.ok(draft.warnings.some(w=>/five reviewed questions/.test(w)));
});


test("pasted comma-separated transcript autoformats without changing spoken text", () => {
  const pasted = "A: Hallo Leon?,B: Ja, gerne.,[PAUSE 3],A: Bis bald.";
  const formatted = formatStudioTranscript(pasted);
  assert.equal(formatted, "A: Hallo Leon?\nB: Ja, gerne.\n[PAUSE 3]\nA: Bis bald.");
  assert.equal(parseStudioTranscript(pasted).filter(line => line.type === "speech").length, 3);
  assert.equal(sameSpokenTranscript(pasted, formatted), true);
  assert.equal(sameSpokenTranscript(pasted, formatted.replace("Bis bald", "Bis morgen")), false);
});

test("long Goethe recordings permit up to 36 speech segments", () => {
  const script = Array.from({ length: 25 }, (_, i) => `${i % 2 ? "B" : "A"}: Satz ${i + 1}.`).join("\n");
  const result = inspectHoerenDraft({ script, kind: "multiple-choice", mode: "course" });
  assert.equal(result.errors.length, 0);
  const tooLong = Array.from({ length: 37 }, (_, i) => `A: Satz ${i + 1}.`).join("\n");
  assert.match(inspectHoerenDraft({ script: tooLong, kind: "multiple-choice" }).errors.join(" "), /36 spoken segments/);
});


test("autoformat preserves commas in spoken comparisons and line-separated turns", () => {
  const spoken = "A: Wir vergleichen Modell A: günstig, B: schnell und C: leise.";
  assert.equal(formatStudioTranscript(spoken), spoken);
  assert.deepEqual(parseStudioTranscript(spoken).map(line => line.text), ["Wir vergleichen Modell A: günstig, B: schnell und C: leise."]);
  const separate = "A: Guten Tag,\nB: Hallo!";
  assert.equal(formatStudioTranscript(separate), separate);
  assert.equal(parseStudioTranscript(separate)[0].text, "Guten Tag,");
  assert.equal(sameSpokenTranscript(separate, separate.replace("Tag,", "Tag")), false);
  const pasted = "A: Guten Tag.,B: Hallo!,[PAUSE 3],A: Bis morgen.";
  assert.equal(formatStudioTranscript(pasted), "A: Guten Tag.\nB: Hallo!\n[PAUSE 3]\nA: Bis morgen.");
  const ambiguous = "A: Wähle A: günstig, B: schnell";
  assert.equal(formatStudioTranscript(ambiguous), ambiguous);
});

test("pasted transcript delimiters accept spaces and tabs without joining speakers", () => {
  for (const separator of [", ", ",\t", ", \t"]) {
    const turns = `A: Hallo.${separator}B: Guten Tag.`;
    assert.equal(formatStudioTranscript(turns), "A: Hallo.\nB: Guten Tag.");
    assert.deepEqual(parseStudioTranscript(turns), [
      { type: "speech", speaker: "A", text: "Hallo." },
      { type: "speech", speaker: "B", text: "Guten Tag." },
    ]);
    assert.equal(sameSpokenTranscript(turns, "A: Hallo.\nB: Guten Tag."), true);

    const pauseTurn = `[PAUSE 3]${separator}A: Bis bald.`;
    assert.equal(formatStudioTranscript(pauseTurn), "[PAUSE 3]\nA: Bis bald.");
    assert.deepEqual(parseStudioTranscript(pauseTurn), [
      { type: "pause", seconds: 3 },
      { type: "speech", speaker: "A", text: "Bis bald." },
    ]);

    const toPause = `A: Hallo.${separator}[PAUSE 3]`;
    assert.equal(formatStudioTranscript(toPause), "A: Hallo.\n[PAUSE 3]");
  }
});

test("comma delimiters never consume newlines or reassign spoken comparison text", () => {
  const alreadySplit = "A: Guten Tag,\nB: Hallo!";
  assert.equal(formatStudioTranscript(alreadySplit), alreadySplit);
  assert.equal(formatStudioTranscript("A: Hallo.,\nB: Guten Tag."), "A: Hallo.,\nB: Guten Tag.");
  assert.equal(formatStudioTranscript("[PAUSE 3],\nA: Bis bald."), "[PAUSE 3],\nA: Bis bald.");
  const comparison = "A: Modell A: günstig, B: schnell und C: leise.";
  assert.equal(formatStudioTranscript(comparison), comparison);
  assert.deepEqual(parseStudioTranscript(comparison).map(line => line.speaker), ["A"]);
  const comparisonTab = "A: Modell A: günstig,\tB: schnell.";
  assert.equal(formatStudioTranscript(comparisonTab), comparisonTab);
});
