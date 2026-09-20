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


test("check-in display is a live classroom attendance screen", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const service = fs.readFileSync(path.join(repoRoot, "src", "services", "attendanceService.js"), "utf8");

  assert.match(page, /subscribeSessionCheckins/);
  assert.match(page, /checkin-display-attendance-count/);
  assert.match(page, /QRCodeCanvas value=\{checkinUrl\} size=\{320\}/);
  assert.match(page, /Student names are hidden on the projector by default/);
  assert.match(page, /requestFullscreen/);
  assert.match(page, /Copy check-in link/);
  assert.doesNotMatch(page, /expectedStudents: String/);

  assert.match(service, /export function subscribeSessionCheckins/);
  assert.match(service, /onSnapshot\(/);
});

test("scheduled start is a soft threshold controlled by the teacher", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /Start class now/);
  assert.match(page, /delayClassStart\(5\)/);
  assert.match(page, /delayClassStart\(10\)/);
  assert.match(page, /The class begins only when the teacher presses Start class now/);
  assert.match(page, /musicVolume \* 0\.35/);
  assert.match(page, /handleStartClassNow/);
  assert.match(page, /scheduleStartChime\(context, masterGain\)/);
  assert.match(page, /classStartStopTimerRef/);
  assert.doesNotMatch(page, /autoStoppedMusicRef/);
});

test("teacher delay and actual start survive a projector refresh", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /classStartDecisionStorageKey/);
  assert.match(page, /readClassStartDecision/);
  assert.match(page, /writeClassStartDecision/);
  assert.match(page, /window\.localStorage\.setItem/);
  assert.match(page, /actualStartedAt/);
  assert.match(page, /delayUntil/);
});

test("music can continue after scheduled time until teacher starts class", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /Scheduled start time reached/);
  assert.match(page, /Waiting-room music can continue quietly/);
  assert.match(page, /disabled=\{!musicPlaying && Boolean\(actualStartedAt\)\}/);
  assert.match(page, /masterGain\.gain\.setTargetAtTime\(\s*Math\.max\(0\.05, musicVolume \* 0\.35\)/);
});
