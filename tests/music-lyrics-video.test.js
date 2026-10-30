import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { A1_DAY5_FINAL_RECORDING } from "../src/data/a1Day5FinalRecording.js";
import { A1_DAY6_FINAL_RECORDING } from "../src/data/a1Day6FinalRecording.js";
import { A1_DAY7_FINAL_RECORDING } from "../src/data/a1Day7FinalRecording.js";
import { A1_DAY8_FINAL_RECORDING } from "../src/data/a1Day8FinalRecording.js";
import { A1_DAY10_FINAL_RECORDING } from "../src/data/a1Day10FinalRecording.js";
import { A1_DAY17_FINAL_RECORDING } from "../src/data/a1Day17FinalRecording.js";
import { A1_DAY18_FINAL_RECORDING } from "../src/data/a1Day18FinalRecording.js";
import { A1_DAY22_FINAL_RECORDING } from "../src/data/a1Day22FinalRecording.js";
import { A2_DAY21_FINAL_RECORDING } from "../src/data/a2Day21FinalRecording.js";
import { A2_DAY22_FINAL_RECORDING } from "../src/data/a2Day22FinalRecording.js";
import { getReusableSongDraft } from "../src/data/reusableMusicSongbook.js";
import { validateLyricCues } from "../src/utils/songLyrics.js";
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

test("export does not silently produce an incompatible WebM or an untested MP4", () => {
  const src=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(src,/canReadVideoBlob/);
  assert.match(src,/video\.onloadeddata/);
  assert.match(src,/if\(format\.extension==="mp4" && !\(await isRealMp4Blob\(blob\)\)\)/);
  assert.match(src,/supported\?\.extension==="webm"&&!allowWebm/);
  assert.match(src,/I understand — export WebM anyway/);
  assert.match(src,/Check your exported video/);
  assert.match(src,/Download video again/);
  assert.match(src,/could not be played back/);
  assert.match(src,/fixWebmDuration/);
});

test("A1 Day 5 matches the new singer recording, and exact-file timing remains reviewable", () => {
  const day5=getReusableSongDraft("A1-1.3");
  assert.equal(day5.title,"Schön, dich kennenzulernen");
  assert.match(day5.lyrics,/Ich heiße Sara/);
  assert.match(day5.lyrics,/Er spricht Arabisch und etwas Deutsch/);
  assert.doesNotMatch(day5.lyrics,/Bello|kleinen Hund/);
  assert.match(day5.musicStyle,/Afro-soul/i);
  assert.equal(A1_DAY5_FINAL_RECORDING.assignmentKey,"A1-1.3");
  assert.equal(A1_DAY5_FINAL_RECORDING.duration,144.96);
  assert.equal(A1_DAY5_FINAL_RECORDING.sha256,"bfe8d48468fc6a2802b916ee97f9c42ff44795226e2300f6d9714a686881d3d8");
  assert.equal(A1_DAY5_FINAL_RECORDING.level,"A1");
  assert.equal(A1_DAY5_FINAL_RECORDING.day,5);
  assert.equal(A1_DAY5_FINAL_RECORDING.status,"draft-timing-review-required");
  const lines=videoLyricLines(day5.lyrics);
  const cues=A1_DAY5_FINAL_RECORDING.cueStarts.map((start,i)=>({start,text:lines[i]}));
  assert.equal(lines.length,31);
  assert.equal(cues.length,lines.length);
  assert.equal(validateLyricCues(cues,lines).length,lines.length);
  assert.ok(cues.at(-1).start<A1_DAY5_FINAL_RECORDING.duration);
  const video=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(video,/crypto\.subtle\.digest\("SHA-256"/);
  assert.match(video,/hash!==reference\.sha256/);
  assert.match(video,/timingReview/);
  assert.match(video,/\|\|timingReview/);
});
test("A1 Day 6 contains the new adult family story and its questions remain grounded", () => {
  const song=getReusableSongDraft("A1-2.3");
  assert.equal(song.title,"Ein Sonntag mit meiner Familie");
  assert.match(song.musicStyle,/Light Afro-Pop Rhythm/);
  assert.match(song.lyrics,/Meine Mutter kocht den Kaffee/);
  assert.match(song.lyrics,/Mein Bruder spielt Gitarre dann/);
  assert.match(song.lyrics,/Durch den Park, am See vorbei/);
  assert.match(song.lyrics,/Die Sonne geht langsam unter/);
  assert.doesNotMatch(song.lyrics,/Was machst du gern\? Was machst du gern\?/);
  const seeds=readFileSync(new URL("../src/data/musicQuestionSeedsA1.js",import.meta.url),"utf8");
  assert.match(seeds,/Welche Sprache spricht Karim\?/);
  assert.doesNotMatch(seeds,/Wie heißt Karims Hund\?/);
});

test("timing editor supports correcting individual lines and requires owner review to publish", () => {
  const editor=readFileSync(new URL("../src/components/SongTimingEditor.jsx",import.meta.url),"utf8");
  const video=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(editor,/updateLineTime/);
  assert.match(editor,/onBlur=/);
  assert.match(editor,/useCurrentTime/);
  assert.match(video,/I reviewed and confirmed all lyric time marks/);
  assert.match(video,/reviewed:true/);
  assert.match(video,/recordingFingerprint/);
  assert.match(video,/timingReview\}/);
});

