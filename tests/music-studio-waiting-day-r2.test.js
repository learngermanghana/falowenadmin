import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildFalowenMusicPrompt, musicLyricLimit } from "../src/utils/musicGenerationPrompt.js";
import { waitingRoomMusicObjectKey, waitingRoomMusicUrl, waitingRoomMusicPlaylistForSession } from "../src/utils/waitingRoomDayMusic.js";

test("full-song prompt puts vocals in front and preserves a final outro without hard two-minute cutoff", () => {
  const prompt = buildFalowenMusicPrompt({ brief: "Warm German-English lesson song", context: "A1 Day 1", mode: "song", durationSeconds: 150,
    vocalMode: "voice", backingLevel: "very-soft", lyrics: "[Verse] Hallo, guten Morgen!\n[Chorus] Gemeinsam schaffen wir das!" });
  assert.match(prompt, /approximately 2:30 song/);
  assert.match(prompt, /10–14 dB below the lead voice/);
  assert.match(prompt, /Reserve the last 20 seconds.*OUTRO/i);
  assert.match(prompt, /final sustained chord/);
  assert.match(prompt, /6–10 second fade/);
  assert.doesNotMatch(prompt, /Aim for a complete song around two minutes long/);
  assert.equal(musicLyricLimit("song", 150), 170);
});

test("duration and lyrics safety prevent billed generations that cannot fit the song", () => {
  const text = Array.from({ length: 220 }, () => "Hallo").join(" ");
  assert.throws(() => buildFalowenMusicPrompt({ brief: "A1 lesson", lyrics: text, mode: "song", durationSeconds: 120 }), /Shorten the lyrics or choose a longer song/);
  assert.doesNotThrow(() => buildFalowenMusicPrompt({ brief: "A1 lesson", lyrics: text.slice(0, 200), mode: "song", durationSeconds: 180 }));
  assert.throws(() => buildFalowenMusicPrompt({ brief: "A1 lesson", mode: "song", durationSeconds: 400 }), /duration/);
  assert.throws(() => buildFalowenMusicPrompt({ brief: "A1 lesson", vocalMode: "instrumental", lyrics: "Hallo" }), /Instrumental/);
  const clip = buildFalowenMusicPrompt({ brief: "Soft guitar", mode: "clip", vocalMode: "instrumental" });
  assert.match(clip, /30-second preview/);
  assert.match(clip, /no singer/);
  assert.match(clip, /Never stop mid-word/);
});

test("numbered waiting-room music maps each level/day to one R2 object and rejects invalid paths", () => {
  assert.equal(waitingRoomMusicObjectKey("A1", 1), "a1/day-01/zoom-01.mp3");
  assert.equal(waitingRoomMusicObjectKey("B1", 26), "b1/day-26/zoom-01.mp3");
  assert.equal(waitingRoomMusicObjectKey("A2", 0), "");
  assert.equal(waitingRoomMusicObjectKey("A1", "daz-01"), "");
  assert.equal(waitingRoomMusicUrl({ level: "A1", day: 1, publicBaseUrl: "https://music.example.org/" }), "https://music.example.org/a1/day-01/zoom-01.mp3");
  assert.equal(waitingRoomMusicUrl({ level: "A1", day: 1, publicBaseUrl: "http://music.example.org" }), "");
  assert.equal(waitingRoomMusicUrl({ level: "A1", day: 1, publicBaseUrl: "https://mybucket.123.r2.cloudflarestorage.com" }), "");
});

test("day song is first and repeats; original playlist safely remains when R2 is not configured", () => {
  const original = [{ id: "fallback", src: "/existing.mp3", title: "General music" }];
  assert.equal(waitingRoomMusicPlaylistForSession({ level: "A1", day: 1, fallbackPlaylist: original }), original);
  const selected = waitingRoomMusicPlaylistForSession({ level: "A1", day: 1, publicBaseUrl: "https://music.example.org", fallbackPlaylist: original });
  assert.equal(selected[0].repeat, true);
  assert.equal(selected[0].src, "https://music.example.org/a1/day-01/zoom-01.mp3");
  assert.equal(selected[1].id, "fallback");
  const player = readFileSync(new URL("../src/utils/pianoAudio.js", import.meta.url), "utf8");
  assert.match(player, /audio\.crossOrigin = "anonymous"/);
  assert.match(player, /track\?\.repeat \? player\.index/);
  assert.match(player, /await playTrack\(1\)/);
  const page = readFileSync(new URL("../src/pages/CheckinDisplayPage.jsx", import.meta.url), "utf8");
  assert.match(page, /playlist: waitingSessionPlaylist/);
  assert.match(page, /presenterCurriculumDay/);
  assert.match(page, /VITE_WAITING_ROOM_R2_PUBLIC_BASE_URL/);
});
