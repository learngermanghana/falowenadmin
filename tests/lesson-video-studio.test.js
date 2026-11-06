import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildLessonNarrationPlan, lessonNarrationSlideStarts, assembleLessonNarration } from "../src/utils/lessonSpeechSynthesis.js";
import { wavDurationSeconds } from "../src/utils/hoerenAudio.js";
import { sceneVoiceKey } from "../src/utils/hoerenSpeechPlan.js";
import {
  activeLessonHighlights, activeLessonSlide, prepareLessonScript, safeLessonFilename,
  spreadLessonSlides, timeLabel,
} from "../src/utils/lessonVideoStudio.js";

test("slide timestamps follow narration timeline and can be evenly spaced", () => {
  const slides = spreadLessonSlides([
    { image: "1", start: 0 }, { image: "2", start: 0 }, { image: "3", start: 0 },
  ], 90);
  assert.deepEqual(slides.map(s => s.start), [0, 30, 60]);
  assert.equal(activeLessonSlide(slides, 29.5), 0);
  assert.equal(activeLessonSlide(slides, 30), 1);
  assert.equal(activeLessonSlide(slides, 88), 2);
  assert.equal(timeLabel(125), "2:05");
});
test("highlights are scoped to their slide and bounded by start/end", () => {
  const markers = [
    { slide: 0, start: 1.2, end: 3.2, x: 0.1, y: 0.2, w: 0.4, h: 0.2 },
    { slide: 1, start: 1.2, end: 3.2 },
  ];
  assert.equal(activeLessonHighlights(markers, 0, 1.1).length, 0);
  assert.equal(activeLessonHighlights(markers, 0, 2).length, 1);
  assert.equal(activeLessonHighlights(markers, 1, 2).length, 1);
  assert.equal(activeLessonHighlights(markers, 0, 3.2).length, 0);
});
test("script outlines preserve teacher edits and use imported slide text", () => {
  const output = prepareLessonScript([
    { script: "Hallo!", text: "Original" }, { text: "Wenn es regnet, bleibe ich zu Hause." }, { text: "" },
  ]);
  assert.match(output, /Hallo!/);
  assert.match(output, /Wenn es regnet, bleibe ich zu Hause/);
  assert.match(output, /Write or paste/);
  assert.equal(safeLessonFilename('Mastering „Wenn“ & „Falls“'), "mastering-wenn-falls");
});
test("lesson-video studio is owner-scoped and lazy-loaded", () => {
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(app, /const LessonVideoStudioPage = lazy/);
  assert.match(app, /<Route path="\/lesson-video-studio" element={<OwnerStudioRoute lesson \/>} \/>/);
  assert.match(app, /lesson \? <LessonVideoStudioPage \/> : music/);
  assert.match(app, /ownerUid \|\| user.uid !== ownerUid/);
});
test("local lesson video export does not make API calls", () => {
  const src = readFileSync(new URL("../src/utils/lessonVideoStudio.js", import.meta.url), "utf8");
  assert.match(src, /MediaRecorder/);
  assert.match(src, /canvas\.captureStream/);
  assert.match(src, /createMediaStreamDestination/);
  assert.doesNotMatch(src, /\/api\/|firestore|openai\.com|cloudflare\.com/);
});


function fakeOneSecondWav() {
  const pcm = 48_000;
  const data = new Uint8Array(44 + pcm);
  const view = new DataView(data.buffer);
  const ascii = (offset, value) => { for (let i = 0; i < value.length; i++) data[offset + i] = value.charCodeAt(i); };
  ascii(0, "RIFF"); view.setUint32(4, data.length - 8, true);
  ascii(8, "WAVE"); ascii(12, "fmt "); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 24_000, true); view.setUint32(28, 48_000, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, "data"); view.setUint32(40, pcm, true);
  return data;
}

test("lesson TTS uses the established Hören scene size and preserves pauses", () => {
  const plan = buildLessonNarrationPlan({
    slides: [
      { script: "Wenn es regnet, bleibe ich zu Hause. [PAUSE 2] Ich lerne Deutsch." },
      { script: "Falls du Fragen hast, ruf mich an." },
    ],
    engine: "lite", speaker: "A", source: "slides",
  });
  assert.equal(plan.source, "slides");
  assert.equal(plan.steps.filter(step => step.type === "pause").length, 1);
  assert.equal(plan.scenes.length, 3);
  assert.ok(plan.scenes.every(scene => scene.turns.length <= 8));
  assert.ok(plan.scenes.every(scene => scene.turns.every(turn => turn.text.length <= 320)));
  assert.ok(plan.scenes.every(scene => scene.turns.reduce((n, turn) => n + turn.text.length, 0) <= 520));
  assert.equal(plan.steps.find(step => step.type === "pause").seconds, 2);
});

test("generated per-slide narration starts after actual WAV clip durations and local pauses", async () => {
  const plan = buildLessonNarrationPlan({
    slides: [{ script: "Wenn es regnet. [PAUSE 2] Bleibe ich zu Hause." }, { script: "Falls es regnet, nehme ich einen Schirm." }],
    source: "slides",
  });
  const clips = plan.scenes.map(() => fakeOneSecondWav());
  const { starts, duration } = lessonNarrationSlideStarts(plan, clips);
  assert.equal(starts.get(0), 0);
  assert.equal(starts.get(1), 4.7);
  const audio = assembleLessonNarration(plan, clips);
  const written = new Uint8Array(await audio.arrayBuffer());
  assert.ok(Math.abs(wavDurationSeconds(written) - duration) < 0.0001);
});

test("full-transcript narration does not falsely claim per-slide alignment", () => {
  const slides = [{ script: "" }, { script: "" }];
  const plan = buildLessonNarrationPlan({ slides, fullScript: "I do not know whether he is coming.", source: "auto" });
  assert.equal(plan.source, "full");
  assert.equal(plan.uniqueKeys.length, 1);
  assert.throws(() => buildLessonNarrationPlan({ slides, source: "slides" }), /Slide 1 has no narration/);
  assert.throws(() => buildLessonNarrationPlan({ slides, fullScript: "Hi [PAUSE 45]", source: "full" }), /Pauses must|Use \[PAUSE 2\]/);
});

test("unchanged scripts give identical IndexedDB voice cache keys", () => {
  const args = { slides: [{ script: "Hallo und herzlich willkommen!" }], source: "slides", engine: "lite", speaker: "A" };
  const first = buildLessonNarrationPlan(args);
  const second = buildLessonNarrationPlan(args);
  assert.equal(sceneVoiceKey("lite", first.scenes[0]), sceneVoiceKey("lite", second.scenes[0]));
  assert.notEqual(sceneVoiceKey("flash", first.scenes[0]), sceneVoiceKey("lite", first.scenes[0]));
});

test("lesson TTS is owner-only and reuses the Hören API rather than creating new endpoints", () => {
  const page = readFileSync(new URL("../src/pages/LessonVideoStudioPage.jsx", import.meta.url), "utf8");
  const tts = readFileSync(new URL("../src/components/LessonTextToSpeech.jsx", import.meta.url), "utf8");
  assert.match(page, /<LessonTextToSpeech/);
  assert.match(page, /acceptGeneratedNarration/);
  assert.match(tts, /getStudioStatus/);
  assert.match(tts, /makeSpeechClip/);
  assert.match(tts, /getSavedVoice/);
  assert.match(tts, /saveVoice/);
  assert.match(tts, /pending.length > fresh.remaining.speech/);
  assert.doesNotMatch(tts, /fetch\(|cloudflare|\/api\/voice/);
});
