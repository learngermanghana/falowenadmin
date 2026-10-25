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
  assert.match(source,/Falowen song for video export/);
  assert.match(source,/await addSocialMusic\(context, output, falowenTrack/);
  assert.match(source,/output.stream.getAudioTracks\(\)/);
});
test("challenge MP4 supports the same Falowen songs", () => {
  const source = read("src/components/SocialGermanChallenges.jsx");
  assert.match(source,/Falowen background song for video/);
  assert.match(source,/await addSocialMusic\(audioContext, output, falowenTrack/);
  assert.match(source,/output.stream.getAudioTracks\(\)/);
});

test("soundtrack starts and fades on the recorder clock, after loading completes", async () => {
  const { addSocialMusic } = await import("../src/utils/socialMusicLibrary.js");
  const previousFetch = globalThis.fetch;
  const starts=[],stops=[],gains=[];
  const source={connect(){},start(time){starts.push(time)},stop(time){stops.push(time)}};
  const context={currentTime:2,decodeAudioData:async()=>({}),createBufferSource:()=>source,createGain:()=>({connect(){},gain:{setValueAtTime:(value,time)=>gains.push([value,time]),linearRampToValueAtTime:(value,time)=>gains.push([value,time])}})};
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});
  try {
    const soundtrack=await addSocialMusic(context,{},"gemeinsam",12);
    assert.deepEqual(starts,[]);
    context.currentTime=30;
    soundtrack.start();soundtrack.start();
    assert.deepEqual(starts,[30]);
    assert.deepEqual(stops,[42.05]);
    assert.equal(gains.at(-1)[1],42);
    assert.equal(await addSocialMusic(context,{},"none",12),null);
  } finally { globalThis.fetch=previousFetch; }
});