test("A1 Day 7 Was kostet das uses the recorded market-shopping song and exact R2 identity", () => {
  const song=getReusableSongDraft("A1-3");
  assert.equal(song.title,"Was kostet das?");
  assert.match(song.musicStyle,/96 BPM/);
  assert.match(song.lyrics,/Heute gehe ich auf den Markt/);
  assert.match(song.lyrics,/Die Blumen sind gelb, die Äpfel rot/);
  assert.match(song.lyrics,/Drei Euro für ein Stück/);
  assert.match(song.lyrics,/Morgen kommen wir wieder her/);
  assert.doesNotMatch(song.lyrics,/Auf dem Markt sehe ich Äpfel/);
  assert.equal(A1_DAY7_FINAL_RECORDING.assignmentKey,"A1-3");
  assert.equal(A1_DAY7_FINAL_RECORDING.title,song.title);
  assert.equal(A1_DAY7_FINAL_RECORDING.duration,150);
  assert.equal(A1_DAY7_FINAL_RECORDING.objectKey,"music/a1/day-07/Was kostet das_.mp3");
  assert.equal(A1_DAY7_FINAL_RECORDING.sha256,"d48555c85dfd6e4397bc3c6031901ccab1b0c910e10fa891ef66884825336221");
  assert.equal(A1_DAY7_FINAL_RECORDING.status,"draft-timing-review-required");
  const lines=videoLyricLines(song.lyrics);
  const cues=A1_DAY7_FINAL_RECORDING.cueStarts.map((start,i)=>({start,text:lines[i]}));
  assert.equal(lines.length,40);
  assert.equal(validateLyricCues(cues,lines).length,40);
  assert.equal(cues.at(0).start,0.38);
  assert.ok(cues.at(-1).start<A1_DAY7_FINAL_RECORDING.duration);
  const studio=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(studio,/hash===draftReference.sha256/);
  assert.match(studio,/A1_DAY7_FINAL_RECORDING,A1_DAY8_FINAL_RECORDING/);
  assert.match(studio,/SHA-256/);
  assert.match(studio,/timingReview/);
  assert.match(studio,/!timingReview/);
  const page=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  assert.match(page,/obsoleteDay7Draft/);
  const seeds=readFileSync(new URL("../src/data/musicQuestionSeedsA1.js",import.meta.url),"utf8");
  assert.match(seeds,/Wie viel kostet eine Rose/);
  assert.match(seeds,/Drei Euro/);
});

