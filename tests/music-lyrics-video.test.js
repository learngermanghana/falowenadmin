import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { videoLyricLines, lyricScenes, findLyricScene, videoRecorderFormat, timedLyricsPack, verifiedPublishedVideoTiming, musicVideoSocialCopy } from "../src/utils/musicLyricsVideo.js";

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

test("shared sidecar retains exact line marks and rejects screen-only or mismatched timing", () => {
  const key="music/a2/day-01/Ein neues Gespräch.mp3";
  const lyrics="[Verse]\nHallo\nWie geht es dir?";
  const cues=[{start:2.4,text:"Hallo"},{start:5.9,text:"Wie geht es dir?"}];
  assert.deepEqual(timedLyricsPack(key,lyrics,cues),{version:1,objectKey:key,lyrics,cues});
  assert.throws(()=>timedLyricsPack(key,lyrics,[]),/every lyric line/);
  assert.throws(()=>timedLyricsPack(key,lyrics,cues.slice(0,1)),/every lyric line/);
  assert.throws(()=>timedLyricsPack(key,lyrics,[cues[1],cues[0]]),/every lyric line/);
  assert.throws(()=>timedLyricsPack("a2/day-01/private.mp3",lyrics,cues),/published MP3/);
});

test("published video timing uses only complete cues for the exact recording and recorded lyrics", () => {
  const key="music/a1/day-13/zwei-tees-vier-euro.mp3";
  const lyrics="[Verse]\\nZwei Tees, bitte\\nVier Euro\\nDanke schön";
  const cues=[
    {start:1.1,text:"Zwei Tees, bitte"},
    {start:4.5,text:"Vier Euro"},
    {start:7.7,text:"Danke schön"},
  ];
  const pack={objectKey:key,lyrics,cues};
  assert.deepEqual(verifiedPublishedVideoTiming(pack,key),{lyrics,cues});
  assert.equal(verifiedPublishedVideoTiming(pack,"music/a1/day-14/other.mp3"),null);
  assert.equal(verifiedPublishedVideoTiming({...pack,cues:cues.slice(0,2)},key),null);
  assert.equal(verifiedPublishedVideoTiming({...pack,lyrics:"Zwei Tees, bitte\\nDanke schön"},key),null);
  assert.equal(verifiedPublishedVideoTiming({...pack,cues:[cues[1],cues[0],cues[2]]},key),null);
});

test("Falowen Music keeps both tabs mounted and the video reuses public timings", () => {
  const studio=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  const video=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(studio,/role="tablist"/);
  assert.match(studio,/Music Generator/);
  assert.match(studio,/Lyrics Video Studio/);
  assert.ok(studio.includes("style={{display:studioTab === 'video' ? undefined : 'none'}}"));
  assert.ok(!studio.includes("key={courseMode + '-' + assignmentKey}"));
  assert.ok(video.includes("api/music-lyrics?key="));
  assert.match(video,/verifiedPublishedVideoTiming/);
  assert.match(video,/publishedTrack && !completeCues/);
});

test('export metadata follows the selected song and offers editable copy buttons', () => {
  const copy=musicVideoSocialCopy({title:'Zwei Tees, vier Euro',level:'A1',day:13});
  assert.match(copy.title,/Zwei Tees, vier Euro/);
  assert.match(copy.title,/German A1 Song/);
  assert.match(copy.description,/Level: A1/);
  assert.match(copy.description,/Day 13/);
  assert.match(copy.description,/music.falowen.app/);
  assert.ok(copy.title.length <= 100);
  const video=readFileSync(new URL('../src/components/MusicLyricsVideoStudio.jsx',import.meta.url),'utf8');
  assert.match(video,/Copy title/);
  assert.match(video,/Copy description/);
  assert.match(video,/Copy both/);
  assert.match(video,/navigator.clipboard/);
});
