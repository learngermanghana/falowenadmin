import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { videoLyricLines, lyricScenes, findLyricScene, videoRecorderFormat } from "../src/utils/musicLyricsVideo.js";

test("video lyrics use at most three meaningful lines per timed screen", () => {
  const text="[Verse 1]\nHallo Welt\nIch bin da\nDu bist hier\n[Chorus]\nWir lernen\nHeute und morgen";
  assert.deepEqual(videoLyricLines(text), ["Hallo Welt","Ich bin da","Du bist hier","Wir lernen","Heute und morgen"]);
  const scenes=lyricScenes(text,20);
  assert.equal(scenes.length,2);
  assert.deepEqual(scenes[0].lines,["Hallo Welt","Ich bin da","Du bist hier"]);
  assert.deepEqual(scenes[1].lines,["Wir lernen","Heute und morgen"]);
  assert.deepEqual(scenes.map(x=>x.start),[0,10]);
  assert.equal(findLyricScene(scenes,11),1);
  assert.equal(findLyricScene(scenes,1),0);
});
test("manual lyric timing stays separate from the draft and never exceeds three lines", () => {
  const scenes=lyricScenes("a\nb\nc\nd\ne\nf",30,[0,7]);
  assert.deepEqual(scenes.map(x=>x.start),[0,7]);
  assert.equal(scenes[1].lines.length,3);
});
test("format selection never renames WebM as MP4", () => {
  assert.deepEqual(videoRecorderFormat(mime=>mime==="video/webm"),{mime:"video/webm",extension:"webm"});
  assert.deepEqual(videoRecorderFormat(mime=>mime==="video/mp4"),{mime:"video/mp4",extension:"mp4"});
  assert.equal(videoRecorderFormat(()=>false),null);
});
test("Music Studio includes the local video workflow and exact R2 lyrics sidecar export", () => {
  const studio=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  const video=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(studio,/MusicLyricsVideoStudio/);
  assert.match(video,/captureStream\(24\)/);
  assert.match(video,/createMediaStreamDestination/);
  assert.match(video,/MediaRecorder/);
  assert.match(video,/isRealMp4Blob/);
  assert.match(video,/reference|review|matching lyrics/i);
  assert.match(video,/\.lyrics\.json/);
  assert.doesNotMatch(video,/cloudfunctions\.net|uploadBytes|setDoc/);
});