test("A1 Day 8 Länder und Sprachen is mapped to the exact uploaded recording, not A2 Day 8", () => {
  const song=getReusableSongDraft("A1-4");
  assert.equal(song.title,"Viele Länder, viele Sprachen");
  assert.match(song.musicStyle,/Soft Afrobeat.*94 BPM/);
  assert.match(song.lyrics,/Ich komme aus Ghana/);
  assert.match(song.lyrics,/In Ghana spricht man Englisch/);
  assert.match(song.lyrics,/viele sprechen auch Twi/);
  assert.match(song.lyrics,/Brasilien spricht man Portugiesisch/);
  assert.match(song.lyrics,/Er spricht Deutsch und Französisch/);
  assert.match(song.lyrics,/Vielleicht sprichst du es auch/);
  assert.doesNotMatch(song.lyrics,/Im Kurs sitzt mein Freund Sam/);
  assert.equal(A1_DAY8_FINAL_RECORDING.assignmentKey,"A1-4");
  assert.equal(A1_DAY8_FINAL_RECORDING.objectKey,"music/a1/day-08/Viele Länder, viele Sprachen.mp3");
  assert.equal(A1_DAY8_FINAL_RECORDING.sha256,"61951bfa150e472ac2f291859f13a2e4c41feb3cc1f58a231ce5a936fc075c80");
  assert.equal(A1_DAY8_FINAL_RECORDING.duration,159.552);
  assert.equal(A1_DAY8_FINAL_RECORDING.status,"draft-timing-review-required");
  const lines=videoLyricLines(song.lyrics);
  const cues=A1_DAY8_FINAL_RECORDING.cueStarts.map((start,i)=>({start,text:lines[i]}));
  assert.equal(lines.length,40);
  assert.equal(validateLyricCues(cues,lines).length,40);
  assert.ok(cues.at(-1).start<A1_DAY8_FINAL_RECORDING.duration);
  const page=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  assert.match(page,/obsoleteDay8Draft/);
  const studio=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(studio,/A1_DAY8_FINAL_RECORDING/);
  assert.match(studio,/hash!==reference.sha256/);
  assert.match(studio,/hash===draftReference.sha256/);
  assert.match(studio,/timingReview/);
  const questions=readFileSync(new URL("../src/data/musicQuestionSeedsA1.js",import.meta.url),"utf8");
  assert.match(questions,/Welche Sprachen spricht der Freund aus der Schweiz/);
  assert.doesNotMatch(questions,/Welche Sprache spricht Mia/);
});

test("A2 Day 21 Endlich Wochenende lyrics, R2 identity, and draft timing match the teacher recording", () => {
  const song=getReusableSongDraft("A2-8.21");
  assert.equal(song.title,"Endlich Wochenende!");
  assert.match(song.musicStyle,/96 BPM/);
  assert.match(song.lyrics,/Es ist Freitag, die Woche ist vorbei/);
  assert.match(song.lyrics,/Ben möchte gern in die Berge fahren/);
  assert.match(song.lyrics,/Wir haben viele Ideen/);
  assert.match(song.lyrics,/Am Samstag treffen wir uns um neun/);
  assert.match(song.lyrics,/Manchmal ist es gar nicht leicht/);
  assert.match(song.lyrics,/Doch wir werden uns bald wiedersehen/);
  assert.doesNotMatch(song.lyrics,/Am Freitag fragen wir unsere Freunde/);
  const rec=A2_DAY21_FINAL_RECORDING;
  assert.equal(rec.assignmentKey,"A2-8.21");
  assert.equal(rec.title,song.title);
  assert.equal(rec.objectKey,"music/a2/day-21/Endlich Wochenende.mp3");
  assert.equal(rec.sha256,"55440940e8e8961aae3edaa9e5d6720c1bde12572c1c6e492852478713c69df9");
  assert.equal(rec.duration,171.624);
  assert.equal(rec.status,"draft-timing-review-required");
  const lines=videoLyricLines(song.lyrics);
  const cues=rec.cueStarts.map((start,i)=>({text:lines[i],start}));
  assert.equal(lines.length,44);
  assert.equal(cues.length,44);
  assert.equal(validateLyricCues(cues,lines).length,44);
  assert.ok(cues[0].start>0 && cues.at(-1).start<rec.duration);
  const studio=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(studio,/A2_DAY21_FINAL_RECORDING/);
  assert.match(studio,/hash!==reference.sha256/);
  assert.match(studio,/hash===draftReference.sha256/);
  assert.match(studio,/timingReview/);
  const page=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  assert.match(page,/supersededWeekendLyrics/);
  const questions=readFileSync(new URL("../src/data/musicQuestionSeedsA2.js",import.meta.url),"utf8");
  assert.match(questions,/Was machen die Freunde am Sonntag/);
  assert.match(questions,/ins Café, trinken Kaffee und erzählen viel/);
});

