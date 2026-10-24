import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  chooseVocabularyVideoMime, originalMusicNotes, renderVocabularyFrame,
  videoFileStem, videoStageAt, VIDEO_DURATIONS, VIDEO_RESOLUTIONS, VIDEO_THEMES,
} from "../src/utils/socialVocabularyVideo.js";
test("vocabulary video uses three consistent branded themes and standard vertical sizes", () => {
  assert.deepEqual(VIDEO_THEMES.map(row => row.id), ["blue", "midnight", "light"]);
  assert.deepEqual(VIDEO_DURATIONS, [8, 12, 15]);
  for (const preset of VIDEO_RESOLUTIONS) assert.equal(preset.width / preset.height, 9 / 16);
});
test("timeline reserves time for intro, word, meaning, example and ending", () => {
  assert.equal(videoStageAt(0, 12), "intro");
  assert.equal(videoStageAt(3, 12), "word");
  assert.equal(videoStageAt(5, 12), "meaning");
  assert.equal(videoStageAt(8, 12), "example");
  assert.equal(videoStageAt(11.5, 12), "outro");
});
test("filename sanitizes German vocabulary without losing the level", () => {
  assert.equal(videoFileStem({ level: "A1", german: "aussteigen" }), "falowen-vocab-a1-aussteigen");
  assert.equal(videoFileStem({ level: "B2", german: "große Übung!" }), "falowen-vocab-b2-grosse-ubung");
  assert.doesNotMatch(videoFileStem({ level: "A1", german: "../../unsafe filename" }), /[/\\]/);
});
test("format selection does not label WebM as MP4", () => {
  assert.deepEqual(chooseVocabularyVideoMime(t => t === "video/mp4"), { mime: "video/mp4", extension: "mp4" });
  assert.equal(chooseVocabularyVideoMime(t => t === "video/webm;codecs=vp8,opus"), null);
  assert.equal(chooseVocabularyVideoMime(() => false), null);
});
test("original music notes are deterministic and bounded to duration; silence has zero notes", () => {
  for (const style of ["gentle", "bright"]) {
    const notes = originalMusicNotes(12, style);
    assert.ok(notes.length >= 5);
    assert.deepEqual(notes, originalMusicNotes(12, style));
    for (const note of notes) {
      assert.ok(note.time >= 0 && note.length > 0);
      assert.ok(note.time + note.length <= 12 + 0.01);
      assert.ok(note.frequency > 180 && note.volume < .05);
    }
  }
  assert.deepEqual(originalMusicNotes(12, "none"), []);
});
test("drawing a missing word or canvas is a harmless no-op", () => {
  assert.doesNotThrow(() => renderVocabularyFrame(null, null));
  assert.doesNotThrow(() => renderVocabularyFrame({}, null));
});


test("Vocabulary Studio uses the actual Sheet1 tab and safe fallback CSV URLs", () => {
  const src = readFileSync(new URL("../src/components/SocialVocabularyCreator.jsx", import.meta.url), "utf8");
  assert.match(src, /sheet=Sheet1/);
  assert.match(src, /export\?format=csv&gid=0/);
  assert.doesNotMatch(src, /sheet=German_Vocabs/);
  assert.match(src, /CSV_URLS = \[\.\.\.new Set\(/);
});
\n