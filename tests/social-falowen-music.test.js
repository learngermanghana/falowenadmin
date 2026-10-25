import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOCIAL_MUSIC_TRACKS } from "../src/utils/socialMusicLibrary.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root,file),"utf8");
test("Falowen soundtrack entries link to real public MP3 files", () => {
  assert.deepEqual(SOCIAL_MUSIC_TRACKS.map(t=>t.id), ["none","gemeinsam","willkommen"]);
  for (const track of SOCIAL_MUSIC_TRACKS.filter(t=>t.src)) {
    assert.ok(fs.existsSync(path.join(root,"public",decodeURIComponent(track.src.slice(1)))),track.label);
  }
});
test("vocabulary video includes song in exported audio track", () => {
  const source = read("src/components/SocialVocabularyVideoCreator.jsx");
  assert.match(source,/Falowen song for MP4 export/);
  assert.match(source,/await addSocialMusic\(context, output, falowenTrack/);
  assert.match(source,/output.stream.getAudioTracks\(\)/);
});
test("challenge MP4 supports the same Falowen songs", () => {
  const source = read("src/components/SocialGermanChallenges.jsx");
  assert.match(source,/Falowen background song for MP4/);
  assert.match(source,/await addSocialMusic\(audioContext, output, falowenTrack/);
  assert.match(source,/output.stream.getAudioTracks\(\)/);
});