test("A2 Day 22 Zeit für mich is tied to the exact recorded music and reviewable 45-line timing", () => {
  const song=getReusableSongDraft("A2-8.22");
  assert.equal(song.title,"Zeit für mich");
  assert.match(song.musicStyle,/German Pop/);
  assert.match(song.lyrics,/Am Montag habe ich Deutschkurs/);
  assert.match(song.lyrics,/Am Dienstag arbeite ich bis acht/);
  assert.match(song.lyrics,/Am Donnerstag passt es bei mir/);
  assert.match(song.lyrics,/Wir essen Pasta und reden viel/);
  assert.match(song.lyrics,/Manchmal muss ich Termine verschieben/);
  assert.match(song.lyrics,/Jetzt steht alles in meinem Kalender/);
  assert.doesNotMatch(song.lyrics,/Montag, Dienstag, Mittwoch und mehr/);
  // This reprise is audible after the final chorus and before the outro.
  assert.match(song.lyrics,/\[Post-Chorus\]\nAuf eine kleine Pause/);
  const ref=A2_DAY22_FINAL_RECORDING;
  assert.equal(ref.assignmentKey,"A2-8.22");
  assert.equal(ref.title,song.title);
  assert.equal(ref.objectKey,"music/a2/day-22/Zeit für mich.mp3");
  assert.equal(ref.sha256,"ea30d8df12c1bd6455fd88abec7eafe2bf25e4451fcb170ce87ca4f2660357e3");
  assert.equal(ref.duration,181.44);
  assert.equal(ref.status,"draft-timing-review-required");
  const lines=videoLyricLines(song.lyrics);
  const cues=ref.cueStarts.map((start,i)=>({text:lines[i],start}));
  assert.equal(lines.length,45);
  assert.equal(cues.length,45);
  assert.equal(validateLyricCues(cues,lines).length,45);
  assert.ok(cues[0].start>0 && cues.at(-1).start<ref.duration);
  const studio=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(studio,/A2_DAY22_FINAL_RECORDING/);
  assert.match(studio,/hash!==reference.sha256/);
  assert.match(studio,/hash===draftReference.sha256/);
  assert.match(studio,/timingReview/);
  const page=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  assert.match(page,/supersededA2Day22Draft/);
  const questions=readFileSync(new URL("../src/data/musicQuestionSeedsA2.js",import.meta.url),"utf8");
  assert.match(questions,/Bis wann arbeitet die Person am Dienstag/);
  assert.match(questions,/Sie kochen zusammen, essen Pasta und reden viel/);
});

