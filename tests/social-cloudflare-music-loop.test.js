import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { addSocialMusic, loadSocialCloudflareTracks, socialMusicRange, validCloudflareSocialTrack } from "../src/utils/socialMusicLibrary.js";

const api = "https://www.falowen.app/api/music?track=r2-a1-day-01-song";
const row = {
  id: "r2-a1-day-01-song", objectKey: "music/a1/day-01/Ein nettes Gespräch.mp3",
  title: "Ein nettes Gespräch", day: 1, level: "A1", audioUrl: api,
};
test("Cloudflare music catalog only accepts published music API tracks", async () => {
  const clean = validCloudflareSocialTrack(row);
  assert.equal(clean.src, api + "&download=1");
  assert.equal(validCloudflareSocialTrack({ ...row, audioUrl: "https://dash.cloudflare.com/a" }), null);
  assert.equal(validCloudflareSocialTrack({ ...row, objectKey: "private/other.mp3" }), null);
  const before = globalThis.fetch;
  let queried = "";
  globalThis.fetch = async (url) => {
    queried = url;
    return { ok: true, json: async () => ({ tracks: [row, { ...row, audioUrl: "https://other.example/song" }] }) };
  };
  try {
    const songs = await loadSocialCloudflareTracks();
    assert.equal(queried, "/api/attendance-music-library");
    assert.equal(songs.length, 1);
    assert.equal(songs[0].id, row.id);
  } finally { globalThis.fetch = before; }
});

test("selected start and end remain inside the recording", () => {
  assert.deepEqual(socialMusicRange({ start: 21, end: 35 }, 120), { start: 21, end: 35 });
  assert.deepEqual(socialMusicRange({ start: 7, end: 0 }, 60), { start: 7, end: 60 });
  assert.throws(() => socialMusicRange({ start: 35, end: 20 }, 100), /loop/i);
  assert.throws(() => socialMusicRange({ start: 99, end: 120 }, 100), /loop/i);
});
test("song segment repeats from the selected offset and fades when video ends", async () => {
  const prior = globalThis.fetch;
  const buffer = { duration: 91 };
  const started = []; const stopped = []; const fades = [];
  const source = { connect() {}, start(...args) { started.push(args); }, stop(time) { stopped.push(time); } };
  const context = {
    currentTime: 3,
    decodeAudioData: async () => buffer,
    createBufferSource: () => source,
    createGain: () => ({ connect() {}, gain: {
      setValueAtTime(value,time) { fades.push([value,time]); },
      linearRampToValueAtTime(value,time) { fades.push([value,time]); },
    }}),
  };
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(2) });
  try {
    const track = validCloudflareSocialTrack(row);
    const soundtrack = await addSocialMusic(context, {}, track.id, 15, .22,
      { tracks: [track], selection: { start: 12.5, end: 18.5 } });
    assert.equal(source.loop, true);
    assert.equal(source.loopStart, 12.5);
    assert.equal(source.loopEnd, 18.5);
    context.currentTime = 9;
    soundtrack.start(); soundtrack.start();
    assert.deepEqual(started, [[9,12.5]]);
    assert.deepEqual(stopped, [24.05]);
    assert.equal(fades.at(-1)[1], 24);
  } finally { globalThis.fetch = prior; }
});
test("social video editors share Cloudflare picker and Upcoming Classes keeps PNG campaign export", () => {
  const page = readFileSync(new URL("../src/pages/SocialMediaPage.jsx", import.meta.url), "utf8");
  const challenge = readFileSync(new URL("../src/components/SocialGermanChallenges.jsx", import.meta.url), "utf8");
  const vocab = readFileSync(new URL("../src/components/SocialVocabularyVideoCreator.jsx", import.meta.url), "utf8");
  for (const source of [page, challenge, vocab]) {
    assert.match(source, /SocialMusicPicker/);
    assert.match(source, /selection: .*Selection/);
  }
  assert.match(page, /exportClassVideo/);
  assert.match(page, /createClassCampaign/);
  assert.match(page, /downloadCampaignPack/);
  assert.match(page, /Export PNG/);
  assert.match(page, /requireValidSocialVideo/);
});
