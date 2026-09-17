import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { waitingMusicPlaylist } from "../src/data/pianoPlaylist.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function publicPathFromSrc(src) {
  return path.join(repoRoot, "public", decodeURIComponent(String(src || "").replace(/^\//, "")));
}

test("waiting room playlist points only to real public audio files", () => {
  assert.ok(waitingMusicPlaylist.length >= 1);
  assert.ok(waitingMusicPlaylist.some((track) => /Saxophone/i.test(track.title)));

  for (const track of waitingMusicPlaylist) {
    assert.match(track.src, /^\/.+\.mp3$/i);
    assert.equal(fs.existsSync(publicPathFromSrc(track.src)), true, `Missing public audio file for ${track.src}`);
  }
});

test("waiting room audio advances on ended instead of replaying a hard-coded source", () => {
  const source = fs.readFileSync(path.join(repoRoot, "src", "utils", "pianoAudio.js"), "utf8");
  assert.match(source, /startWaitingMusicPlaylist/);
  assert.match(source, /addEventListener\("ended"/);
  assert.match(source, /playTrack\(player\.index \+ 1\)/);
  assert.doesNotMatch(source, /WAITING_MUSIC_SRC/);
  assert.doesNotMatch(source, /audio\.loop\s*=\s*true/);
});

test("check-in display presents waiting room music and current track", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  assert.match(page, /Waiting room music/);
  assert.match(page, /startWaitingMusicPlaylist\(context, masterGain/);
  assert.match(page, /Now playing: \$\{currentMusicTrack\}/);
  assert.match(page, /Start waiting music/);
  assert.doesNotMatch(page, /Extended piano playlist/);
  assert.doesNotMatch(page, /PIANO_BAR_INTERVAL_MS/);
});