test("A1 Day 6 has a recording-specific provisional 40-line timing pack", () => {
  const song=getReusableSongDraft("A1-2.3");
  const ref=A1_DAY6_FINAL_RECORDING;
  assert.equal(ref.assignmentKey,"A1-2.3");
  assert.equal(ref.title,song.title);
  assert.equal(ref.level,"A1");
  assert.equal(ref.day,6);
  assert.equal(ref.sha256,"e4fc317a466a89d405cef01ff0f0dccbb1749fe9af74dc14c1c3983a6ce025ef");
  assert.equal(ref.duration,157.632);
  assert.equal(ref.status,"draft-timing-review-required");
  assert.ok(!ref.objectKey,"Do not invent the R2 path if the exact name was not supplied");
  const lines=videoLyricLines(song.lyrics);
  const cues=ref.cueStarts.map((start,i)=>({text:lines[i],start}));
  assert.equal(lines.length,40);
  assert.equal(validateLyricCues(cues,lines).length,40);
  assert.ok(cues[0].start>=0 && cues.at(-1).start<ref.duration);
  const video=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(video,/A1_DAY6_FINAL_RECORDING/);
  assert.match(video,/hash!==reference.sha256/);
  assert.match(video,/hash===draftReference.sha256/);
  assert.match(video,/x.level===publishedTrack\?\.level/);
});

test("A1 Day 10 uses approved Das gehört mir lyrics and the actual song recording", () => {
  const song=getReusableSongDraft("A1-6");
  assert.equal(song.title,"Das gehört mir!");
  assert.match(song.musicStyle,/94 BPM/);
  assert.match(song.lyrics,/Ich habe eine kleine Tasche/);
  assert.match(song.lyrics,/Meine Tasche ist dunkelblau/);
  assert.match(song.lyrics,/Und diese Jacke gehört dir/);
  assert.match(song.lyrics,/Mein und dein, das ist ganz leicht/);
  assert.match(song.lyrics,/Mein Fahrrad ist rot und klein/);
  assert.match(song.lyrics,/Was gehört denn dir dazu/);
  assert.doesNotMatch(song.lyrics,/Im Bus liegt eine Tasche/);
  assert.equal((song.lyrics.match(/Zeig mir deine Sachen hier!/g)||[]).length,5);
  const ref=A1_DAY10_FINAL_RECORDING;
  assert.equal(ref.assignmentKey,"A1-6");
  assert.equal(ref.title,song.title);
  assert.equal(ref.level,"A1");
  assert.equal(ref.day,10);
  assert.equal(ref.objectKey,"music/a1/day-10/Das gehört mir.mp3");
  assert.equal(ref.sha256,"91c236dc372b81e93b4a99c860ed9065d78dad84d5997ee7cc7fc5f11f422788");
  assert.equal(ref.duration,136.8);
  assert.equal(ref.status,"draft-timing-review-required");
  const lines=videoLyricLines(song.lyrics);
  const cues=ref.cueStarts.map((start,i)=>({text:lines[i],start}));
  assert.equal(lines.length,43);
  assert.equal(validateLyricCues(cues,lines).length,lines.length);
  assert.ok(cues[0].start>0 && cues.at(-1).start<ref.duration);
  const video=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(video,/A1_DAY10_FINAL_RECORDING/);
  assert.match(video,/hash!==reference.sha256/);
  assert.match(video,/hash===draftReference.sha256/);
  assert.match(video,/timingReview/);
  const page=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  assert.match(page,/obsoleteA1Day10Draft/);
  const questions=readFileSync(new URL("../src/data/musicQuestionSeedsA1.js",import.meta.url),"utf8");
  assert.match(questions,/Welche Farbe hat die Tasche der singenden Person/);
  assert.match(questions,/Was liegt neben dem Handy/);
  assert.doesNotMatch(questions,/Wo liegt Bens schwarzer Schal/);
});

test("A1 Day 11 keeps approved Tagesablauf lyrics and never invents unverified timing", () => {
  const song=getReusableSongDraft("A1-7");
  assert.equal(song.title,"Mein Tag – Von morgens bis abends");
  assert.match(song.musicStyle,/96 BPM/);
  assert.match(song.lyrics,/Um sieben Uhr stehe ich auf/);
  assert.match(song.lyrics,/Mein Deutschkurs fängt um neun Uhr an/);
  assert.match(song.lyrics,/Von neun bis zwölf lerne ich Deutsch/);
  assert.match(song.lyrics,/Um halb neun lese ich ein Buch/);
  assert.match(song.lyrics,/Wie spät ist es\? Wie viel Uhr haben wir\?/);
  assert.match(song.lyrics,/Und ein neuer Tag beginnt/);
  assert.doesNotMatch(song.lyrics,/Um acht trinke ich Tee/);
  const lines=videoLyricLines(song.lyrics);
  assert.equal(lines.length,44);
  const studio=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(studio,/music\/a1\/day-11\/Mein Tag – Von morgens bis\.mp3/);
  assert.match(studio,/"music\/a1\/day-11\/Mein Tag – Von morgens bis\.mp3":"A1-7"/);
  assert.match(studio,/No unverified timestamps have been inserted/);
  const page=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  assert.match(page,/obsoleteA1Day11Draft/);
  const questions=readFileSync(new URL("../src/data/musicQuestionSeedsA1.js",import.meta.url),"utf8");
  assert.match(questions,/Was macht die Person um halb neun am Abend/);
  assert.match(questions,/Sie liest ein Buch/);
});

test("A1 Day 12 Zeit und Datum keeps the user-supplied 44 lyric lines, correct lesson and R2 key", () => {
  const song=getReusableSongDraft("A1-8");
  assert.equal(song.title,"Zeit und Datum – Das ganze Jahr");
  assert.match(song.musicStyle,/96 BPM/);
  assert.match(song.lyrics,/Mein Handy zeigt vierzehn Uhr/);
  assert.match(song.lyrics,/Um sechzehn Uhr treffe ich Freunde/);
  assert.match(song.lyrics,/Um zweiundzwanzig Uhr gehe ich schlafen/);
  assert.match(song.lyrics,/Januar, Februar, März und April/);
  assert.match(song.lyrics,/Im Mai habe ich Geburtstag/);
  assert.match(song.lyrics,/Im Dezember feiern wir zusammen/);
  assert.match(song.lyrics,/Heute ist der dritte Mai/);
  assert.doesNotMatch(song.lyrics,/Mia fragt: Wann treffen wir uns/);
  const lines=videoLyricLines(song.lyrics);
  assert.equal(lines.length,44);
  const studio=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(studio,/"music\/a1\/day-12\/Zeit und Datum\.mp3":"A1-8"/);
  assert.match(studio,/setCues\(\[\]\)/);
  assert.match(studio,/No unverified timestamps have been inserted/);
  const page=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  assert.match(page,/obsoleteA1Day12Draft/);
  const questions=readFileSync(new URL("../src/data/musicQuestionSeedsA1.js",import.meta.url),"utf8");
  assert.match(questions,/In welchem Monat hat die Person Geburtstag/);
  assert.match(questions,/Im Mai/);
});

test("A1 Day 17 Wo ist der Bahnhof keeps full directions and timing for its exact MP3",()=>{
  const song=getReusableSongDraft("A1-11");
  const reference=A1_DAY17_FINAL_RECORDING;
  assert.equal(song.title,"Wo ist der Bahnhof?");
  assert.match(song.musicStyle,/95 BPM/);
  for(const line of [
    "Ich bin heute in einer neuen Stadt",
    "Ich stehe vor dem Rathaus",
    "Dann kommen Sie zur Ampel",
    "Geradeaus und dann nach rechts",
    "An der Ampel biege ich rechts ab",
    "Jetzt kenne ich den Weg",
    "Wie schön, dass ich den Weg jetzt kann",
  ]) assert.ok(song.lyrics.includes(line),line);
  assert.doesNotMatch(song.lyrics,/Dann gehen Sie nach links\./);
  assert.equal(reference.assignmentKey,"A1-11");
  assert.equal(reference.title,song.title);
  assert.equal(reference.day,17);
  assert.equal(reference.level,"A1");
  assert.equal(reference.objectKey,"music/a1/day-17/Wo ist der Bahnhof_.mp3");
  assert.equal(reference.sha256,"e71ab6989d1d075b5d70e7c0da7c62ea2f004f429b327fefc019728d259b505a");
  assert.equal(reference.duration,144.984);
  assert.equal(reference.status,"draft-timing-review-required");
  const lines=videoLyricLines(song.lyrics);
  const cues=reference.cueStarts.map((start,i)=>({start,text:lines[i]}));
  assert.equal(lines.length,44);
  assert.equal(validateLyricCues(cues,lines).length,44);
  assert.ok(cues.every((c,i)=>i===0||c.start>cues[i-1].start));
  assert.ok(cues.at(-1).start<reference.duration);
});
test("A1 Day 18 Wo ist mein Schlüssel keeps full locations and timing for its exact MP3",()=>{
  const song=getReusableSongDraft("A1-12.1");
  const reference=A1_DAY18_FINAL_RECORDING;
  assert.equal(song.title,"Wo ist mein Schlüssel?");
  assert.match(song.musicStyle,/95 BPM/);
  for(const line of [
    "Ich möchte heute einkaufen gehen",
    "Vielleicht liegt er unter dem Bett",
    "Unter dem Stuhl oder hinter der Tür",
    "Zwischen den Büchern im Regal",
    "Unter dem Buch liegt mein Schlüssel",
    "Jetzt können wir endlich gehen",
    "Jetzt habe ich meinen Schlüssel",
    "Jetzt kann der Tag beginnen",
  ]) assert.ok(song.lyrics.includes(line),line);
  assert.doesNotMatch(song.lyrics,/Bei Falowen weiß ich, wo es liegt/);
  assert.equal(reference.assignmentKey,"A1-12.1");
  assert.equal(reference.day,18);
  assert.equal(reference.level,"A1");
  assert.equal(reference.title,song.title);
  assert.equal(reference.objectKey,"music/a1/day-18/Wo ist mein Schlüssel_.mp3");
  assert.equal(reference.sha256,"78f01a9df35bb0ea09b8218a730ab190ede2f4c91ed7d7cf163611ffa516b54e");
  assert.equal(reference.duration,148.68);
  assert.equal(reference.status,"draft-timing-review-required");
  const lines=videoLyricLines(song.lyrics);
  const cues=reference.cueStarts.map((start,i)=>({start,text:lines[i]}));
  assert.equal(lines.length,44);
  assert.equal(validateLyricCues(cues,lines).length,44);
  assert.ok(cues.every((c,i)=>i===0||c.start>cues[i-1].start));
  assert.ok(cues.at(-1).start<reference.duration);
});
test("A1 Day 17–18 load recording-specific cues without replacing teacher-revised lyrics",()=>{
  const studio=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  const page=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  const questionSeeds=readFileSync(new URL("../src/data/musicQuestionSeedsA1.js",import.meta.url),"utf8");
  assert.match(studio,/A1_DAY17_FINAL_RECORDING/);
  assert.match(studio,/A1_DAY18_FINAL_RECORDING/);
  assert.match(studio,/hash!==reference.sha256/);
  assert.match(studio,/hash===draftReference.sha256/);
  assert.match(studio,/timingReview/);
  assert.match(page,/obsoleteA1Day17Draft/);
  assert.match(page,/obsoleteA1Day18Draft/);
  assert.match(questionSeeds,/Wo steht die Person, als sie nach dem Bahnhof fragt/);
  assert.match(questionSeeds,/Wo findet Mia den Schlüssel/);
});

test("A1 Day 21 weather cancellation uses the new approved full song with no invented audio timing",()=>{
  const song=getReusableSongDraft("A1-13");
  assert.equal(song.title,"Heute kann ich leider nicht");
  assert.match(song.musicStyle,/Gentle Afrobeat/);
  for(const line of [
    "Heute ist das Wetter schlecht",
    "Ich möchte Mia im Park treffen",
    "Heute kann ich leider nicht",
    "Heute muss ich leider absagen",
    "Am Nachmittag kommt ein Gewitter",
    "Mia schreibt: „Morgen um drei?“",
    "Ich treffe Mia um drei im Park",
  ]) assert.ok(song.lyrics.includes(line),line);
  assert.doesNotMatch(song.lyrics,/Mia fragt: Wie ist das Wetter/);
  assert.equal(videoLyricLines(song.lyrics).length,36);
  const studio=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(studio,/"music\/a1\/day-21\/Heute kann ich leider nicht\.mp3":"A1-13"/);
  const page=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  assert.match(page,/obsoleteA1Day21Draft/);
  const seeds=readFileSync(new URL("../src/data/musicQuestionSeedsA1.js",import.meta.url),"utf8");
  assert.match(seeds,/Warum sagt die Person das Treffen mit Mia ab/);
  assert.match(seeds,/Morgen um drei Uhr/);
});
test("A1 Day 22 Arzttermin lyrics and reviewed-file gate match the uploaded MP3",()=>{
  const song=getReusableSongDraft("A1-14.1");
  assert.equal(song.title,"Arzttermin");
  assert.match(song.musicStyle,/Soft Piano/);
  for(const line of [
    "Heute fühle ich mich nicht gut",
    "Mein Kopf tut weh, mein Hals ist rot",
    "Die Frau sagt: „Ja, um zehn Uhr.“",
    "Mir geht es nicht gut, ich bin krank",
    "Ich möchte einen Termin beim Arzt",
    "Er fragt mich: „Was fehlt Ihnen?“",
    "und bleiben Sie heute zu Haus",
    "Ich gehe danach zur Apotheke",
    "Dann bin ich wieder fit",
  ]) assert.ok(song.lyrics.includes(line),line);
  assert.doesNotMatch(song.lyrics,/Am Morgen rufe ich Mia an/);
  const rec=A1_DAY22_FINAL_RECORDING;
  assert.equal(rec.assignmentKey,"A1-14.1");
  assert.equal(rec.title,song.title);
  assert.equal(rec.day,22);
  assert.equal(rec.level,"A1");
  assert.equal(rec.objectKey,"music/a1/day-22/Arzttermin.mp3");
  assert.equal(rec.sha256,"2ec00cb7004809e6b34e103e943ac1a6fe29d9bab4d410f4febe0d00412a349b");
  assert.equal(rec.duration,176.76);
  assert.equal(rec.status,"draft-timing-review-required");
  const lines=videoLyricLines(song.lyrics);
  const cues=rec.cueStarts.map((start,i)=>({start,text:lines[i]}));
  assert.equal(lines.length,33);
  assert.equal(validateLyricCues(cues,lines).length,33);
  assert.ok(cues.every((c,i)=>i===0||c.start>cues[i-1].start));
  assert.ok(cues.at(-1).start<rec.duration);
  const studio=readFileSync(new URL("../src/components/MusicLyricsVideoStudio.jsx",import.meta.url),"utf8");
  assert.match(studio,/A1_DAY22_FINAL_RECORDING/);
  assert.match(studio,/day22Replacement/);
  assert.match(studio,/hash===draftReference.sha256/);
  assert.match(studio,/timingReview/);
  assert.match(studio,/published MP3 could not be verified/);
  const page=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  assert.match(page,/obsoleteA1Day22Draft/);
  const seeds=readFileSync(new URL("../src/data/musicQuestionSeedsA1.js",import.meta.url),"utf8");
  assert.match(seeds,/Um wie viel Uhr hat die Person einen Arzttermin/);
  assert.match(seeds,/Viel Wasser trinken und heute zu Hause bleiben/);
});
